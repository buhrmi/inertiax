import { cloneDeep, isEqual } from 'es-toolkit'
import { get, set } from 'es-toolkit/compat'
import { progress } from '.'
import { config } from './config'
import { eventHandler } from './eventHandler'
import { fireBeforeEvent, fireClientVisitEvent, fireFlashEvent, fireNavigateEvent } from './events'
import { history } from './history'
import { InitialVisit } from './initialVisit'
import { stripTopLevelUndefined } from './objectUtils'
import { page as currentPage } from './page'
import { polls } from './polls'
import { prefetchedRequests } from './prefetched'
import Queue from './queue'
import { Request } from './request'
import { RequestParams } from './requestParams'
import { RequestStream } from './requestStream'
import { Scroll } from './scroll'
import {
  ActiveVisit,
  ClientSideVisitOptions,
  Component,
  FlashData,
  GlobalEvent,
  GlobalEventNames,
  GlobalEventResult,
  InFlightPrefetch,
  Method,
  OptimisticCallback,
  Page,
  PageFlashData,
  PendingVisit,
  PollOptions,
  PrefetchedResponse,
  PrefetchOptions,
  ReloadOptions,
  RequestPayload,
  RouterInitParams,
  UrlMethodPair,
  Visit,
  VisitCallbacks,
  VisitHelperOptions,
  VisitOptions,
} from './types'
import { uid } from './uid'
import {
  hrefToUrl,
  isSameUrlWithoutHash,
  isSameUrlWithoutQueryOrHash,
  isUrlMethodPair,
  transformUrlAndData,
} from './url'

const noop = () => {}
const DEFAULT_FRAME_ID = '_top'

export class Router {
  public readonly frameId: string

  protected syncRequestStream = new RequestStream({
    maxConcurrent: 1,
    interruptible: true,
  })

  protected asyncRequestStream = new RequestStream({
    maxConcurrent: Infinity,
    interruptible: false,
  })

  protected clientVisitQueue = new Queue<Promise<void>>()

  protected pendingOptimisticCallback: OptimisticCallback | undefined = undefined
  protected removePopstateHandler?: VoidFunction
  protected removePageshowHandler?: VoidFunction

  constructor(frameId = '_top') {
    this.frameId = frameId
  }

  public init<ComponentType = Component>({
    initialPage,
    resolveComponent,
    swapComponent,
    onFlash,
  }: RouterInitParams<ComponentType>): void {
    currentPage.init({
      initialPage,
      resolveComponent,
      swapComponent,
      onFlash,
    }, this.frameId)

    InitialVisit.handle(this.frameId)

    eventHandler.init()

    this.removePopstateHandler?.()
    this.removePageshowHandler?.()

    this.removePopstateHandler = eventHandler.registerPopstateHandler(this.frameId, (state) => {
      this.handleHistoryPopstate(state)
    })

    this.removePageshowHandler = eventHandler.registerPageshowHandler(this.frameId, () => {
      history.decrypt(null, this.frameId).catch(() => eventHandler.onMissingHistoryItem(this.frameId))
    })

    eventHandler.on('missingHistoryItem', (frameId?: string) => {
      if (frameId && frameId !== this.frameId) {
        return
      }

      if (typeof window !== 'undefined') {
        this.visit(window.location.href, { preserveState: true, preserveScroll: true, replace: true })
      }
    })

    eventHandler.on('loadDeferredProps', (frameId: string, deferredProps: Page['deferredProps']) => {
      if (frameId !== this.frameId) {
        return
      }

      this.loadDeferredProps(deferredProps)
    })

    eventHandler.on('historyQuotaExceeded', (frameId: string, url: string) => {
      if (frameId !== this.frameId) {
        return
      }

      window.location.href = url
    })
  }

  protected handleHistoryPopstate(state: any): void {
    if (typeof window === 'undefined') {
      return
    }

    if (state === null) {
      const page = currentPage.get(this.frameId)

      if (!page?.url) {
        return
      }

      const url = hrefToUrl(page.url)
      url.hash = window.location.hash

      history.replaceState({ ...currentPage.getWithoutFlashData(this.frameId), url: url.href }, null, this.frameId)
      Scroll.reset(this.frameId)

      return
    }

    if (!history.isValidState(state, this.frameId)) {
      // This popstate entry belongs to another frame.
      return
    }

    const frameState = history.getStateForFrame(state, this.frameId)

    if (!frameState?.page) {
      return
    }

    history
      .decrypt(frameState.page, this.frameId)
      .then((data) => {
        if (currentPage.get(this.frameId).version !== data.version) {
          eventHandler.onMissingHistoryItem(this.frameId)
          return
        }

        this.cancelAll({ prefetch: false })

        // If this frame's page hasn't changed, another frame pushed this
        // history entry.  Skip setQuietly/restore to avoid clobbering scroll.
        if (!currentPage.isCleared(this.frameId) && isEqual(currentPage.getWithoutFlashData(this.frameId), data)) {
          return
        }

        currentPage
          .setQuietly(data, { preserveState: this.frameId === DEFAULT_FRAME_ID }, this.frameId)
          .then(() => {
          Scroll.restore(history.getScrollRegions(), this.frameId)
          fireNavigateEvent(currentPage.get(this.frameId))

          const pendingDeferred: Record<string, string[]> = {}
          const pageProps = currentPage.get(this.frameId).props

          for (const [group, props] of Object.entries(data.initialDeferredProps ?? data.deferredProps ?? {})) {
            const missing = props.filter((prop) => get(pageProps, prop) === undefined)

            if (missing.length > 0) {
              pendingDeferred[group] = missing
            }
          }

          if (Object.keys(pendingDeferred).length > 0) {
            eventHandler.fireInternalEvent('loadDeferredProps', this.frameId, pendingDeferred)
          }
          })
      })
      .catch(() => {
        eventHandler.onMissingHistoryItem(this.frameId)
      })
  }

  public optimistic<TProps>(callback: OptimisticCallback<TProps>): this {
    this.pendingOptimisticCallback = callback as OptimisticCallback

    return this
  }

  public get<T extends RequestPayload = RequestPayload>(
    url: URL | string | UrlMethodPair,
    data: T = {} as T,
    options: VisitHelperOptions<T> = {},
  ): void {
    return this.visit(url, { ...options, method: 'get', data })
  }

  public post<T extends RequestPayload = RequestPayload>(
    url: URL | string | UrlMethodPair,
    data: T = {} as T,
    options: VisitHelperOptions<T> = {},
  ): void {
    return this.visit(url, { preserveState: true, ...options, method: 'post', data })
  }

  public put<T extends RequestPayload = RequestPayload>(
    url: URL | string | UrlMethodPair,
    data: T = {} as T,
    options: VisitHelperOptions<T> = {},
  ): void {
    return this.visit(url, { preserveState: true, ...options, method: 'put', data })
  }

  public patch<T extends RequestPayload = RequestPayload>(
    url: URL | string | UrlMethodPair,
    data: T = {} as T,
    options: VisitHelperOptions<T> = {},
  ): void {
    return this.visit(url, { preserveState: true, ...options, method: 'patch', data })
  }

  public delete<T extends RequestPayload = RequestPayload>(
    url: URL | string | UrlMethodPair,
    options: Omit<VisitOptions<T>, 'method'> = {},
  ): void {
    return this.visit(url, { preserveState: true, ...options, method: 'delete' })
  }

  public reload<T extends RequestPayload = RequestPayload>(options: ReloadOptions<T> = {}): void {
    return this.doReload(options)
  }

  protected doReload<T extends RequestPayload = RequestPayload>(
    options: ReloadOptions<T> & {
      deferredProps?: boolean
    } = {},
  ): void {
    if (typeof window === 'undefined') {
      return
    }

    return this.visit(window.location.href, {
      ...options,
      preserveScroll: true,
      preserveState: true,
      async: true,
      headers: {
        ...(options.headers || {}),
        'Cache-Control': 'no-cache',
      },
    })
  }

  public remember(data: unknown, key = 'default'): void {
    history.remember(data, key, this.frameId)
  }

  public restore<T = unknown>(key = 'default'): T | undefined {
    return history.restore(key, this.frameId) as T | undefined
  }

  /**
   * Restore scroll positions from history state for this frame.
   * Call after programmatically restoring a frame from history (e.g.
   * when mounting a Frame that loads page data from the history stack).
   */
  public restoreScroll(): void {
    Scroll.restore(history.getScrollRegions(), this.frameId)
  }

  public on<TEventName extends GlobalEventNames>(
    type: TEventName,
    callback: (event: GlobalEvent<TEventName>) => GlobalEventResult<TEventName>,
  ): VoidFunction {
    if (typeof window === 'undefined') {
      return () => {}
    }

    return eventHandler.onGlobalEvent(type, callback)
  }

  public once<TEventName extends GlobalEventNames>(
    type: TEventName,
    callback: (event: GlobalEvent<TEventName>) => GlobalEventResult<TEventName>,
  ): VoidFunction {
    if (typeof window === 'undefined') {
      return () => {}
    }

    const remove = this.on(type, (event) => {
      remove()
      return callback(event)
    })

    return remove
  }

  public hasPendingOptimistic(): boolean {
    return this.asyncRequestStream.hasPendingOptimistic()
  }

  public get activePolls(): number {
    return polls.count
  }

  public cancelAll({ async = true, prefetch = true, sync = true } = {}): void {
    if (async) {
      this.asyncRequestStream.cancelInFlight({ prefetch })
    }

    if (sync) {
      this.syncRequestStream.cancelInFlight()
    }
  }

  /**
   * Clean up all resources held by this router instance. Call this when the
   * frame that owns this router is unmounted. Safe to call multiple times.
   */
  public destroy(): void {
    this.cancelAll()
    this.removePopstateHandler?.()
    this.removePageshowHandler?.()
    this.removePopstateHandler = undefined
    this.removePageshowHandler = undefined
    // Only clean up per-frame stores for non-top frames (top-level page state
    // must persist for the lifetime of the app).
    if (this.frameId !== '_top') {
      currentPage.deleteFrame(this.frameId)
      history.deleteFrame(this.frameId)
    }
  }

  public poll(interval: number, requestOptions: ReloadOptions | (() => ReloadOptions) = {}, options: PollOptions = {}) {
    return polls.add(
      interval,
      ({ onStart, onFinish }) => {
        const resolved = typeof requestOptions === 'function' ? requestOptions() : requestOptions

        this.reload({
          preserveErrors: true,
          ...resolved,
          onCancelToken: (token) => {
            onStart(token.cancel)
            resolved.onCancelToken?.(token)
          },
          onFinish: (visit) => {
            onFinish()
            resolved.onFinish?.(visit)
          },
        })
      },
      {
        autoStart: options.autoStart ?? true,
        keepAlive: options.keepAlive ?? false,
        mode: options.mode,
      },
    )
  }

  public visit<T extends RequestPayload = RequestPayload>(
    href: string | URL | UrlMethodPair,
    options: VisitOptions<T> = {},
  ): void {
    options.optimistic = options.optimistic ?? this.pendingOptimisticCallback
    this.pendingOptimisticCallback = undefined

    if (options.optimistic) {
      options.async = options.async ?? true
    }

    const visit: PendingVisit = this.getPendingVisit(href, {
      ...options,
      showProgress: options.showProgress ?? (!options.async || !!options.optimistic),
    } as VisitOptions)

    const events = this.getVisitEvents(options as VisitOptions)

    // If either of these return false, we don't want to continue
    if (events.onBefore(visit) === false || !fireBeforeEvent(visit)) {
      return
    }

    const currentPageUrl = hrefToUrl(currentPage.get(this.frameId).url)
    const isPartialReload = visit.only.length > 0 || visit.except.length > 0 || visit.reset.length > 0

    // For partial reloads, only compare the base URL (origin + pathname) to allow
    // concurrent requests with different query params to the same page
    const isSamePage = isPartialReload
      ? isSameUrlWithoutQueryOrHash(visit.url, currentPageUrl)
      : isSameUrlWithoutHash(visit.url, currentPageUrl)

    if (!isSamePage) {
      // Only cancel non-prefetch requests (deferred props + partial reloads)
      this.asyncRequestStream.cancelInFlight({ prefetch: false, optimistic: false })
    }

    // Interrupt in-flight requests before taking the optimistic snapshot
    // so that any previous optimistic state is restored first
    if (!visit.async) {
      this.syncRequestStream.interruptInFlight()
    }

    if (options.optimistic) {
      this.applyOptimisticUpdate(options.optimistic, events)
    }

    const requestParams: PendingVisit & VisitCallbacks = {
      ...visit,
      ...events,
    }

    const sendRequest = () => {
      const prefetched = prefetchedRequests.get(requestParams)

      if (prefetched) {
        progress.reveal(prefetched.inFlight)
        prefetchedRequests.use(prefetched, requestParams)
      } else {
        progress.reveal(true)
        const requestStream = visit.async ? this.asyncRequestStream : this.syncRequestStream
        requestStream.send(Request.create(requestParams, currentPage.get(this.frameId), {
          optimistic: !!options.optimistic,
          router: this,
        }))
      }
    }

    if (Array.isArray(visit.component)) {
      console.error(
        `The "component" prop received an array of components (${visit.component.join(', ')}), but only a single component string is supported for instant visits. Pass an explicit component name instead.`,
      )
      visit.component = null
    }

    if (visit.component) {
      history.processQueue().then(() => {
        this.performInstantSwap(visit).then(() => {
          requestParams.preserveScroll = true
          requestParams.preserveState = true
          requestParams.replace = true
          requestParams.viewTransition = false
          sendRequest()
        })
      })
    } else {
      sendRequest()
    }
  }

  public getCached(
    href: string | URL | UrlMethodPair,
    options: VisitOptions = {},
  ): InFlightPrefetch | PrefetchedResponse | null {
    return prefetchedRequests.findCached(this.getPrefetchParams(href, options))
  }

  public flush(href: string | URL | UrlMethodPair, options: VisitOptions = {}): void {
    prefetchedRequests.remove(this.getPrefetchParams(href, options))
  }

  public flushAll(): void {
    prefetchedRequests.removeAll()
  }

  public flushByCacheTags(tags: string | string[]): void {
    prefetchedRequests.removeByTags(Array.isArray(tags) ? tags : [tags])
  }

  public getPrefetching(
    href: string | URL | UrlMethodPair,
    options: VisitOptions = {},
  ): InFlightPrefetch | PrefetchedResponse | null {
    return prefetchedRequests.findInFlight(this.getPrefetchParams(href, options))
  }

  public prefetch(
    href: string | URL | UrlMethodPair,
    options: VisitOptions = {},
    prefetchOptions: Partial<PrefetchOptions> = {},
  ) {
    const method: Method = options.method ?? (isUrlMethodPair(href) ? href.method : 'get')

    if (method !== 'get') {
      throw new Error('Prefetch requests must use the GET method')
    }

    const visit: PendingVisit = this.getPendingVisit(href, {
      ...options,
      async: true,
      showProgress: false,
      prefetch: true,
      viewTransition: false,
    })

    const visitUrl = visit.url.origin + visit.url.pathname + visit.url.search
    const currentUrl = window.location.origin + window.location.pathname + window.location.search

    if (visitUrl === currentUrl) {
      // Don't prefetch the current page, you're already on it
      return
    }

    const events = this.getVisitEvents(options)

    // If either of these return false, we don't want to continue
    if (events.onBefore(visit) === false || !fireBeforeEvent(visit)) {
      return
    }

    progress.hide()

    this.asyncRequestStream.interruptInFlight()

    const requestParams: PendingVisit & VisitCallbacks = {
      ...visit,
      ...events,
    }

    const ensureCurrentPageIsSet = (): Promise<void> => {
      return new Promise((resolve) => {
        const checkIfPageIsDefined = () => {
          if (currentPage.get(this.frameId)) {
            resolve()
          } else {
            setTimeout(checkIfPageIsDefined, 50)
          }
        }

        checkIfPageIsDefined()
      })
    }

    ensureCurrentPageIsSet().then(() => {
      prefetchedRequests.add(
        requestParams,
        (params) => {
          this.asyncRequestStream.send(Request.create(params, currentPage.get(this.frameId), { router: this }))
        },
        {
          cacheFor: config.get('prefetch.cacheFor'),
          cacheTags: [],
          ...prefetchOptions,
        },
      )
    })
  }

  public clearHistory(): void {
    history.clear()
  }

  public decryptHistory(): Promise<Page> {
    return history.decrypt(null, this.frameId)
  }

  public resolveComponent(component: string, page?: Page): Promise<Component> {
    return currentPage.resolve(component, page, this.frameId)
  }

  public replace<TProps = Page['props']>(params: ClientSideVisitOptions<TProps>): void {
    this.clientVisit(params, { replace: true })
  }

  public replaceProp<TProps = Page['props']>(
    name: string,
    value: unknown | ((oldValue: unknown, props: TProps) => unknown),
    options?: Pick<ClientSideVisitOptions, 'onError' | 'onFinish' | 'onSuccess'>,
  ): void {
    this.replace({
      preserveScroll: true,
      preserveState: true,
      props(currentProps) {
        const newValue = typeof value === 'function' ? value(get(currentProps, name), currentProps) : value

        return set(cloneDeep(currentProps), name, newValue)
      },
      ...(options || {}),
    })
  }

  public appendToProp<TProps = Page['props']>(
    name: string,
    value: unknown | unknown[] | ((oldValue: unknown, props: TProps) => unknown | unknown[]),
    options?: Pick<ClientSideVisitOptions, 'onError' | 'onFinish' | 'onSuccess'>,
  ): void {
    this.replaceProp(
      name,
      (currentValue: unknown, currentProps: TProps) => {
        const newValue = typeof value === 'function' ? value(currentValue, currentProps) : value

        if (!Array.isArray(currentValue)) {
          currentValue = currentValue !== undefined ? [currentValue] : []
        }

        return [...(currentValue as unknown[]), newValue]
      },
      options,
    )
  }

  public prependToProp<TProps = Page['props']>(
    name: string,
    value: unknown | unknown[] | ((oldValue: unknown, props: TProps) => unknown | unknown[]),
    options?: Pick<ClientSideVisitOptions, 'onError' | 'onFinish' | 'onSuccess'>,
  ): void {
    this.replaceProp(
      name,
      (currentValue: unknown, currentProps: TProps) => {
        const newValue = typeof value === 'function' ? value(currentValue, currentProps) : value

        if (!Array.isArray(currentValue)) {
          currentValue = currentValue !== undefined ? [currentValue] : []
        }

        return [newValue, ...(currentValue as unknown[])]
      },
      options,
    )
  }

  public push<TProps = Page['props']>(params: ClientSideVisitOptions<TProps>): void {
    this.clientVisit(params)
  }

  public flash<TFlash extends PageFlashData = PageFlashData>(
    keyOrData: string | ((flash: FlashData) => TFlash) | TFlash,
    value?: unknown,
  ): void {
    const current = currentPage.get(this.frameId).flash
    let flash: PageFlashData

    if (typeof keyOrData === 'function') {
      flash = keyOrData(current)
    } else if (typeof keyOrData === 'string') {
      flash = { ...current, [keyOrData]: value }
    } else if (keyOrData && Object.keys(keyOrData).length) {
      flash = { ...current, ...keyOrData }
    } else {
      return
    }

    currentPage.setFlash(flash, this.frameId)

    if (Object.keys(flash).length) {
      fireFlashEvent(flash)
    }
  }

  protected clientVisit<TProps = Page['props']>(
    params: ClientSideVisitOptions<TProps>,
    { replace = false }: { replace?: boolean } = {},
  ): void {
    this.clientVisitQueue.add(() => this.performClientVisit(params, { replace }))
  }

  protected performClientVisit<TProps = Page['props']>(
    params: ClientSideVisitOptions<TProps>,
    { replace = false }: { replace?: boolean } = {},
  ): Promise<void> {
    const current = currentPage.get(this.frameId)

    const onceProps =
      typeof params.props === 'function'
        ? Object.fromEntries(
            Object.values(current.onceProps ?? {}).map((onceProp) => [
              onceProp.prop,
              get(current.props, onceProp.prop),
            ]),
          )
        : {}

    const props =
      typeof params.props === 'function'
        ? params.props(current.props as TProps, onceProps as Partial<TProps>)
        : (params.props ?? current.props)

    const flash = typeof params.flash === 'function' ? params.flash(current.flash) : params.flash

    const { viewTransition, onError, onFinish, onFlash, onSuccess, ...pageParams } = params

    const page = {
      ...current,
      ...pageParams,
      flash: flash ?? {},
      props: props as Page['props'],
    }

    const preserveScroll = RequestParams.resolvePreserveOption(params.preserveScroll ?? false, page)
    const preserveState = RequestParams.resolvePreserveOption(params.preserveState ?? false, page)

    const visitId = this.createVisitId()

    return currentPage
      .set(page, {
        replace,
        updateBrowserUrl: params.updateBrowserUrl ?? this.frameId === DEFAULT_FRAME_ID,
        preserveScroll,
        preserveState,
        viewTransition,
        visitId,
      }, this.frameId)
      .then(() => {
        fireClientVisitEvent(currentPage.get(this.frameId), { replace, visitId })

        const currentFlash = currentPage.get(this.frameId).flash

        if (Object.keys(currentFlash).length > 0) {
          fireFlashEvent(currentFlash)
          onFlash?.(currentFlash)
        }

        const errors = currentPage.get(this.frameId).props.errors || {}

        if (Object.keys(errors).length === 0) {
          onSuccess?.(currentPage.get(this.frameId))
          return
        }

        const scopedErrors = params.errorBag ? errors[params.errorBag || ''] || {} : errors

        onError?.(scopedErrors)
      })
      .finally(() => onFinish?.(params))
  }

  protected performInstantSwap(visit: PendingVisit): Promise<void> {
    const current = currentPage.get(this.frameId)

    const sharedProps = Object.fromEntries(
      (current.sharedProps ?? []).filter((key) => key in current.props).map((key) => [key, current.props[key]]),
    )

    const resolvedPageProps =
      typeof visit.pageProps === 'function'
        ? visit.pageProps(cloneDeep(current.props), cloneDeep(sharedProps))
        : visit.pageProps

    const intermediateProps = resolvedPageProps !== null ? { ...resolvedPageProps } : { ...sharedProps }

    const intermediatePage: Page = {
      component: visit.component!,
      url: visit.url.pathname + visit.url.search + visit.url.hash,
      version: current.version,
      props: {
        ...intermediateProps,
        errors: {},
      },
      flash: {},
      rescuedProps: [],
      clearHistory: false,
      encryptHistory: current.encryptHistory,
      sharedProps: current.sharedProps,
      rememberedState: {},
    }

    return currentPage.set(intermediatePage, {
      replace: visit.replace,
      updateBrowserUrl: visit.updateBrowserUrl,
      preserveScroll: RequestParams.resolvePreserveOption(visit.preserveScroll, intermediatePage),
      preserveState: false,
      viewTransition: visit.viewTransition,
      visitId: visit.id,
    }, this.frameId)
  }

  protected getPrefetchParams(href: string | URL | UrlMethodPair, options: VisitOptions): ActiveVisit {
    return {
      ...this.getPendingVisit(href, {
        ...options,
        async: true,
        showProgress: false,
        prefetch: true,
        viewTransition: false,
      }),
      ...this.getVisitEvents(options),
    }
  }

  protected createVisitId(): string {
    return uid()
  }

  protected getPendingVisit(href: string | URL | UrlMethodPair, options: VisitOptions): PendingVisit {
    if (isUrlMethodPair(href)) {
      const urlMethodPair = href
      href = urlMethodPair.url
      options.method = options.method ?? urlMethodPair.method
    }

    const defaultVisitOptionsCallback = config.get('visitOptions')

    const configuredOptions = defaultVisitOptionsCallback
      ? defaultVisitOptionsCallback(href.toString(), cloneDeep(options)) || {}
      : {}

    const mergedOptions: Visit = {
      frameId: this.frameId,
      method: 'get',
      data: {},
      replace: false,
      updateBrowserUrl: this.frameId === DEFAULT_FRAME_ID,
      preserveScroll: false,
      preserveState: false,
      only: [],
      except: [],
      headers: {},
      errorBag: '',
      forceFormData: false,
      queryStringArrayFormat: 'brackets',
      async: false,
      showProgress: true,
      fresh: false,
      reset: [],
      preserveUrl: false,
      preserveErrors: false,
      prefetch: false,
      invalidateCacheTags: [],
      viewTransition: false,
      component: null,
      pageProps: null,
      cached: false,
      ...stripTopLevelUndefined(options),
      ...stripTopLevelUndefined(configuredOptions),
    }

    const [url, _data] = transformUrlAndData(
      href,
      mergedOptions.data,
      mergedOptions.method,
      mergedOptions.forceFormData,
      mergedOptions.queryStringArrayFormat,
    )

    const visit = {
      id: this.createVisitId(),
      cancelled: false,
      completed: false,
      interrupted: false,
      ...mergedOptions,
      url,
      data: _data,
    }

    if (visit.prefetch) {
      visit.headers['Purpose'] = 'prefetch'
    }

    return visit
  }

  protected getVisitEvents(options: VisitOptions): VisitCallbacks {
    return {
      onCancelToken: options.onCancelToken || noop,
      onBefore: options.onBefore || noop,
      onBeforeUpdate: options.onBeforeUpdate || noop,
      onStart: options.onStart || noop,
      onProgress: options.onProgress || noop,
      onFinish: options.onFinish || noop,
      onCancel: options.onCancel || noop,
      onSuccess: options.onSuccess || noop,
      onError: options.onError || noop,
      onHttpException: options.onHttpException || noop,
      onNetworkError: options.onNetworkError || noop,
      onFlash: options.onFlash || noop,
      onPrefetched: options.onPrefetched || noop,
      onPrefetching: options.onPrefetching || noop,
    }
  }

  protected applyOptimisticUpdate(optimistic: OptimisticCallback, events: VisitCallbacks): void {
    const currentProps = currentPage.get(this.frameId).props
    const optimisticProps = optimistic(cloneDeep(currentProps))

    if (!optimisticProps) {
      return
    }

    const changedKeys: string[] = []

    for (const key of Object.keys(optimisticProps)) {
      if (!isEqual(currentProps[key], optimisticProps[key])) {
        changedKeys.push(key)
      }
    }

    if (changedKeys.length === 0) {
      return
    }

    const id = currentPage.nextOptimisticId(this.frameId)
    const component = currentPage.get(this.frameId).component

    for (const key of changedKeys) {
      currentPage.setBaseline(key, cloneDeep(currentProps[key]), this.frameId)
    }

    currentPage.registerOptimistic(id, optimistic, this.frameId)
    currentPage.setPropsQuietly({ ...currentProps, ...optimisticProps }, this.frameId)

    let shouldRestore = true

    const originalOnSuccess = events.onSuccess
    events.onSuccess = (page) => {
      shouldRestore = false
      return originalOnSuccess(page)
    }

    const originalOnFinish = events.onFinish
    events.onFinish = (visit) => {
      currentPage.unregisterOptimistic(id, this.frameId)

      if (shouldRestore && currentPage.get(this.frameId).component === component) {
        const replayedProps = currentPage.replayOptimistics(this.frameId)

        if (Object.keys(replayedProps).length > 0) {
          currentPage.setPropsQuietly({ ...currentPage.get(this.frameId).props, ...replayedProps }, this.frameId)
        }
      }

      if (currentPage.pendingOptimisticCount(this.frameId) === 0) {
        currentPage.clearOptimisticState(this.frameId)
      }

      return originalOnFinish(visit)
    }
  }

  protected loadDeferredProps(deferred: Page['deferredProps']): void {
    if (deferred) {
      Object.values(deferred).forEach((props) => {
        this.doReload({ only: props, deferredProps: true, preserveErrors: true })
      })
    }
  }
}
