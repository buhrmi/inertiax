import { expect, test } from '@playwright/test'
import { requests } from './support'

test.beforeEach(async ({ page }) => {
  test.skip(process.env.PACKAGE !== 'svelte', 'Svelte-only test')
})

test('usePoll in a frame polls the frame URL, not the top frame URL', async ({ page }) => {
  await page.goto('/svelte/frame-poll')
  await expect(page.getByTestId('frame-poll-pane')).toBeVisible()

  requests.listen(page)

  // The pane polls every 200ms. Wait long enough for at least two ticks.
  await page.waitForTimeout(700)

  const paneRequests = requests.requests.filter((r) => r.url().includes('/svelte/frame-poll/pane'))
  await expect(paneRequests.length).toBeGreaterThanOrEqual(2)

  // The top frame URL must never be polled.
  const topFrameRequests = requests.requests.filter((r) => new URL(r.url()).pathname === '/svelte/frame-poll')
  await expect(topFrameRequests).toHaveLength(0)

  // Polling should have re-rendered the pane with updated data.
  await expect
    .poll(async () => Number(await page.getByTestId('polls').textContent()))
    .toBeGreaterThanOrEqual(2)
})
