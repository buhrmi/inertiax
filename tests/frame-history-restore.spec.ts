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
