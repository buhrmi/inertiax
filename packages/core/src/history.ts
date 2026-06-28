import { cloneDeep, isEqual } from 'es-toolkit'
import { decryptHistory, encryptHistory, historySessionStorageKeys } from './encryption'
import { eventHandler } from './eventHandler'
import { page as currentPage } from './page'
import Queue from './queue'
import { SessionStorage } from './sessionStorage'
import { Page, ScrollRegion } from './types'

const DEFAULT_FRAME_ID = '_top'
const isServer = typeof window === 'undefined'
const queue = new Queue<Promise<void>>()
const isChromeIOS = !isServer && /CriOS/.test(window.navigator.userAgent)

type FrameHistoryState = {
  page: Page | ArrayBuffer
}

type InertiaHistoryState = {
  frames: Record<string, FrameHistoryState>
  scrollRegions?: ScrollRegion[]
  documentScrollPosition?: ScrollRegion
}

class History {
  public rememberedState = 'rememberedState' as const
  public scrollRegions = 'scrollRegions' as const
  public preserveUrl = false
  protected current = new Map<string, Partial<Page>>()
  protected initialState = new Map<string, Partial<Page> | null>()

  protected getCurrent(frameId: string): Partial<Page> {
    return this.current.get(frameId) ?? {}
  }

  protected setCurrentState(page: Partial<Page>, frameId: string): void {
    this.current.set(frameId, page)
  }

  protected getInitial(frameId: string): Partial<Page> | null {
    if (!this.initialState.has(frameId)) {
      this.initialState.set(frameId, null)
    }

    return this.initialState.get(frameId) ?? null
  }

  protected setInitial(page: Partial<Page> | null, frameId: string): void {
    this.initialState.set(frameId, page)
  }

  protected getWindowState(): InertiaHistoryState {
    if (isServer) {
      return { frames: {} }
    }

    const state = window.history.state
    if (state?.frames) {
      return state
    }
    return { frames: {} }
  }

  protected getFrameState(frameId = DEFAULT_FRAME_ID): FrameHistoryState | null {
    return this.getWindowState().frames[frameId] ?? null
  }

  public remember(data: unknown, key: string, frameId = DEFAULT_FRAME_ID): void {
    this.replaceState(
      {
        ...currentPage.getWithoutFlashData(frameId),
        rememberedState: {
          ...(currentPage.get(frameId)?.rememberedState ?? {}),
          [key]: data,
        },
      },
      null,
      frameId,
    )
  }

  public restore(key: string, frameId = DEFAULT_FRAME_ID): unknown {
    if (!isServer) {
      const current = this.getCurrent(frameId)
      const initial = this.getInitial(frameId)

      return current[this.rememberedState]?.[key] !== undefined
        ? current[this.rememberedState]?.[key]
        : initial?.[this.rememberedState]?.[key]
    }
  }

  public pushState(page: Page, cb: (() => void) | null = null, frameId = DEFAULT_FRAME_ID, browserUrl?: string): void {
    if (isServer) {
      return
    }

    if (this.preserveUrl) {
      cb && cb()
      return
    }

    this.setCurrentState(page, frameId)

    queue.add(() => {
      return this.getPageData(page).then((data) => {
        const doPush = () => this.doPushState({ page: data }, browserUrl ?? page.url, frameId).then(() => cb?.())

        if (isChromeIOS) {
          return new Promise((resolve) => {
            setTimeout(() => doPush().then(resolve))
          })
        }

        return doPush()
      })
    })
  }

  protected clonePageProps(page: Page): Page {
    try {
      structuredClone(page.props)
      return page
    } catch {
      return {
        ...page,
        props: cloneDeep(page.props),
      }
    }
  }

  protected getPageData(page: Page): Promise<Page | ArrayBuffer> {
    const pageWithClonedProps = this.clonePageProps(page)

    return new Promise((resolve) => {
      return page.encryptHistory ? encryptHistory(pageWithClonedProps).then(resolve) : resolve(pageWithClonedProps)
    })
  }

  public processQueue(): Promise<void> {
    return queue.process()
  }

  public decrypt(page: Page | ArrayBuffer | null = null, frameId = DEFAULT_FRAME_ID): Promise<Page> {
    if (isServer) {
      return Promise.resolve(page instanceof ArrayBuffer ? ({} as Page) : page ?? currentPage.get(frameId))
    }

    const pageData = page ?? this.getFrameState(frameId)?.page ?? null

    return this.decryptPageData(pageData).then((data) => {
      if (!data) {
        throw new Error('Unable to decrypt history')
      }

      if (this.getInitial(frameId) === null) {
        this.setInitial(data ?? undefined, frameId)
      } else {
        this.setCurrentState(data ?? {}, frameId)
      }

      return data
    })
  }

  protected decryptPageData(pageData: ArrayBuffer | Page | null): Promise<Page | null> {
    return pageData instanceof ArrayBuffer ? decryptHistory(pageData) : Promise.resolve(pageData)
  }

  public saveScrollPositions(scrollRegions: ScrollRegion[]): void {
    // Skip regions that have no scrollable content — their scroll position
    // is meaningless (e.g. when a Frame unmounts and the scroll-region collapses).
    const meaningful = scrollRegions.filter((_, i) => {
      const el = document.querySelectorAll('[scroll-region]')[i]
      return el ? el.scrollHeight > el.clientHeight : false
    })

    if (meaningful.length === 0) {
      return
    }

    if (isEqual(this.getScrollRegions(), meaningful)) {
      return
    }

    const nextState = {
      ...window.history.state,
      scrollRegions: meaningful,
    }

    try {
      window.history.replaceState(nextState, '')
    } catch (e) {
      // Quota errors are handled silently; other errors should not block navigation.
      if (!(e instanceof Error && e.name === 'QuotaExceededError')) {
        console.error('[Inertia] Failed to save scroll positions:', e)
      }
    }
  }

  public saveDocumentScrollPosition(scrollRegion: ScrollRegion): void {
    if (isEqual(this.getDocumentScrollPosition(), scrollRegion)) {
      return
    }

    const nextState = {
      ...window.history.state,
      documentScrollPosition: scrollRegion,
    }

    window.history.replaceState(nextState, '')
  }

  public getScrollRegions(): ScrollRegion[] {
    return this.getWindowState().scrollRegions || []
  }

  public getDocumentScrollPosition(): ScrollRegion {
    return this.getWindowState().documentScrollPosition || { top: 0, left: 0 }
  }

  public replaceState(page: Page, cb: (() => void) | null = null, frameId = DEFAULT_FRAME_ID, browserUrl?: string): void {
    if (isEqual(this.getCurrent(frameId), page)) {
      cb && cb()
      return
    }

    const { flash, ...pageWithoutFlash } = page
    currentPage.merge(pageWithoutFlash, frameId)

    if (isServer) {
      return
    }

    if (this.preserveUrl) {
      cb && cb()
      return
    }

    this.setCurrentState(page, frameId)

    queue.add(() => {
      return this.getPageData(page).then((data) => {
        const doReplace = () => this.doReplaceState({ page: data }, browserUrl ?? page.url, frameId).then(() => cb?.())

        if (isChromeIOS) {
          return new Promise((resolve) => {
            setTimeout(() => doReplace().then(resolve))
          })
        }

        return doReplace()
      })
    })
  }

  protected isHistoryThrottleError(error: unknown): error is Error & { name: 'SecurityError' } {
    return (
      error instanceof Error &&
      error.name === 'SecurityError' &&
      (error.message.includes('history.pushState') || error.message.includes('history.replaceState'))
    )
  }

  protected isQuotaExceededError(error: unknown): error is Error & { name: 'QuotaExceededError' } {
    return error instanceof Error && error.name === 'QuotaExceededError'
  }

  protected withThrottleProtection<T = void>(cb: () => T): Promise<T | undefined> {
    return Promise.resolve().then(() => {
      try {
        return cb()
      } catch (error) {
        if (!this.isHistoryThrottleError(error)) {
          throw error
        }

        console.error(error.message)
      }
    })
  }

  protected doReplaceState(
    data: {
      page: Page | ArrayBuffer
    },
    url?: string,
    frameId = DEFAULT_FRAME_ID,
  ): Promise<void> {
    return this.withThrottleProtection(() => {
      const existing = this.getWindowState()

      const nextState = {
        ...window.history.state,
        frames: {
          ...existing.frames,
          [frameId]: {
            page: data.page,
          },
        },
      }

      window.history.replaceState(nextState, '', url)
    })
  }

  protected doPushState(
    data: {
      page: Page | ArrayBuffer
    },
    url: string,
    frameId = DEFAULT_FRAME_ID,
  ): Promise<void> {
    return this.withThrottleProtection(() => {
      const existing = this.getWindowState()

      const nextState = {
        ...window.history.state,
        frames: {
          ...existing.frames,
          [frameId]: {
            page: data.page,
          },
        },
      }

      try {
        window.history.pushState(nextState, '', url)
      } catch (error) {
        if (!this.isQuotaExceededError(error)) {
          throw error
        }

        eventHandler.fireInternalEvent('historyQuotaExceeded', frameId, url)
      }
    })
  }

  public getState<T>(key: keyof Page, defaultValue?: T, frameId = DEFAULT_FRAME_ID): any {
    return this.getCurrent(frameId)?.[key] ?? defaultValue
  }

  public deleteState(key: keyof Page, frameId = DEFAULT_FRAME_ID) {
    const current = this.getCurrent(frameId)

    if (current[key] !== undefined) {
      delete current[key]
      this.replaceState(current as Page, null, frameId)
    }
  }

  public clearInitialState(key: keyof Page, frameId = DEFAULT_FRAME_ID) {
    const initial = this.getInitial(frameId)

    if (initial && initial[key] !== undefined) {
      delete initial[key]
      this.setInitial(initial, frameId)
    }
  }

  public browserHasHistoryEntry(frameId = DEFAULT_FRAME_ID): boolean {
    return !isServer && !!this.getFrameState(frameId)?.page
  }

  public clear() {
    SessionStorage.remove(historySessionStorageKeys.key)
    SessionStorage.remove(historySessionStorageKeys.iv)
  }

  public setCurrent(page: Page, frameId = DEFAULT_FRAME_ID): void {
    this.setCurrentState(page, frameId)
  }

  public isValidState(state: any, frameId = DEFAULT_FRAME_ID): boolean {
    return !!state?.frames?.[frameId]?.page
  }

  public getAllState(frameId = DEFAULT_FRAME_ID): Page {
    return this.getCurrent(frameId) as Page
  }

  public getStateForFrame(state: any, frameId = DEFAULT_FRAME_ID): FrameHistoryState | null {
    return state?.frames?.[frameId] ?? null
  }

  public deleteFrame(frameId: string): void {
    this.current.delete(frameId)
    this.initialState.delete(frameId)
  }
}

if (typeof window !== 'undefined' && window.history.scrollRestoration) {
  window.history.scrollRestoration = 'manual'
}

export const history = new History()
