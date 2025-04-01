import debounce from './debounce'
import { fireNavigateEvent } from './events'
import { history } from './history'
import { Scroll } from './scroll'
import { GlobalEvent, GlobalEventNames, GlobalEventResult, InternalEvent } from './types'
import { hrefToUrl } from './url'
import { Router } from './router'

declare global {
  interface PopStateEvent {
    skipInertia?: boolean
  }
}

class EventHandler {
  protected internalListeners: {
    event: InternalEvent
    listener: VoidFunction
  }[] = []

  public init() {
    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', (e) => setTimeout(this.handlePopstateEvent.bind(this,e)))
      window.addEventListener('scroll', debounce(Scroll.onWindowScroll.bind(Scroll), 100), true)
    }

    if (typeof document !== 'undefined') {
      document.addEventListener('scroll', debounce(Scroll.onScroll.bind(Scroll), 100), true)
    }
  }

  public onGlobalEvent<TEventName extends GlobalEventNames>(
    frame: string,
    type: TEventName,
    callback: (event: GlobalEvent<TEventName>) => GlobalEventResult<TEventName>,
  ): VoidFunction {
    const listener = ((event: GlobalEvent<TEventName>) => {
      const response = callback(event)

      if (event.cancelable && !event.defaultPrevented && response === false) {
        event.preventDefault()
      }
    }) as EventListener

    return this.registerListener(`inertia:${frame}:${type}`, listener)
  }

  public on(event: InternalEvent, callback: VoidFunction): VoidFunction {
    this.internalListeners.push({ event, listener: callback })

    return () => {
      this.internalListeners = this.internalListeners.filter((listener) => listener.listener !== callback)
    }
  }

  public onMissingHistoryItem() {
    // At this point, the user has probably cleared the state
    // Mark the current page as cleared so that we don't try to write anything to it.
    Router.for('_top').currentPage.clear()
    // Fire an event so that that any listeners can handle this situation
    this.fireInternalEvent('missingHistoryItem')
  }

  public fireInternalEvent(event: InternalEvent): void {
    this.internalListeners.filter((listener) => listener.event === event).forEach((listener) => listener.listener())
  }

  protected registerListener(type: string, listener: EventListener): VoidFunction {
    document.addEventListener(type, listener)

    return () => document.removeEventListener(type, listener)
  }

  protected handlePopstateEvent(event: PopStateEvent): void {
    const state = event.state || null
    if (event.skipInertia) return;

    if (state === null) {
      const url = hrefToUrl(Router.for("_top").currentPage.get().url)
      url.hash = window.location.hash

      history.replaceState("_top", { ...Router.for("_top").currentPage.get(), url: url.href })
      Scroll.reset()

      return
    }

    if (!history.isValidState(state)) {

      return this.onMissingHistoryItem()
    }
    let framesToUpdate: string[] = []
    if (state.c < history.counter) {
      framesToUpdate = history.lastChangedFrames || []
    }
    if (state.c > history.counter) {
      framesToUpdate = window.history.state?.changedFrames || []
    }
    history.counter = state.c
    history.lastChangedFrames = state.changedFrames || []
    history
    .decrypt(state.frames)
    .then((data) => {
        const promises = framesToUpdate.map(async (frame) => {
          if (!data[frame]) return
          const page = Router.for(frame)?.currentPage
          if (!page) return
          await page.setQuietly(data[frame], { preserveState: false })
          fireNavigateEvent(page.get(), frame)
        })

        Promise.all(promises).then(() => {
          Scroll.restore(history.getScrollRegions())
        })
      })
      .catch(() => {
        this.onMissingHistoryItem()
      })
  }
}

export const eventHandler = new EventHandler()
