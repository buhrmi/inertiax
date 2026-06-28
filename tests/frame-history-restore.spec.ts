import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  test.skip(process.env.PACKAGE !== 'svelte', 'Svelte-only test')
})

test('Frame with skipHistoryRestore always makes an HTTP request on mount', async ({ page }) => {
  const paneRequests: string[] = []
  page.on('request', (r) => {
    if (r.url().includes('/frame-history-restore/pane')) {
      paneRequests.push(r.url())
    }
  })

  // First visit
  await page.goto('/svelte/frame-history-restore')

  // Click link in the skipHistoryRestore frame
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

test('scroll-region is restored when Frame remounts after being hidden', async ({ page }) => {
  // This test isolates Frame-mount scroll restore from popstate.
  // The Frame is toggled via Svelte {#if} — hidden (unmounted), then shown (remounted).
  // On remount, decryptHistory() + restoreScroll() should restore the scroll position.
  await page.goto('/svelte/frame-mount-scroll-restore')
  await expect(page.getByTestId('visible-status')).toHaveText('visible')
  await expect(page.getByTestId('scroll-mount-step')).toHaveText('0')
  await page.waitForTimeout(300)

  const scrollRegion = page.getByTestId('scroll-region')

  // Scroll the frame's scroll-region to a known position
  await scrollRegion.evaluate((el) => el.scrollTo(0, 400))
  await page.waitForTimeout(200)

  // Verify scroll was applied
  const scrolledTop = await scrollRegion.evaluate((el) => el.scrollTop)
  expect(scrolledTop).toBeGreaterThan(0)

  // Hide the Frame — it unmounts from the DOM
  await page.getByTestId('toggle-hide').click()
  await expect(page.getByTestId('visible-status')).toHaveText('hidden')
  await page.waitForTimeout(200)

  // Show the Frame — it remounts fresh. decryptHistory + restoreScroll should restore scroll
  await page.getByTestId('toggle-show').click()
  await expect(page.getByTestId('visible-status')).toHaveText('visible')
  await page.waitForTimeout(500)

  const restoredTop = await scrollRegion.evaluate((el) => el.scrollTop)
  expect(restoredTop).toBeGreaterThan(0)
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
