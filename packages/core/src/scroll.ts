import { requestAnimationFrame } from './domUtils'
import { history } from './history'
import { ScrollRegion } from './types'

const isServer = typeof window === 'undefined'
const isFirefox = !isServer && /Firefox/i.test(window.navigator.userAgent)
const DEFAULT_FRAME_ID = '_top'

export class Scroll {
  public static save(frameId = '_top'): void {
    history.saveScrollPositions(this.getScrollRegions(), frameId)
  }

  public static getScrollRegions(): ScrollRegion[] {
    return Array.from(this.regions()).map((region) => ({
      top: region.scrollTop,
      left: region.scrollLeft,
    }))
  }

  protected static regions(): NodeListOf<Element> {
    return document.querySelectorAll('[scroll-region]')
  }

  public static scrollToTop(): void {
    if (isFirefox && getComputedStyle(document.documentElement).scrollBehavior === 'smooth') {
      // Firefox has a bug with smooth scrolling to (0, 0) when navigating to pages that are shorter than the previous page.
      return requestAnimationFrame(() => window.scrollTo(0, 0), 2)
    }

    window.scrollTo(0, 0)
  }

  public static reset(frameId = DEFAULT_FRAME_ID): void {
    // Non-top frames should never touch the document scroll position.
    if (frameId !== DEFAULT_FRAME_ID) {
      return
    }

    const anchorHash = isServer ? null : window.location.hash

    if (!anchorHash) {
      // Reset the document scroll position if there is no hash.
      this.scrollToTop()
    }

    this.regions().forEach((region) => {
      if (typeof region.scrollTo === 'function') {
        region.scrollTo(0, 0)
      } else {
        region.scrollTop = 0
        region.scrollLeft = 0
      }
    })

    this.save(frameId)
    this.scrollToAnchor(frameId)
  }

  public static scrollToAnchor(frameId = DEFAULT_FRAME_ID): void {
    // Non-top frames should not trigger document-level anchor scrolling.
    if (frameId !== DEFAULT_FRAME_ID) {
      return
    }

    const anchorHash = isServer ? null : window.location.hash

    if (anchorHash) {
      // We're using a setTimeout() here as a workaround for a bug in the React adapter where the
      // rendering isn't completing fast enough, causing the anchor link to not be scrolled to.
      setTimeout(() => {
        const anchorElement = document.getElementById(anchorHash.slice(1))
        anchorElement ? anchorElement.scrollIntoView() : this.scrollToTop()
      })
    }
  }

  public static restore(scrollRegions: ScrollRegion[], frameId = '_top'): void {
    if (isServer) {
      return
    }

    // Non-top frames should not touch the document scroll or global
    // scroll-region elements.
    if (frameId !== DEFAULT_FRAME_ID) {
      return
    }

    window.requestAnimationFrame(() => {
      this.restoreDocument(frameId)
      this.restoreScrollRegions(scrollRegions)
    })
  }

  public static restoreScrollRegions(scrollRegions: ScrollRegion[]): void {
    if (isServer) {
      return
    }

    this.regions().forEach((region: Element, index: number) => {
      const scrollPosition = scrollRegions[index]

      if (!scrollPosition) {
        return
      }

      if (typeof region.scrollTo === 'function') {
        region.scrollTo(scrollPosition.left, scrollPosition.top)
      } else {
        region.scrollTop = scrollPosition.top
        region.scrollLeft = scrollPosition.left
      }
    })
  }

  public static restoreDocument(frameId = '_top'): void {
    if (frameId !== DEFAULT_FRAME_ID) {
      return
    }

    const scrollPosition = history.getDocumentScrollPosition(frameId)
    window.scrollTo(scrollPosition.left, scrollPosition.top)
  }

  public static onScroll(event: Event): void {
    const target = event.target as Element

    if (typeof target.hasAttribute === 'function' && target.hasAttribute('scroll-region')) {
      this.save()
    }
  }

  public static onWindowScroll(frameId = '_top'): void {
    history.saveDocumentScrollPosition({
      top: window.scrollY,
      left: window.scrollX,
    }, frameId)
  }
}
