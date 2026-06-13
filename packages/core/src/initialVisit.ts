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
  public static handle(frameId = '_top'): void {
    this.clearRememberedStateOnReload(frameId)

    const scenarios = [this.handleBackForward, this.handleLocation, this.handleDefault]

    scenarios.find((handler) => handler.bind(this)(frameId))
  }

  protected static clearRememberedStateOnReload(frameId = '_top'): void {
    if (navigationType.isReload()) {
      history.deleteState(history.rememberedState, frameId)
      history.clearInitialState(history.rememberedState, frameId)
    }
  }

  protected static handleBackForward(frameId = '_top'): boolean {
    if (!navigationType.isBackForward() || !history.browserHasHistoryEntry(frameId)) {
      return false
    }

    const scrollRegions = history.getScrollRegions(frameId)

    history
      .decrypt(null, frameId)
      .then((data) => {
        const visitId = uid()

        currentPage.set(data, { preserveScroll: true, preserveState: true, visitId }, frameId).then(() => {
          Scroll.restore(scrollRegions, frameId)
          fireNavigateEvent(currentPage.get(frameId), { visitId })
        })
      })
      .catch(() => {
        eventHandler.onMissingHistoryItem(frameId)
      })

    return true
  }

  /**
   * @link https://inertiajs.com/redirects#external-redirects
   */
  protected static handleLocation(frameId = '_top'): boolean {
    if (!SessionStorage.exists(SessionStorage.locationVisitKey)) {
      return false
    }

    const locationVisit: LocationVisit = SessionStorage.get(SessionStorage.locationVisitKey) || {}

    SessionStorage.remove(SessionStorage.locationVisitKey)

    if (typeof window !== 'undefined') {
      currentPage.setUrlHash(window.location.hash, frameId)
    }

    history
      .decrypt(currentPage.get(frameId), frameId)
      .then(() => {
        const visitId = uid()
        const rememberedState = history.getState<Page['rememberedState']>(history.rememberedState, {}, frameId)
        const scrollRegions = history.getScrollRegions(frameId)
        currentPage.remember(rememberedState, frameId)

        currentPage
          .set(currentPage.get(frameId), {
            preserveScroll: locationVisit.preserveScroll,
            preserveState: true,
            visitId,
          }, frameId)
          .then(() => {
            if (locationVisit.preserveScroll) {
              Scroll.restore(scrollRegions, frameId)
            }

            this.fireInitialEvents(frameId, visitId)
          })
      })
      .catch(() => {
        eventHandler.onMissingHistoryItem(frameId)
      })

    return true
  }

  protected static handleDefault(frameId = '_top'): void {
    if (typeof window !== 'undefined') {
      currentPage.setUrlHash(window.location.hash, frameId)
    }

    const visitId = uid()

    currentPage.set(currentPage.get(frameId), { preserveScroll: true, preserveState: true, visitId }, frameId).then(() => {
      if (navigationType.isReload()) {
        Scroll.restore(history.getScrollRegions(frameId), frameId)
      } else {
        Scroll.scrollToAnchor(frameId)
      }

      this.fireInitialEvents(frameId, visitId)
    })
  }

  protected static fireInitialEvents(frameId: string, visitId: string): void {
    const page = currentPage.get(frameId)

    fireNavigateEvent(page, { visitId })

    if (Object.keys(page.flash).length > 0) {
      queueMicrotask(() => fireFlashEvent(page.flash))
    }
  }
}
