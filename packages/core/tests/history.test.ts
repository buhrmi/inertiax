import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Page } from '../src/types'

const DEFAULT_URL = 'https://app.test/modal.json'

const makePage = (url: string): Page => ({
  component: 'TestComponent',
  props: {
    errors: {},
  },
  url,
  version: null,
  rescuedProps: [],
  flash: {},
  rememberedState: {},
})

describe('history browser URL fallback', () => {
  const originalWindow = globalThis.window

  beforeEach(() => {
    const state: { frames: Record<string, unknown> } = { frames: {} }

    ;(globalThis as typeof globalThis & { window: Window }).window = {
      navigator: { userAgent: 'Mozilla/5.0' },
      location: { href: DEFAULT_URL },
      history: {
        state,
        scrollRestoration: 'auto',
        pushState: vi.fn(),
        replaceState: vi.fn(),
      },
    } as unknown as Window
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.resetModules()

    if (originalWindow) {
      ;(globalThis as typeof globalThis & { window: Window }).window = originalWindow
      return
    }

    delete (globalThis as typeof globalThis & { window?: Window }).window
  })

  it('keeps current browser URL for non-top frame pushState when browserUrl is omitted', async () => {
    const { history } = await import('../src/history')

    const doPushSpy = vi.spyOn(history as any, 'doPushState').mockResolvedValue(undefined)

    history.pushState(makePage('/modal-content-2.json'), null, 'inx-modal')
    await history.processQueue()

    expect(doPushSpy).toHaveBeenCalledWith(
      expect.objectContaining({ page: expect.objectContaining({ url: '/modal-content-2.json' }) }),
      DEFAULT_URL,
      'inx-modal',
    )
  })

  it('keeps current browser URL for non-top frame replaceState when browserUrl is omitted', async () => {
    const { history } = await import('../src/history')

    const doReplaceSpy = vi.spyOn(history as any, 'doReplaceState').mockResolvedValue(undefined)

    history.replaceState(makePage('/modal-content-2.json'), null, 'inx-modal')
    await history.processQueue()

    expect(doReplaceSpy).toHaveBeenCalledWith(
      expect.objectContaining({ page: expect.objectContaining({ url: '/modal-content-2.json' }) }),
      DEFAULT_URL,
      'inx-modal',
    )
  })

  it('uses page URL for top frame pushState fallback', async () => {
    const { history } = await import('../src/history')

    const doPushSpy = vi.spyOn(history as any, 'doPushState').mockResolvedValue(undefined)

    history.pushState(makePage('/welcome.json'))
    await history.processQueue()

    expect(doPushSpy).toHaveBeenCalledWith(
      expect.objectContaining({ page: expect.objectContaining({ url: '/welcome.json' }) }),
      '/welcome.json',
      '_top',
    )
  })
})