import { decryptHistory, encryptHistory, historySessionStorageKeys } from './encryption'

import Queue from './queue'
import { SessionStorage } from './sessionStorage'
import { Page, ScrollRegion, Frames } from './types'
import { Router } from './router'

const isServer = typeof window === 'undefined'
const queue = new Queue<Promise<void>>()
const isChromeIOS = !isServer && /CriOS/.test(window.navigator.userAgent)

class History {
  public rememberedState = 'rememberedState' as const
  public scrollRegions = 'scrollRegions' as const
  public preserveUrl = false
  public counter = isServer ? 0 : window.history.state?.c ?? 0
  public externalCallbacks: Array<{arrive: () => void, recede: () => void}> = []
  public lastChangedFrames: string[] = []

  protected current: Frames = {}
  // We need initialState for `restore`
  protected initialState: Partial<Frames> | null = null

  public remember(frame: string, data: unknown, key: string): void {
    this.preserveUrl = true
    this.replaceState(frame, {
      ...this.current[frame],
      rememberedState: {
        ...(this.current[frame]?.rememberedState ?? {}),
        [key]: data,
      },
    })
  }

  public restore(frame: string, key: string): unknown {
    if (!isServer) {
      return this.current?.[frame]?.rememberedState?.[key]
    }
  }

  public pushExternal(src: string, {arrive, recede}: { arrive: () => void, recede: () => void }): void {
    this.doPushState({
      ...window.history.state
    }, src)
    this.externalCallbacks = this.externalCallbacks.slice(0, this.counter)
    this.externalCallbacks[this.counter] = {
      arrive,
      recede
    }
    arrive()
  }

  public pushState(frame: string, page: Page, cb: (() => void) | null = null): void {
    if (isServer) {
      return
    }

    // if (this.preserveUrl) {
    //   cb && cb()
    //   return
    // }
    
    this.current[frame] = page

    queue.add(() => {
      return this.getFramesData(this.current, page.encryptHistory).then((data) => {
        // Defer history.pushState to the next event loop tick to prevent timing conflicts.
        // Ensure any previous history.replaceState completes before pushState is executed.
        const doPush = () => {
          this.doPushState({frames: data, changedFrames: [frame]}, this.preserveUrl ? window.location.href : page.url)
          cb && cb()
        }

        if (isChromeIOS) {
          setTimeout(doPush)
        } else {
          doPush()
        }
      })
    })
  }

  public removeFrame(frame: string): void {
    delete this.current[frame]
  }

  protected getFramesData(frames: Frames, encrypt: boolean): Promise<Frames | ArrayBuffer> {
    return new Promise((resolve) => {
      return encrypt ? encryptHistory(frames).then(resolve) : resolve(frames)
    })
  }

  public processQueue(): Promise<void> {
    return queue.process()
  }

  public decrypt(frames: Frames | null = null): Promise<Frames> {
    if (isServer) {
      return Promise.resolve(frames ?? Router.asFrames())
    }

    const framesData = frames ?? window.history.state?.frames

    return this.decryptPageData(framesData).then((data) => {
      if (!data) {
        throw new Error('Unable to decrypt history')
      }

      if (this.initialState === null) {
        this.initialState = data ?? undefined
      } else {
        this.current = data ?? {}
      }

      return data
    })
  }

  protected decryptPageData(framesData: ArrayBuffer | Frames | null): Promise<Frames | null> {
    return framesData instanceof ArrayBuffer ? decryptHistory(framesData) : Promise.resolve(framesData)
  }

  public saveScrollPositions(scrollRegions: ScrollRegion[]): void {
    queue.add(() => {
      return Promise.resolve().then(() => {
        if (!window.history.state?.frames) {
          return
        }

        this.doReplaceState(
          {
            frames: window.history.state.frames,
            scrollRegions,
          }
        )
      })
    })
  }

  public saveDocumentScrollPosition(scrollRegion: ScrollRegion): void {
    queue.add(() => {
      return Promise.resolve().then(() => {
        if (!window.history.state?.frames) {
          return
        }

        this.doReplaceState(
          {
            ...window.history.state,
            documentScrollPosition: scrollRegion,
          }
        )
      })
    })
  }

  public getScrollRegions(): ScrollRegion[] {
    return window.history.state?.scrollRegions || []
  }

  public getDocumentScrollPosition(): ScrollRegion {
    return window.history.state?.documentScrollPosition || { top: 0, left: 0 }
  }

  public replaceState(frame: string, page: Page, cb: (() => void) | null = null): void {
    Router.for(frame).currentPage.merge(page)

    if (isServer) {
      return
    }

    // if (this.preserveUrl) {
    //   cb && cb()
    //   return
    // }

    this.current[frame] = Router.for(frame).currentPage.get()
    // queue.add(() => {
       this.getFramesData(this.current, page.encryptHistory).then((data) => {
        // Defer history.replaceState to the next event loop tick to prevent timing conflicts.
        // Ensure any previous history.pushState completes before replaceState is executed.
        const doReplace = () => {
          const changedFrames = window.history.state?.changedFrames || []
          if (!changedFrames.includes(frame)) {
            changedFrames.push(frame)
          }
          this.doReplaceState({ frames: data, changedFrames }, this.preserveUrl ? window.location.href : page.url)
          cb && cb()
        }

        if (isChromeIOS) {
          setTimeout(doReplace)
        } else {
          doReplace()
        }
      })
    // })
  }

  protected doReplaceState(
    data: {
      frames: Frames | ArrayBuffer
      scrollRegions?: ScrollRegion[]
      documentScrollPosition?: ScrollRegion
      changedFrames?: string[]
    },
    url?: string,
  ): void {
    window.history.replaceState(
      {
        ...window.history.state,
        ...data,
        // scrollRegions: data.scrollRegions ?? window.history.state?.scrollRegions,
        // documentScrollPosition: data.documentScrollPosition ?? window.history.state?.documentScrollPosition,
      },
      '',
      url
    )
    this.lastChangedFrames = window.history.state.changedFrames || []
  }

  protected doPushState(
    data: {
      frames: Frames | ArrayBuffer
      scrollRegions?: ScrollRegion[]
      documentScrollPosition?: ScrollRegion
      changedFrames?: string[]
    },
    url: string,
  ): void {
    this.lastChangedFrames = data.changedFrames || []
    window.history.pushState({...data, c: ++this.counter}, '', url)
  }

  public getState<T>(key: keyof Page, defaultValue?: T): any {
    return this.current?.["_top"]?.[key] ?? defaultValue
  }

  public deleteState(key: keyof Page) {
    if (this.current["_top"]?.[key] !== undefined) {
      delete this.current["_top"][key]
      this.replaceState("_top", this.current["_top"] as Page)
    }
  }

  public hasAnyState(): boolean {
    return !!this.getAllState()
  }

  public clear() {
    SessionStorage.remove(historySessionStorageKeys.key)
    SessionStorage.remove(historySessionStorageKeys.iv)
  }

  public setCurrent(frame: string, page: Page): void {
    this.current[frame] = page
  }

  public isValidState(state: any): boolean {
    return !!state.frames
  }

  public getAllState(): Page {
    return this.current["_top"] as Page
  }
}

if (typeof window !== 'undefined' && window.history.scrollRestoration) {
  window.history.scrollRestoration = 'manual'
}

export const history = new History()
