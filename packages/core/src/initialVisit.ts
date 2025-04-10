import { eventHandler } from './eventHandler'
import { fireNavigateEvent } from './events'
import { history } from './history'
import { navigationType } from './navigationType'
import { Scroll } from './scroll'
import { SessionStorage } from './sessionStorage'
import { LocationVisit, Page } from './types'
import { Router } from './router'

export class InitialVisit {
  public static handle(): void {
    this.clearRememberedStateOnReload()

    const scenarios = [this.handleBackForward, this.handleLocation, this.handleDefault]

    scenarios.find((handler) => handler.bind(this)())
  }

  protected static clearRememberedStateOnReload(): void {
    if (navigationType.isReload()) {
      history.deleteState(history.rememberedState)
    }
  }

  protected static handleBackForward(): boolean {
    if (!navigationType.isBackForward() || !history.hasAnyState()) {
      return false
    }

    const topPage = Router.for("_top").currentPage

    const scrollRegions = history.getScrollRegions()

    history
      .decrypt()
      .then((data) => {
        Router.set(data, { preserveScroll: true, preserveState: true }).then(() => {
          Scroll.restore(scrollRegions)
          fireNavigateEvent(topPage.get(), "_top")
        })
      })
      .catch(() => {
        eventHandler.onMissingHistoryItem()
      })

    return true
  }

  /**
   * @link https://inertiajs.com/redirects#external-redirects
   */
  protected static handleLocation(): boolean {
    if (!SessionStorage.exists(SessionStorage.locationVisitKey)) {
      return false
    }

    const locationVisit: LocationVisit = SessionStorage.get(SessionStorage.locationVisitKey) || {}

    SessionStorage.remove(SessionStorage.locationVisitKey)
    const topPage = Router.for("_top").currentPage

    if (typeof window !== 'undefined') {
      topPage.setUrlHash(window.location.hash)
    }

    history
      .decrypt(Router.asFrames())
      .then(() => {
        const rememberedState = history.getState<Page['rememberedState']>(history.rememberedState, {})
        const scrollRegions = history.getScrollRegions()
        topPage.remember(rememberedState)

        topPage
          .set(topPage.get(), {
            preserveScroll: locationVisit.preserveScroll,
            preserveState: true,
          })
          .then(() => {
            if (locationVisit.preserveScroll) {
              Scroll.restore(scrollRegions)
            }

            fireNavigateEvent(topPage.get(), "_top")
          })
      })
      .catch(() => {
        eventHandler.onMissingHistoryItem()
      })

    return true
  }

  protected static handleDefault(): void {
    const topPage = Router.for("_top").currentPage

    if (typeof window !== 'undefined') {
      topPage.setUrlHash(window.location.hash)
    }

    topPage.set(topPage.get(), { preserveScroll: true, preserveState: true }).then(() => {
      if (navigationType.isReload()) {
        Scroll.restore(history.getScrollRegions())
      }
      fireNavigateEvent(topPage.get(), "_top")
    })
  }
}
