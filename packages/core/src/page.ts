import { cloneDeep, isEqual } from 'es-toolkit'
import { get, set } from 'es-toolkit/compat'
import { eventHandler } from './eventHandler'
import { fireNavigateEvent } from './events'
import { history } from './history'
import { prefetchedRequests } from './prefetched'
import { Scroll } from './scroll'
import { Component, FlashData, Page, PageEvent, PageHandler, PageResolver, RouterInitParams, Visit } from './types'
import { hrefToUrl, isSameUrlWithoutHash } from './url'

const DEFAULT_FRAME_ID = '_top'

class CurrentFramePage {
  protected page!: Page
  protected swapComponent!: PageHandler<any>
  protected resolveComponent!: PageResolver
  protected onFlashCallback?: (flash: Page['flash']) => void
  protected componentId = {}
  protected listeners: {
    event: PageEvent
    callback: VoidFunction
  }[] = []
  protected isFirstPageLoad = true
  protected cleared = false
  protected pendingDeferredProps: Pick<Page, 'deferredProps' | 'url' | 'component'> | null = null
  protected historyQuotaExceeded = false
  protected optimisticBaseline: Partial<Page['props']> = {}
  protected pendingOptimistics: { id: number; callback: (props: Page['props']) => Partial<Page['props']> | void }[] = []
  protected optimisticCounter = 0

  constructor(protected readonly frameId: string) {}

  public init<ComponentType = Component>({
    initialPage,
    swapComponent,
    resolveComponent,
    onFlash,
  }: RouterInitParams<ComponentType>) {
    this.page = { ...initialPage, flash: initialPage.flash ?? {}, rescuedProps: initialPage.rescuedProps ?? [] }
    this.swapComponent = swapComponent
    this.resolveComponent = resolveComponent
    this.onFlashCallback = onFlash

    eventHandler.on('historyQuotaExceeded', (frameId?: string) => {
      if (!frameId || frameId === this.frameId) {
        this.historyQuotaExceeded = true
      }
    })

    return this
  }

  public set(
    page: Page,
    {
      replace = false,
      updateBrowserUrl = this.frameId === DEFAULT_FRAME_ID,
      preserveScroll = false,
      preserveState = false,
      viewTransition = false,
      cached = false,
      visitId,
    }: {
      replace?: boolean
      updateBrowserUrl?: boolean
      preserveScroll?: boolean
      preserveState?: boolean
      viewTransition?: Visit['viewTransition']
      cached?: boolean
      visitId?: string
    } = {},
  ): Promise<void> {
    if (Object.keys(page.deferredProps || {}).length) {
      this.pendingDeferredProps = {
        deferredProps: page.deferredProps,
        component: page.component,
        url: page.url,
      }

      if (page.initialDeferredProps === undefined) {
        page.initialDeferredProps = page.deferredProps
      }
    }

    this.componentId = {}

    const componentId = this.componentId

    if (page.clearHistory) {
      history.clear()
    }

    return this.resolve(page.component, page).then((component) => {
      if (componentId !== this.componentId) {
        return
      }

      page.rememberedState ??= {}

      const isServer = typeof window === 'undefined'
      const location = !isServer ? window.location : new URL(page.url)
      const currentFrameUrl = hrefToUrl(this.page?.url ?? page.url)
      const comparisonTarget = updateBrowserUrl ? location : currentFrameUrl
      const scrollRegions = !isServer && preserveScroll ? Scroll.getScrollRegions() : []
      replace = replace || isSameUrlWithoutHash(hrefToUrl(page.url), comparisonTarget)

      const pageForHistory = { ...page, flash: {} }
      const browserUrl = !isServer && !updateBrowserUrl ? window.location.href : page.url

      return new Promise<void>((resolve) =>
        replace
          ? history.replaceState(pageForHistory, resolve, this.frameId, browserUrl)
          : history.pushState(pageForHistory, resolve, this.frameId, browserUrl),
      ).then(() => {
        const isNewComponent = !this.isTheSame(page)

        if (!isNewComponent && Object.keys(page.props.errors || {}).length > 0) {
          viewTransition = false
        }

        this.page = page
        this.cleared = false

        if (this.hasOnceProps()) {
          prefetchedRequests.updateCachedOncePropsFromCurrentPage(this.frameId)
        }

        if (isNewComponent) {
          this.fireEventsFor('newComponent')
        }

        if (this.isFirstPageLoad) {
          this.fireEventsFor('firstLoad')
        }

        this.isFirstPageLoad = false

        if (this.historyQuotaExceeded) {
          this.historyQuotaExceeded = false
          return
        }

        return this.swap({
          component,
          page,
          preserveState,
          viewTransition,
        }).then(() => {
          if (preserveScroll) {
            window.requestAnimationFrame(() => Scroll.restoreScrollRegions(scrollRegions))
          } else {
            Scroll.reset(this.frameId)
          }

          if (
            this.pendingDeferredProps &&
            this.pendingDeferredProps.component === page.component &&
            this.pendingDeferredProps.url === page.url
          ) {
            eventHandler.fireInternalEvent('loadDeferredProps', this.frameId, this.pendingDeferredProps.deferredProps)
          }

          this.pendingDeferredProps = null

          if (!replace) {
            fireNavigateEvent(page, { cached, visitId })
          }
        })
      })
    })
  }

  public setQuietly(
    page: Page,
    {
      preserveState = false,
    }: {
      preserveState?: boolean
    } = {},
  ) {
    history.setCurrent(page, this.frameId)

    if (!this.cleared && isEqual(this.page, page)) {
      return Promise.resolve()
    }

    return this.resolve(page.component, page).then((component) => {
      this.page = page
      this.cleared = false
      return this.swap({ component, page, preserveState, viewTransition: false })
    })
  }

  public clear(): void {
    this.cleared = true
  }

  public isCleared(): boolean {
    return this.cleared
  }

  public get(): Page {
    return this.page
  }

  public getWithoutFlashData(): Page {
    return { ...this.page, flash: {} }
  }

  public hasOnceProps(): boolean {
    return Object.keys(this.page.onceProps ?? {}).length > 0
  }

  public merge(data: Partial<Page>): void {
    this.page = { ...this.page, ...data }
  }

  public setPropsQuietly(props: Page['props']): Promise<unknown> {
    this.page = { ...this.page, props }

    return this.resolve(this.page.component, this.page).then((component) => {
      return this.swap({ component, page: this.page, preserveState: true, viewTransition: false })
    })
  }

  public setFlash(flash: FlashData): void {
    this.page = { ...this.page, flash }
    this.onFlashCallback?.(flash)
  }

  public setUrlHash(hash: string): void {
    if (!this.page.url.includes(hash)) {
      this.page.url += hash
    }
  }

  public remember(data: Page['rememberedState']): void {
    this.page.rememberedState = data
  }

  public swap({
    component,
    page,
    preserveState,
    viewTransition,
  }: {
    component: Component
    page: Page
    preserveState: boolean
    viewTransition: Visit['viewTransition']
  }): Promise<unknown> {
    const doSwap = () => this.swapComponent({ component, page, preserveState })

    if (!viewTransition || !document?.startViewTransition || document.visibilityState === 'hidden') {
      return doSwap()
    }

    const viewTransitionCallback = typeof viewTransition === 'boolean' ? () => null : viewTransition

    return new Promise((resolve) => {
      const transitionResult = document.startViewTransition(() => doSwap().then(resolve))

      viewTransitionCallback(transitionResult)
    })
  }

  public resolve(component: string, page?: Page): Promise<Component> {
    return Promise.resolve(this.resolveComponent(component, page))
  }

  public nextOptimisticId(): number {
    return ++this.optimisticCounter
  }

  public setBaseline(key: string, value: unknown): void {
    if (!(key in this.optimisticBaseline)) {
      this.optimisticBaseline[key] = value
    }
  }

  public updateBaseline(key: string, value: unknown): void {
    if (key in this.optimisticBaseline) {
      this.optimisticBaseline[key] = value
    }
  }

  public hasBaseline(key: string): boolean {
    return key in this.optimisticBaseline
  }

  public registerOptimistic(id: number, callback: (props: Page['props']) => Partial<Page['props']> | void): void {
    this.pendingOptimistics.push({ id, callback })
  }

  public unregisterOptimistic(id: number): void {
    this.pendingOptimistics = this.pendingOptimistics.filter((entry) => entry.id !== id)
  }

  public replayOptimistics(): Partial<Page['props']> {
    const baselineKeys = Object.keys(this.optimisticBaseline)

    if (baselineKeys.length === 0) {
      return {}
    }

    const props = cloneDeep(this.page.props)

    for (const key of baselineKeys) {
      props[key] = cloneDeep(this.optimisticBaseline[key])
    }

    for (const { callback } of this.pendingOptimistics) {
      const result = callback(cloneDeep(props))

      if (result) {
        Object.assign(props, result)
      }
    }

    const replayedProps: Partial<Page['props']> = {}

    for (const key of baselineKeys) {
      replayedProps[key] = props[key]
    }

    return replayedProps
  }

  public pendingOptimisticCount(): number {
    return this.pendingOptimistics.length
  }

  public clearOptimisticState(): void {
    this.optimisticBaseline = {}
    this.pendingOptimistics = []
  }

  public isTheSame(page: Page): boolean {
    return this.page.component === page.component
  }

  public on(event: PageEvent, callback: VoidFunction): VoidFunction {
    this.listeners.push({ event, callback })

    return () => {
      this.listeners = this.listeners.filter((listener) => listener.event !== event && listener.callback !== callback)
    }
  }

  public fireEventsFor(event: PageEvent): void {
    this.listeners.filter((listener) => listener.event === event).forEach((listener) => listener.callback())
  }

  public mergeOncePropsIntoResponse(response: Page, { force = false }: { force?: boolean } = {}): void {
    Object.entries(response.onceProps ?? {}).forEach(([key, onceProp]) => {
      const existingOnceProp = this.page.onceProps?.[key]

      if (existingOnceProp === undefined) {
        return
      }

      if (force || get(response.props, onceProp.prop) === undefined) {
        set(response.props, onceProp.prop, get(this.page.props, existingOnceProp.prop))
        response.onceProps![key].expiresAt = existingOnceProp.expiresAt
      }
    })
  }
}

class PageStore {
  protected frames = new Map<string, CurrentFramePage>()

  protected forFrame(frameId = DEFAULT_FRAME_ID): CurrentFramePage {
    if (!this.frames.has(frameId)) {
      this.frames.set(frameId, new CurrentFramePage(frameId))
    }

    return this.frames.get(frameId)!
  }

  public init<ComponentType = Component>(params: RouterInitParams<ComponentType>, frameId = DEFAULT_FRAME_ID) {
    return this.forFrame(frameId).init(params)
  }

  public set(page: Page, options?: Parameters<CurrentFramePage['set']>[1], frameId = DEFAULT_FRAME_ID): Promise<void> {
    return this.forFrame(frameId).set(page, options)
  }

  public setQuietly(
    page: Page,
    options?: Parameters<CurrentFramePage['setQuietly']>[1],
    frameId = DEFAULT_FRAME_ID,
  ): Promise<unknown> {
    return this.forFrame(frameId).setQuietly(page, options)
  }

  public clear(frameId = DEFAULT_FRAME_ID): void {
    this.forFrame(frameId).clear()
  }

  public isCleared(frameId = DEFAULT_FRAME_ID): boolean {
    return this.forFrame(frameId).isCleared()
  }

  public get(frameId = DEFAULT_FRAME_ID): Page {
    return this.forFrame(frameId).get()
  }

  public getWithoutFlashData(frameId = DEFAULT_FRAME_ID): Page {
    return this.forFrame(frameId).getWithoutFlashData()
  }

  public hasOnceProps(frameId = DEFAULT_FRAME_ID): boolean {
    return this.forFrame(frameId).hasOnceProps()
  }

  public merge(data: Partial<Page>, frameId = DEFAULT_FRAME_ID): void {
    this.forFrame(frameId).merge(data)
  }

  public setPropsQuietly(props: Page['props'], frameId = DEFAULT_FRAME_ID): Promise<unknown> {
    return this.forFrame(frameId).setPropsQuietly(props)
  }

  public setFlash(flash: FlashData, frameId = DEFAULT_FRAME_ID): void {
    this.forFrame(frameId).setFlash(flash)
  }

  public setUrlHash(hash: string, frameId = DEFAULT_FRAME_ID): void {
    this.forFrame(frameId).setUrlHash(hash)
  }

  public remember(data: Page['rememberedState'], frameId = DEFAULT_FRAME_ID): void {
    this.forFrame(frameId).remember(data)
  }

  public swap(args: Parameters<CurrentFramePage['swap']>[0], frameId = DEFAULT_FRAME_ID): Promise<unknown> {
    return this.forFrame(frameId).swap(args)
  }

  public resolve(component: string, page?: Page, frameId = DEFAULT_FRAME_ID): Promise<Component> {
    return this.forFrame(frameId).resolve(component, page)
  }

  public nextOptimisticId(frameId = DEFAULT_FRAME_ID): number {
    return this.forFrame(frameId).nextOptimisticId()
  }

  public setBaseline(key: string, value: unknown, frameId = DEFAULT_FRAME_ID): void {
    this.forFrame(frameId).setBaseline(key, value)
  }

  public updateBaseline(key: string, value: unknown, frameId = DEFAULT_FRAME_ID): void {
    this.forFrame(frameId).updateBaseline(key, value)
  }

  public hasBaseline(key: string, frameId = DEFAULT_FRAME_ID): boolean {
    return this.forFrame(frameId).hasBaseline(key)
  }

  public registerOptimistic(
    id: number,
    callback: (props: Page['props']) => Partial<Page['props']> | void,
    frameId = DEFAULT_FRAME_ID,
  ): void {
    this.forFrame(frameId).registerOptimistic(id, callback)
  }

  public unregisterOptimistic(id: number, frameId = DEFAULT_FRAME_ID): void {
    this.forFrame(frameId).unregisterOptimistic(id)
  }

  public replayOptimistics(frameId = DEFAULT_FRAME_ID): Partial<Page['props']> {
    return this.forFrame(frameId).replayOptimistics()
  }

  public pendingOptimisticCount(frameId = DEFAULT_FRAME_ID): number {
    return this.forFrame(frameId).pendingOptimisticCount()
  }

  public clearOptimisticState(frameId = DEFAULT_FRAME_ID): void {
    this.forFrame(frameId).clearOptimisticState()
  }

  public isTheSame(page: Page, frameId = DEFAULT_FRAME_ID): boolean {
    return this.forFrame(frameId).isTheSame(page)
  }

  public on(event: PageEvent, callback: VoidFunction, frameId = DEFAULT_FRAME_ID): VoidFunction {
    return this.forFrame(frameId).on(event, callback)
  }

  public fireEventsFor(event: PageEvent, frameId = DEFAULT_FRAME_ID): void {
    this.forFrame(frameId).fireEventsFor(event)
  }

  public mergeOncePropsIntoResponse(
    response: Page,
    options: { force?: boolean } = {},
    frameId = DEFAULT_FRAME_ID,
  ): void {
    this.forFrame(frameId).mergeOncePropsIntoResponse(response, options)
  }

  public deleteFrame(frameId: string): void {
    this.frames.delete(frameId)
  }
}

export const page = new PageStore()
