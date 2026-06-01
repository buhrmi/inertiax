import debounce from './debounce'
import { page as currentPage } from './page'
import { Scroll } from './scroll'
import { GlobalEvent, GlobalEventNames, GlobalEventResult, InternalEvent } from './types'

class EventHandler {
  protected initialized = false

  protected internalListeners: {
    event: InternalEvent
    listener: (...args: any[]) => void
  }[] = []

  protected popstateHandlers = new Map<string, (state: any) => void>()
  protected pageshowHandlers = new Map<string, () => void>()

  public init() {
    if (this.initialized) {
      return
    }

    this.initialized = true

    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', this.handlePopstateEvent.bind(this))
      window.addEventListener('pageshow', this.handlePageshowEvent.bind(this))
      window.addEventListener('scroll', debounce(() => Scroll.onWindowScroll(), 100), true)
    }

    if (typeof document !== 'undefined') {
      document.addEventListener('scroll', debounce(Scroll.onScroll.bind(Scroll), 100), true)
    }
  }

  public onGlobalEvent<TEventName extends GlobalEventNames>(
    type: TEventName,
    callback: (event: GlobalEvent<TEventName>) => GlobalEventResult<TEventName>,
  ): VoidFunction {
    const listener = ((event: GlobalEvent<TEventName>) => {
      const response = callback(event)

      if (event.cancelable && !event.defaultPrevented && response === false) {
        event.preventDefault()
      }
    }) as EventListener

    return this.registerListener(`inertia:${type}`, listener)
  }

  public on(event: InternalEvent, callback: (...args: any[]) => void): VoidFunction {
    this.internalListeners.push({ event, listener: callback })

    return () => {
      this.internalListeners = this.internalListeners.filter((listener) => listener.listener !== callback)
    }
  }

  public registerPopstateHandler(frameId: string, callback: (state: any) => void): VoidFunction {
    this.popstateHandlers.set(frameId, callback)

    return () => {
      this.popstateHandlers.delete(frameId)
    }
  }

  public registerPageshowHandler(frameId: string, callback: () => void): VoidFunction {
    this.pageshowHandlers.set(frameId, callback)

    return () => {
      this.pageshowHandlers.delete(frameId)
    }
  }

  public onMissingHistoryItem(frameId = '_top') {
    // At this point, the user has probably cleared the state
    // Mark the current page as cleared so that we don't try to write anything to it.
    currentPage.clear(frameId)
    // Fire an event so that that any listeners can handle this situation
    this.fireInternalEvent('missingHistoryItem', frameId)
  }

  public fireInternalEvent(event: InternalEvent, ...args: any[]): void {
    this.internalListeners
      .filter((listener) => listener.event === event)
      .forEach((listener) => listener.listener(...args))
  }

  protected registerListener(type: string, listener: EventListener): VoidFunction {
    document.addEventListener(type, listener)

    return () => document.removeEventListener(type, listener)
  }

  protected handlePageshowEvent(event: PageTransitionEvent): void {
    if (event.persisted) {
      this.pageshowHandlers.forEach((handler) => handler())
    }
  }

  protected handlePopstateEvent(event: PopStateEvent): void {
    this.popstateHandlers.forEach((handler) => handler(event.state || null))
  }
}

export const eventHandler = new EventHandler()
