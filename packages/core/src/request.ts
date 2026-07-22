import { get } from 'es-toolkit/compat'
import {
  fireFinishEvent,
  fireNetworkErrorEvent,
  firePrefetchingEvent,
  fireProgressEvent,
  fireStartEvent,
} from './events'
import { http } from './http'
import { HttpCancelledError, HttpResponseError } from './httpErrors'
import { interceptors } from './interceptors'
import { page as currentPage } from './page'
import { RequestParams } from './requestParams'
import { Response } from './response'
import type { Router } from './router'
import type { ActiveVisit, Page } from './types'
import { HttpProgressEvent, HttpRequestConfig, HttpRequestHeaders } from './types'
import { urlWithoutHash } from './url'

export class Request {
  protected response!: Response
  protected cancelToken!: AbortController
  protected requestParams: RequestParams
  protected requestHasFinished = false
  protected optimistic: boolean
  protected router?: Router

  constructor(
    params: ActiveVisit,
    protected page: Page,
    { optimistic = false, router }: { optimistic?: boolean; router?: Router } = {},
  ) {
    this.requestParams = RequestParams.create(params)
    this.cancelToken = new AbortController()
    this.optimistic = optimistic
    this.router = router
  }

  public static create(params: ActiveVisit, page: Page, options?: { optimistic?: boolean; router?: Router }): Request {
    return new Request(params, page, options)
  }

  public isPrefetch(): boolean {
    return this.requestParams.isPrefetch()
  }

  public isOptimistic(): boolean {
    return this.optimistic
  }

  public isPendingOptimistic(): boolean {
    return this.isOptimistic() && (!this.response || !this.response.isProcessed())
  }

  public async send() {
    this.requestParams.onCancelToken(() => this.cancel({ cancelled: true }))

    fireStartEvent(this.requestParams.all())
    this.requestParams.onStart()

    if (this.requestParams.all().prefetch) {
      this.requestParams.onPrefetching()
      firePrefetchingEvent(this.requestParams.all())
    }

    // We capture this up here because the response
    // will clear the prefetch flag so it can use it
    // as a regular response once the prefetch is done
    const originallyPrefetch = this.requestParams.all().prefetch

    const config: HttpRequestConfig = {
      method: this.requestParams.all().method,
      url: urlWithoutHash(this.requestParams.all().url).href,
      data: this.requestParams.data(),
      signal: this.cancelToken.signal,
      headers: this.getHeaders(),
      onUploadProgress: this.onProgress.bind(this),
    }

    const processedConfig = await interceptors.processRequest(this.requestParams.all(), config)

    return http
      .getClient()
      .request(processedConfig)
      .then((response) => {
        this.response = Response.create(this.requestParams, response, this.page, this.router)

        return this.response.handle()
      })
      .catch((error) => {
        // Handle HTTP error responses (4xx/5xx)
        if (error instanceof HttpResponseError) {
          this.response = Response.create(this.requestParams, error.response, this.page, this.router)

          return this.response.handle()
        }

        return Promise.reject(error)
      })
      .catch((error) => {
        // Handle cancelled requests
        if (error instanceof HttpCancelledError) {
          return
        }

        if (this.requestParams.all().onNetworkError(error) === false) {
          return
        }

        if (fireNetworkErrorEvent(error)) {
          if (originallyPrefetch) {
            this.requestParams.onPrefetchError(error)
          }

          return Promise.reject(error)
        }
      })
      .finally(() => {
        this.finish()

        if (originallyPrefetch && this.response) {
          this.requestParams.onPrefetchResponse(this.response)
        }
      })
  }

  protected finish(): void {
    if (this.requestParams.wasCancelledAtAll()) {
      return
    }

    this.requestParams.markAsFinished()
    this.fireFinishEvents()
  }

  protected fireFinishEvents(): void {
    if (this.requestHasFinished) {
      // This could be called from multiple places, don't let it re-fire
      return
    }

    this.requestHasFinished = true

    fireFinishEvent(this.requestParams.all())
    this.requestParams.onFinish()
  }

  public cancel({ cancelled = false, interrupted = false }: { cancelled?: boolean; interrupted?: boolean }): void {
    if (this.requestHasFinished) {
      // If the request has already finished, there's no need to cancel it
      return
    }

    this.cancelToken.abort()

    this.requestParams.markAsCancelled({ cancelled, interrupted })

    this.fireFinishEvents()
  }

  protected onProgress(progress: HttpProgressEvent): void {
    if (this.requestParams.data() instanceof FormData) {
      fireProgressEvent(progress)
      this.requestParams.all().onProgress(progress)
    }
  }

  protected getHeaders(): HttpRequestHeaders {
    const headers: HttpRequestHeaders = {
      ...this.requestParams.headers(),
      Accept: 'text/html, application/xhtml+xml',
      'X-Requested-With': 'XMLHttpRequest',
      'X-Inertia': true,
    }

    // Always send the originating frame so the server can route the response back to it
    headers['X-Inertia-Frame'] = this.router?.frame ?? this.requestParams.all().frame

    // X-Inertia-Referer should reflect the originating frame's URL, not the
    // target frame (which may differ when a visit sets `frame: "_top"`).
    const sourceFrame = this.router?.frame ?? this.requestParams.all().frame
    const sourcePage = currentPage.get(sourceFrame)

    if (sourcePage.url) {
      headers['X-Inertia-Referer'] = sourcePage.url
    }

    const targetPage = currentPage.get(this.requestParams.all().frame)
    if (targetPage.version) {
      headers['X-Inertia-Version'] = targetPage.version
    }

    const onceProps = Object.entries(targetPage.onceProps || {})
      .filter(([, onceProp]) => {
        if (get(targetPage.props, onceProp.prop) === undefined) {
          // The prop could deferred and not be loaded yet
          return false
        }

        return !onceProp.expiresAt || onceProp.expiresAt > Date.now()
      })
      .map(([key]) => key)

    if (onceProps.length > 0) {
      headers['X-Inertia-Except-Once-Props'] = onceProps.join(',')
    }

    return headers
  }
}
