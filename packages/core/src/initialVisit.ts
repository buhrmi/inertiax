import { eventHandler } from './eventHandler'
import { fireFlashEvent, fireNavigateEvent } from './events'
import { history } from './history'
import { navigationType } from './navigationType'
import { page as currentPage } from './page'
import { Scroll } from './scroll'
import { SessionStorage } from './sessionStorage'
import { LocationVisit, Page } from './types'
import { uid } from './uid'

export class InitialVisit {
  public static handle(frame = '_top'): void {
    this.clearRememberedStateOnReload(frame)

    const scenarios = [this.handleBackForward, this.handleLocation, this.handleDefault]

    scenarios.find((handler) => handler.bind(this)(frame))
  }

  protected static clearRememberedStateOnReload(frame = '_top'): void {
    if (navigationType.isReload()) {
      history.deleteState(history.rememberedState, frame)
      history.clearInitialState(history.rememberedState, frame)
    }
  }

  protected static handleBackForward(frame = '_top'): boolean {
    if (!navigationType.isBackForward() || !history.browserHasHistoryEntry(frame)) {
      return false
    }

    const scrollRegions = history.getScrollRegions()

    history
      .decrypt(null, frame)
      .then((data) => {
        const visitId = uid()

        currentPage.set(data, { preserveScroll: true, preserveState: true, visitId }, frame).then(() => {
          Scroll.restore(scrollRegions, frame)
          fireNavigateEvent(currentPage.get(frame), frame, { visitId })
        })
      })
      .catch(() => {
        eventHandler.onMissingHistoryItem(frame)
      })

    return true
  }

  /**
   * @link https://inertiajs.com/redirects#external-redirects
   */
  protected static handleLocation(frame = '_top'): boolean {
    if (!SessionStorage.exists(SessionStorage.locationVisitKey)) {
      return false
    }

    const locationVisit: LocationVisit = SessionStorage.get(SessionStorage.locationVisitKey) || {}

    SessionStorage.remove(SessionStorage.locationVisitKey)

    if (typeof window !== 'undefined') {
      currentPage.setUrlHash(window.location.hash, frame)
    }

    history
      .decrypt(currentPage.get(frame), frame)
      .then(() => {
        const visitId = uid()
        const rememberedState = history.getState<Page['rememberedState']>(history.rememberedState, {}, frame)
        const scrollRegions = history.getScrollRegions()
        currentPage.remember(rememberedState, frame)

        currentPage
          .set(currentPage.get(frame), {
            preserveScroll: locationVisit.preserveScroll,
            preserveState: true,
            initialRender: true,
            visitId,
          }, frame)
          .then(() => {
            if (locationVisit.preserveScroll) {
              Scroll.restore(scrollRegions, frame)
            }

            this.fireInitialEvents(frame, visitId)
          })
      })
      .catch(() => {
        eventHandler.onMissingHistoryItem(frame)
      })

    return true
  }

  protected static handleDefault(frame = '_top'): void {
    if (typeof window !== 'undefined') {
      currentPage.setUrlHash(window.location.hash, frame)
    }

    const visitId = uid()

    // Only preserve scroll for the top frame — sub-frames that just mounted
    // have no scroll position to preserve (all ancestor scroll-regions are at
    // 0,0).  Preserving (0,0) would overwrite any history-based scroll
    // restoration performed by Frame.svelte's $effect during the swap.
    const preserveScroll = frame === '_top'

    currentPage.set(currentPage.get(frame), { preserveScroll, preserveState: true, initialRender: true, visitId }, frame).then(() => {
      if (navigationType.isReload()) {
        Scroll.restore(history.getScrollRegions(), frame)
      } else {
        Scroll.scrollToAnchor(frame)
      }

      this.fireInitialEvents(frame, visitId)
    })
  }

  protected static fireInitialEvents(frame: string, visitId: string): void {
    const page = currentPage.get(frame)

    fireNavigateEvent(page, frame, { visitId })

    if (Object.keys(page.flash).length > 0) {
      queueMicrotask(() => fireFlashEvent(page.flash, frame))
    }
  }
}
