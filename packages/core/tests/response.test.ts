import { afterEach, describe, expect, it, vi } from 'vitest'
import { RequestParams } from '../src/requestParams'
import { Response } from '../src/response'
import type { HttpResponse, InternalActiveVisit, Page } from '../src/types'

function makeWindow(href: string) {
  const storage = new Map<string, string>()
  const reload = vi.fn()
  const listeners = new Map<string, EventListener[]>()

  const location = {
    href,
    reload,
    toString() {
      return this.href
    },
  }

  return {
    location,
    sessionStorage: {
      setItem: (key: string, value: string) => storage.set(key, value),
      getItem: (key: string) => storage.get(key) ?? null,
      removeItem: (key: string) => storage.delete(key),
      clear: () => storage.clear(),
    },
    addEventListener: (type: string, listener: EventListener) => {
      if (!listeners.has(type)) listeners.set(type, [])
      listeners.get(type)!.push(listener)
    },
    removeEventListener: () => {},
    dispatchEvent: (event: Event) => {
      ;(listeners.get(event.type) ?? []).forEach((l) => l(event))
      return !event.defaultPrevented
    },
    Event,
    CustomEvent,
  }
}

function makeParams(frameId: string) {
  return RequestParams.create({ frameId, preserveScroll: false } as InternalActiveVisit)
}

function makeResponse(frameId: string) {
  return new Response(
    makeParams(frameId),
    { status: 409, data: '', headers: { 'x-inertia-location': 'http://example.test/frame-url' } } as HttpResponse,
    {} as Page,
  )
}

describe('Response.locationVisit', () => {
  const originalWindow = (globalThis as any).window

  afterEach(() => {
    if (originalWindow === undefined) {
      delete (globalThis as any).window
      return
    }

    ;(globalThis as any).window = originalWindow
  })

  it('reloads current page for non-top frames', () => {
    const mockWindow = makeWindow('http://example.test/current-page')
    ;(globalThis as any).window = mockWindow

    ;(makeResponse('left') as any).locationVisit(new URL('http://example.test/frame-url'))

    expect(mockWindow.location.reload).toHaveBeenCalledTimes(1)
    expect(mockWindow.location.href).toBe('http://example.test/current-page')
  })

  it('navigates to location url for top frame when url differs', () => {
    const mockWindow = makeWindow('http://example.test/current-page')
    ;(globalThis as any).window = mockWindow

    // Different URLs → should navigate (set href to new url), not reload
    ;(makeResponse('_top') as any).locationVisit(new URL('http://example.test/frame-url'))

    // On different URLs, reload is not called — browser navigates instead
    expect(mockWindow.location.reload).not.toHaveBeenCalled()
  })
})
