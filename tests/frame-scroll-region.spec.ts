import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  test.skip(process.env.PACKAGE !== 'svelte', 'Svelte-only test')
})

test('scroll-region around a Frame resets to top on frame navigation', async ({ page }) => {
  await page.goto('/svelte/frame-scroll-region')

  await expect(page.getByTestId('pane-step')).toHaveText('0')

  const scrollRegion = page.getByTestId('scroll-region')

  // Scroll the scroll-region down
  await scrollRegion.evaluate((el) => el.scrollTop = 500)
  const scrolledTop = await scrollRegion.evaluate((el) => el.scrollTop)
  expect(scrolledTop).toBeGreaterThan(0)

  // Click a link inside the frame
  await page.getByTestId('pane-next-link').click()

  await expect(page.getByTestId('pane-step')).toHaveText('1')

  // The scroll-region should have scrolled back to top
  await expect.poll(() => scrollRegion.evaluate((el) => el.scrollTop)).toBe(0)
})
