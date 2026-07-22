import { cloneDeep, isEqual } from 'es-toolkit'
import { decryptHistory, encryptHistory, historySessionStorageKeys } from './encryption'
import { eventHandler } from './eventHandler'
import { page as currentPage } from './page'
import Queue from './queue'
import { SessionStorage } from './sessionStorage'
import { Page, ScrollRegion } from './types'

const DEFAULT_FRAME = '_top'
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

  protected getCurrent(frame: string): Partial<Page> {
    return this.current.get(frame) ?? {}
  }

  protected setCurrentState(page: Partial<Page>, frame: string): void {
    this.current.set(frame, page)
  }

  protected getInitial(frame: string): Partial<Page> | null {
    if (!this.initialState.has(frame)) {
      this.initialState.set(frame, null)
    }

    return this.initialState.get(frame) ?? null
  }

  protected setInitial(page: Partial<Page> | null, frame: string): void {
    this.initialState.set(frame, page)
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

  protected getFrameState(frame = DEFAULT_FRAME): FrameHistoryState | null {
    return this.getWindowState().frames[frame] ?? null
  }

  public remember(data: unknown, key: string, frame = DEFAULT_FRAME): void {
    this.replaceState(
      {
        ...currentPage.getWithoutFlashData(frame),
        rememberedState: {
          ...(currentPage.get(frame)?.rememberedState ?? {}),
          [key]: data,
        },
      },
      null,
      frame,
    )
  }

  public restore(key: string, frame = DEFAULT_FRAME): unknown {
    if (!isServer) {
      const current = this.getCurrent(frame)
      const initial = this.getInitial(frame)

      return current[this.rememberedState]?.[key] !== undefined
        ? current[this.rememberedState]?.[key]
        : initial?.[this.rememberedState]?.[key]
    }
  }

  public pushState(page: Page, cb: (() => void) | null = null, frame = DEFAULT_FRAME, browserUrl?: string): void {
    if (isServer) {
      return
    }

    if (this.preserveUrl) {
      cb && cb()
      return
    }

    this.setCurrentState(page, frame)

    queue.add(() => {
      return this.getPageData(page).then((data) => {
        const fallbackUrl = frame === DEFAULT_FRAME ? page.url : window.location.href
        const doPush = () => this.doPushState({ page: data }, browserUrl ?? fallbackUrl, frame).then(() => cb?.())

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

  public decrypt(page: Page | ArrayBuffer | null = null, frame = DEFAULT_FRAME): Promise<Page> {
    if (isServer) {
      return Promise.resolve(page instanceof ArrayBuffer ? ({} as Page) : page ?? currentPage.get(frame))
    }

    const pageData = page ?? this.getFrameState(frame)?.page ?? null

    return this.decryptPageData(pageData).then((data) => {
      if (!data) {
        throw new Error('Unable to decrypt history')
      }

      if (this.getInitial(frame) === null) {
        this.setInitial(data ?? undefined, frame)
      } else {
        this.setCurrentState(data ?? {}, frame)
      }

      return data
    })
  }

  protected decryptPageData(pageData: ArrayBuffer | Page | null): Promise<Page | null> {
    return pageData instanceof ArrayBuffer ? decryptHistory(pageData) : Promise.resolve(pageData)
  }

  public saveScrollPositions(scrollRegions: ScrollRegion[]): void {
    if (isEqual(this.getScrollRegions(), scrollRegions)) {
      return
    }

    const nextState = {
      ...window.history.state,
      scrollRegions,
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

  public replaceState(page: Page, cb: (() => void) | null = null, frame = DEFAULT_FRAME, browserUrl?: string): void {
    if (isEqual(this.getCurrent(frame), page)) {
      cb && cb()
      return
    }

    const { flash, ...pageWithoutFlash } = page
    currentPage.merge(pageWithoutFlash, frame)

    if (isServer) {
      return
    }

    if (this.preserveUrl) {
      cb && cb()
      return
    }

    this.setCurrentState(page, frame)

    queue.add(() => {
      return this.getPageData(page).then((data) => {
        const fallbackUrl = frame === DEFAULT_FRAME ? page.url : window.location.href
        const doReplace = () => this.doReplaceState({ page: data }, browserUrl ?? fallbackUrl, frame).then(() => cb?.())

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
    frame = DEFAULT_FRAME,
  ): Promise<void> {
    return this.withThrottleProtection(() => {
      const existing = this.getWindowState()

      const nextState = {
        ...window.history.state,
        frames: {
          ...existing.frames,
          [frame]: {
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
    frame = DEFAULT_FRAME,
  ): Promise<void> {
    return this.withThrottleProtection(() => {
      const existing = this.getWindowState()

      const nextState = {
        ...window.history.state,
        frames: {
          ...existing.frames,
          [frame]: {
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

        eventHandler.fireInternalEvent('historyQuotaExceeded', frame, url)
      }
    })
  }

  public getState<T>(key: keyof Page, defaultValue?: T, frame = DEFAULT_FRAME): any {
    return this.getCurrent(frame)?.[key] ?? defaultValue
  }

  public deleteState(key: keyof Page, frame = DEFAULT_FRAME) {
    const current = this.getCurrent(frame)

    if (current[key] !== undefined) {
      delete current[key]
      this.replaceState(current as Page, null, frame)
    }
  }

  public clearInitialState(key: keyof Page, frame = DEFAULT_FRAME) {
    const initial = this.getInitial(frame)

    if (initial && initial[key] !== undefined) {
      delete initial[key]
      this.setInitial(initial, frame)
    }
  }

  public browserHasHistoryEntry(frame = DEFAULT_FRAME): boolean {
    return !isServer && !!this.getFrameState(frame)?.page
  }

  public clear() {
    SessionStorage.remove(historySessionStorageKeys.key)
    SessionStorage.remove(historySessionStorageKeys.iv)
  }

  public setCurrent(page: Page, frame = DEFAULT_FRAME): void {
    this.setCurrentState(page, frame)
  }

  public isValidState(state: any, frame = DEFAULT_FRAME): boolean {
    return !!state?.frames?.[frame]?.page
  }

  public getAllState(frame = DEFAULT_FRAME): Page {
    return this.getCurrent(frame) as Page
  }

  public getStateForFrame(state: any, frame = DEFAULT_FRAME): FrameHistoryState | null {
    return state?.frames?.[frame] ?? null
  }

  public deleteFrame(frame: string): void {
    this.current.delete(frame)
    this.initialState.delete(frame)
  }
}

if (typeof window !== 'undefined' && window.history.scrollRestoration) {
  window.history.scrollRestoration = 'manual'
}

export const history = new History()
