import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  test.skip(process.env.PACKAGE !== 'svelte', 'Svelte-only test')
})

test('Frame with forceRequest always makes an HTTP request on mount', async ({ page }) => {
  const paneRequests: string[] = []
  page.on('request', (r) => {
    if (r.url().includes('/frame-history-restore/pane')) {
      paneRequests.push(r.url())
    }
  })

  // First visit
  await page.goto('/svelte/frame-history-restore')

  // Click link in the forceRequest frame
  const skipFrame = page.getByTestId('skip-section')
  await expect(skipFrame.getByTestId('history-step')).toHaveText('0')
  await skipFrame.getByTestId('history-next-link').click()
  await expect(skipFrame.getByTestId('history-step')).toHaveText('1')

  // Navigate away
  await page.goto('/')
  await expect(page.locator('#app')).toContainText('Test App Entrypoint')

  // Reset counter
  paneRequests.length = 0

  // Go back — the skipHistoryRestore frame SHOULD make an HTTP request
  await page.goBack()
  await expect(skipFrame.getByTestId('history-step')).toHaveText('1')

  // Should have made a new HTTP request (skipHistoryRestore prevents history restore)
  expect(paneRequests.length).toBeGreaterThanOrEqual(1)
})

test('scroll-region is restored within same Frame on popstate', async ({ page }) => {
  // Simpler case: Frame stays mounted, popstate within same document
  await page.goto('/svelte/frame-scroll-history')
  await expect(page.getByTestId('scroll-history-step')).toHaveText('0')
  await page.waitForTimeout(300)

  const scrollRegion = page.getByTestId('scroll-region')

  await scrollRegion.evaluate((el) => el.scrollTo(0, 400))
  await page.waitForTimeout(200)

  await page.getByTestId('scroll-history-next-link').click()
  await expect(page.getByTestId('scroll-history-step')).toHaveText('1')
  await page.waitForTimeout(300)

  // Go back to step 0 — Frame stays mounted, popstate restores scroll
  await page.goBack()
  await expect(page.getByTestId('scroll-history-step')).toHaveText('0')
  await page.waitForTimeout(300)

  const restoredTop = await scrollRegion.evaluate((el) => el.scrollTop)
  expect(restoredTop).toBeGreaterThan(0)
})

test('Frame restores state and scroll position on browser reload', async ({ page }) => {
  test.setTimeout(20_000)

  const paneRequests: string[] = []
  page.on('request', (r) => {
    if (r.url().includes('/frame-scroll-history/pane')) {
      paneRequests.push(r.url())
    }
  })

  // Initial visit — Frame loads via HTTP, stores state in history on mount.
  await page.goto('/svelte/frame-scroll-history')
  await expect(page.getByTestId('scroll-history-step')).toHaveText('0')
  await page.waitForTimeout(300)

  const scrollRegion = page.getByTestId('scroll-region')

  // Scroll to a known position so we can verify scroll-restore on reload.
  await scrollRegion.evaluate((el) => el.scrollTo(0, 400))
  await page.waitForTimeout(300)

  // Track requests after reload
  paneRequests.length = 0

  // Browser reload — Frame should restore from history, not make an HTTP request.
  await page.reload()
  await page.waitForTimeout(500)

  // Frame restored from history — step should still be 0.
  await expect(page.getByTestId('scroll-history-step')).toHaveText('0')

  // Scroll-region should be restored.
  await expect.poll(() => scrollRegion.evaluate((el) => el.scrollTop), { timeout: 10_000 }).toBeGreaterThan(0)

  // No HTTP request should have been made for the pane (restored from history).
  expect(paneRequests.length).toBe(0)
})
