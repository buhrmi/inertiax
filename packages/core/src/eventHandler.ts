import debounce from './debounce'
import { fireNavigateEvent } from './events'
import { history } from './history'
import { Scroll } from './scroll'
import { GlobalEvent, GlobalEventNames, GlobalEventResult, InternalEvent } from './types'
// import { hrefToUrl } from './url'
import { Router } from './router'

class EventHandler {
  protected internalListeners: {
    event: InternalEvent
    listener: VoidFunction
  }[] = []

  public init() {
    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', this.handlePopstateEvent.bind(this))
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

    // Let's assume his doesn't happen, because we should ALWAYS have a state when using browser nav
    if (state === null) {
      throw new Error('Inertia X: Missing state in popstate event')
      // const url = hrefToUrl(currentPage.get().url)
      // url.hash = window.location.hash

      // history.replaceState({ ...currentPage.get(), url: url.href })
      // Scroll.reset()

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
        for (const frame of framesToUpdate) {
          if (!data[frame]) continue
          const page = Router.for(frame)?.currentPage
          if (!page) continue
          page.setQuietly(data[frame], { preserveState: false }).then(() => {
            Scroll.restore(history.getScrollRegions())
            fireNavigateEvent(page.get())
          })
        }
      })
      .catch(() => {
        this.onMissingHistoryItem()
      })
  }
}

export const eventHandler = new EventHandler()
