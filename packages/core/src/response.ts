import { AxiosResponse } from 'axios'
import { fireErrorEvent, fireInvalidEvent, firePrefetchedEvent, fireSuccessEvent } from './events'
import { history, History } from './history'
import modal from './modal'
import { page as currentPage } from './page'
import { RequestParams } from './requestParams'
import { SessionStorage } from './sessionStorage'
import { ActiveVisit, ErrorBag, Errors, Page, Frame } from './types'
import { hrefToUrl, isSameUrlWithoutHash, setHashIfSameUrl } from './url'

class ResponseQueue {
  protected queue: Response[] = []
  protected processing = false

  public add(response: Response) {
    this.queue.push(response)
  }

  public async process(): Promise<void> {
    if (this.processing) {
      return Promise.resolve()
    }

    this.processing = true
    await this.processQueue()
    this.processing = false

    return Promise.resolve()
  }

  protected async processQueue(): Promise<void> {
    const nextResponse = this.queue.shift()

    if (nextResponse) {
      await nextResponse.process()
      return this.processQueue()
    }

    return Promise.resolve()
  }
}

const queue = new ResponseQueue()

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
    queue.add(this)
    return queue.process()
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

    await this.setFrame()
    const frame = this.response.headers['x-inertia-frame'] || this.requestParams.all().frame
    
    const errors = currentPage.frame(frame).props.errors || {}

    if (Object.keys(errors).length > 0) {
      const scopedErrors = this.getScopedErrors(errors)

      fireErrorEvent(scopedErrors)

      return this.requestParams.all().onError(scopedErrors)
    }
    
    fireSuccessEvent(currentPage.get())

    await this.requestParams.all().onSuccess(currentPage.get())

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

    if (fireInvalidEvent(response)) {
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

  protected async setFrame(): Promise<void> {
    const pageResponse = this.getDataFromResponse(this.response.data)

    if (!this.shouldSetFrame(pageResponse)) {
      return Promise.resolve()
    }

    this.mergeProps(pageResponse)
    await this.setRememberedState(pageResponse)

    this.requestParams.setPreserveOptions(pageResponse)
    
    pageResponse.url = history.preserveUrl ? currentPage.frame("_top").url : this.pageUrl(pageResponse)
    delete pageResponse.version
    const frame = this.response.headers['x-inertia-frame'] || this.requestParams.all().frame

    History.encryptHistory = pageResponse.encryptHistory
    if (pageResponse.clearHistory) {
      history.clear()
    }
    return currentPage.setFrame(
      frame, 
      pageResponse, {
      replace: this.requestParams.all().replace,
      preserveScroll: this.requestParams.all().preserveScroll,
      forgetState: this.requestParams.all().forgetState,
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

  protected shouldSetFrame(pageResponse: Frame): boolean {
    const frame = this.requestParams.all().frame
    if (!this.requestParams.all().async) {
      // If the request is sync, we should always set the page
      return true
    }

    if (this.originatingPage.frames[frame]?.component !== pageResponse.component) {
      // We originated from a component but the response re-directed us,
      // we should respect the redirection and set the page
      return true
    }

    // At this point, if the originating request component is different than the current component,
    // the user has since navigated and we should discard the response
    if (this.originatingPage.frames[frame]?.component !== currentPage.frame(frame).component) {
      return false
    }

    const originatingUrl = hrefToUrl(this.originatingPage.frames['_top'].url)
    const currentPageUrl = hrefToUrl(currentPage.frame("_top").url)

    // We have the same component, let's double-check the URL
    // If we're no longer on the same path name (e.g. /users/1 -> /users/2), we should not set the page
    return originatingUrl.origin === currentPageUrl.origin && originatingUrl.pathname === currentPageUrl.pathname
  }

  protected pageUrl(pageResponse: Frame) {
    const responseUrl = hrefToUrl(pageResponse.url)

    setHashIfSameUrl(this.requestParams.all().url, responseUrl)

    return responseUrl.href.split(responseUrl.host).pop()
  }

  protected mergeProps(pageResponse: Frame): void {
    const frame = this.requestParams.all().frame
    if (this.requestParams.isPartial() && pageResponse.component === currentPage.frame(frame).component) {
      const propsToMerge = pageResponse.mergeProps || []

      propsToMerge.forEach((prop) => {
        const incomingProp = pageResponse.props[prop]

        if (Array.isArray(incomingProp)) {
          pageResponse.props[prop] = [...((currentPage.frame(frame).props[prop] || []) as any[]), ...incomingProp]
        } else if (typeof incomingProp === 'object') {
          pageResponse.props[prop] = {
            ...((currentPage.frame(frame).props[prop] || []) as Record<string, any>),
            ...incomingProp,
          }
        }
      })

      pageResponse.props = { ...currentPage.frame(frame).props, ...pageResponse.props }
    }
  }

  protected async setRememberedState(pageResponse: Frame): Promise<void> {
    const rememberedFrames = await history.getState<Page['frames']>('frames', {})
    const frame = this.requestParams.all().frame
    const rememberedState = rememberedFrames[frame]?.rememberedState || {}
    if (
      this.requestParams.all().forgetState &&
      rememberedState &&
      pageResponse.component === currentPage.frame(frame).component
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
