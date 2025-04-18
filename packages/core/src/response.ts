import { AxiosResponse } from 'axios'
import { fireErrorEvent, fireInvalidEvent, firePrefetchedEvent, fireSuccessEvent } from './events'
import { history } from './history'
import modal from './modal'

import Queue from './queue'
import { RequestParams } from './requestParams'
import { SessionStorage } from './sessionStorage'
import { ActiveVisit, ErrorBag, Errors, Page } from './types'
import { hrefToUrl, isSameUrlWithoutHash, setHashIfSameUrl } from './url'
import { Router } from './router'

const queue = new Queue<Promise<boolean | void>>()

export class Response {
  constructor(
    protected requestParams: RequestParams,
    protected response: AxiosResponse,
    protected originatingPage: Page,
  ) {}

  public static create(params: RequestParams, response: AxiosResponse, originatingPage: Page): Response {
    return new Response(params, response, originatingPage)
  }

  public async handlePrefetch() {
    if (isSameUrlWithoutHash(this.requestParams.all().url, window.location)) {
      this.handle()
    }
  }

  public async handle() {
    return queue.add(() => this.process())
  }

  public async process() {
    if (this.requestParams.all().prefetch) {
      this.requestParams.all().prefetch = false

      this.requestParams.all().onPrefetched(this.response, this.requestParams.all())
      firePrefetchedEvent(this.response, this.requestParams.all())

      return Promise.resolve()
    }

    this.requestParams.runCallbacks()

    if (!this.isInertiaResponse()) {
      return this.handleNonInertiaResponse()
    }

    await history.processQueue()

    history.preserveUrl = this.requestParams.all().preserveUrl

    await this.setPage()

    const frame = this.response.headers['x-inertia-frame'] || this.requestParams.all().frame
    const currentPage = Router.for(frame).currentPage

    const errors = currentPage.get().props.errors || {}

    if (Object.keys(errors).length > 0) {
      const scopedErrors = this.getScopedErrors(errors)

      fireErrorEvent(scopedErrors, frame)

      return this.requestParams.all().onError(scopedErrors, frame)
    }

    fireSuccessEvent(currentPage.get(), frame)

    await this.requestParams.all().onSuccess(currentPage.get(), frame)

    history.preserveUrl = false
  }

  public mergeParams(params: ActiveVisit) {
    this.requestParams.merge(params)
  }

  protected async handleNonInertiaResponse() {
    if (this.isLocationVisit()) {
      const locationUrl = hrefToUrl(this.getHeader('x-inertia-location'))

      setHashIfSameUrl(this.requestParams.all().url, locationUrl)

      return this.locationVisit(locationUrl)
    }

    const response = {
      ...this.response,
      data: this.getDataFromResponse(this.response.data),
    }

    if (fireInvalidEvent(response, this.requestParams.all().frame)) {
      return modal.show(response.data)
    }
  }

  protected isInertiaResponse(): boolean {
    return this.hasHeader('x-inertia')
  }

  protected hasStatus(status: number): boolean {
    return this.response.status === status
  }

  protected getHeader(header: string): string {
    return this.response.headers[header]
  }

  protected hasHeader(header: string): boolean {
    return this.getHeader(header) !== undefined
  }

  protected isLocationVisit(): boolean {
    return this.hasStatus(409) && this.hasHeader('x-inertia-location')
  }

  /**
   * @link https://inertiajs.com/redirects#external-redirects
   */
  protected locationVisit(url: URL): boolean | void {
    try {
      SessionStorage.set(SessionStorage.locationVisitKey, {
        preserveScroll: this.requestParams.all().preserveScroll === true,
      })

      if (typeof window === 'undefined') {
        return
      }

      if (isSameUrlWithoutHash(window.location, url)) {
        window.location.reload()
      } else {
        window.location.href = url.href
      }
    } catch (error) {
      return false
    }
  }

  protected async setPage(): Promise<void> {
    const pageResponse = this.getDataFromResponse(this.response.data)

    if (!this.shouldSetPage(pageResponse)) {
      return Promise.resolve()
    }

    const frame = this.response.headers['x-inertia-frame'] || this.requestParams.all().frame
    const currentPage = Router.for(frame).currentPage

    this.mergeProps(pageResponse)
    await this.setRememberedState(pageResponse)

    this.requestParams.setPreserveOptions(pageResponse)

    // pageResponse.url = history.preserveUrl ? topUrl : this.pageUrl(pageResponse)

    return currentPage.set(pageResponse, {
      replace: this.requestParams.all().replace,
      preserveScroll: this.requestParams.all().preserveScroll,
      preserveState: this.requestParams.all().preserveState,
      preserveUrl: this.requestParams.all().preserveUrl
    })
  }

  protected getDataFromResponse(response: any): any {
    if (typeof response !== 'string') {
      return response
    }

    try {
      return JSON.parse(response)
    } catch (error) {
      return response
    }
  }

  protected shouldSetPage(pageResponse: Page): boolean {
    if (!this.requestParams.all().async) {
      // If the request is sync, we should always set the page
      return true
    }

    if (this.originatingPage.component !== pageResponse.component) {
      // We originated from a component but the response re-directed us,
      // we should respect the redirection and set the page
      return true
    }

    // At this point, if the originating request component is different than the current component,
    // the user has since navigated and we should discard the response
    const currentPage = Router.for(this.requestParams.all().frame).currentPage
    if (this.originatingPage.component !== currentPage.get().component) {
      return false
    }

    const originatingUrl = hrefToUrl(this.originatingPage.url)
    const currentPageUrl = hrefToUrl(currentPage.get().url)

    // We have the same component, let's double-check the URL
    // If we're no longer on the same path name (e.g. /users/1 -> /users/2), we should not set the page
    return originatingUrl.origin === currentPageUrl.origin && originatingUrl.pathname === currentPageUrl.pathname
  }

  protected pageUrl(pageResponse: Page) {
    const responseUrl = hrefToUrl(pageResponse.url)

    setHashIfSameUrl(this.requestParams.all().url, responseUrl)

    return responseUrl.pathname + responseUrl.search + responseUrl.hash
  }

  protected mergeProps(pageResponse: Page): void {
    const currentPage = Router.for(this.requestParams.all().frame).currentPage
    if (!this.requestParams.isPartial() || pageResponse.component !== currentPage.get().component) {
      return
    }

    const propsToMerge = pageResponse.mergeProps || []
    const propsToDeepMerge = pageResponse.deepMergeProps || []

    propsToMerge.forEach((prop) => {
      const incomingProp = pageResponse.props[prop]

      if (Array.isArray(incomingProp)) {
        pageResponse.props[prop] = [...((currentPage.get().props[prop] || []) as any[]), ...incomingProp]
      } else if (typeof incomingProp === 'object' && incomingProp !== null) {
        pageResponse.props[prop] = {
          ...((currentPage.get().props[prop] || []) as Record<string, any>),
          ...incomingProp,
        }
      }
    })

    propsToDeepMerge.forEach((prop) => {
      const incomingProp = pageResponse.props[prop]
      const currentProp = currentPage.get().props[prop]

      // Deep merge function to handle nested objects and arrays
      const deepMerge = (target: any, source: any) => {
        if (Array.isArray(source)) {
          // Merge arrays by concatenating the existing and incoming elements
          return [...(Array.isArray(target) ? target : []), ...source]
        }

        if (typeof source === 'object' && source !== null) {
          // Merge objects by iterating over keys
          return Object.keys(source).reduce(
            (acc, key) => {
              acc[key] = deepMerge(target ? target[key] : undefined, source[key])
              return acc
            },
            { ...target },
          )
        }

        // If the source is neither an array nor an object, return it directly
        return source
      }

      // Assign the deeply merged result back to props.
      pageResponse.props[prop] = deepMerge(currentProp, incomingProp)
    })

    pageResponse.props = { ...currentPage.get().props, ...pageResponse.props }
  }

  protected async setRememberedState(pageResponse: Page): Promise<void> {
    const rememberedState = await history.getState<Page['rememberedState']>(history.rememberedState, {})
    const currentPage = Router.for(this.requestParams.all().frame).currentPage
    if (
      this.requestParams.all().preserveState &&
      rememberedState &&
      pageResponse.component === currentPage.get().component
    ) {
      pageResponse.rememberedState = rememberedState
    }
  }

  protected getScopedErrors(errors: Errors & ErrorBag): Errors {
    if (!this.requestParams.all().errorBag) {
      return errors
    }

    return errors[this.requestParams.all().errorBag || ''] || {}
  }
}
