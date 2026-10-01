import { expect, test, type Page } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  test.skip(process.env.PACKAGE !== 'svelte', 'Svelte-only test')
})

/** The frame ids currently stored in the browser history entry. */
const storedFrameIds = (page: Page) =>
  page.evaluate(() => Object.keys((window.history.state as any)?.frames ?? {}))

test.describe('Frame history options', () => {
  test('historyState={false} never writes the frame page into the history entry', async ({ page }) => {
    await page.goto('/svelte/frame-history-options')
    await expect(page.getByTestId('opts-step-normal')).toHaveText('0')
    await expect(page.getByTestId('opts-step-no-state')).toHaveText('0')

    // The default frame stores its page; the historyState={false} frame does not.
    const stored = await storedFrameIds(page)
    expect(stored).toContain('opts-normal')
    expect(stored).not.toContain('opts-no-state')

    // In-frame navigation still works — and is still not recorded.
    await page.getByTestId('opts-next-no-state').click()
    await expect(page.getByTestId('opts-step-no-state')).toHaveText('1')
    expect(await storedFrameIds(page)).not.toContain('opts-no-state')
  })

  test('historyState={false} cannot be restored on reload, even with restore', async ({ page }) => {
    test.setTimeout(20_000)

    const noStateRequests: string[] = []
    page.on('request', (request) => {
      if (request.url().includes('frame-history-options/pane') && request.url().includes('frame=no-state')) {
        noStateRequests.push(request.url())
      }
    })

    await page.goto('/svelte/frame-history-options')

    // Advance both frames one step.
    await page.getByTestId('opts-next-normal').click()
    await expect(page.getByTestId('opts-step-normal')).toHaveText('1')
    await page.getByTestId('opts-next-no-state').click()
    await expect(page.getByTestId('opts-step-no-state')).toHaveText('1')

    noStateRequests.length = 0
    await page.reload()

    // The default frame restores its stored page; the historyState={false}
    // frame has nothing stored, so it re-fetches from `src`.
    await expect(page.getByTestId('opts-step-normal')).toHaveText('1')
    await expect(page.getByTestId('opts-step-no-state')).toHaveText('0')
    expect(noStateRequests.length).toBeGreaterThanOrEqual(1)
  })

  test('historyNavigation={false} ignores back/forward but still stores its page', async ({ page }) => {
    await page.goto('/svelte/frame-history-options')
    await expect(page.getByTestId('opts-step-normal')).toHaveText('0')
    await expect(page.getByTestId('opts-step-no-nav')).toHaveText('0')
    await expect(page.getByTestId('opts-step-no-state')).toHaveText('0')

    // historyNavigation={false} still writes its page; historyState={false} does not.
    const stored = await storedFrameIds(page)
    expect(stored).toContain('opts-normal')
    expect(stored).toContain('opts-no-nav')
    expect(stored).not.toContain('opts-no-state')

    // Simulate landing on a history entry whose stored frame pages differ.
    await page.evaluate(() => {
      const state = JSON.parse(JSON.stringify(window.history.state))
      for (const id of ['opts-normal', 'opts-no-nav']) {
        state.frames[id].page.props.step = 99
      }
      window.dispatchEvent(new PopStateEvent('popstate', { state }))
    })

    // The default frame follows history; the opted-out frames are untouched.
    await expect(page.getByTestId('opts-step-normal')).toHaveText('99')
    await expect(page.getByTestId('opts-step-no-nav')).toHaveText('0')
    await expect(page.getByTestId('opts-step-no-state')).toHaveText('0')
  })
})
