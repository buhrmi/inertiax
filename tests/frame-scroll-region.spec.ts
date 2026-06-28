import { expect, test } from '@playwright/test'
import { scrollElementTo } from './support'

test.beforeEach(async ({ page }) => {
  test.skip(process.env.PACKAGE !== 'svelte', 'Svelte-only test')
})

test('scroll-region around a Frame resets to top on frame navigation', async ({ page }) => {
  await page.goto('/svelte/frame-scroll-region')

  await expect(page.getByTestId('pane-step')).toHaveText('0')

  const scrollRegion = page.getByTestId('scroll-region')

  // Scroll using scrollTo which fires a real scroll event, then wait for debounce
  await scrollElementTo(page, scrollRegion.evaluate((el) => el.scrollTo(0, 500)))
  const scrolledTop = await scrollRegion.evaluate((el) => el.scrollTop)
  expect(scrolledTop).toBeGreaterThan(0)

  // Click a link inside the frame
  await page.getByTestId('pane-next-link').click()

  await expect(page.getByTestId('pane-step')).toHaveText('1')

  // The scroll-region should have scrolled back to top
  await expect.poll(() => scrollRegion.evaluate((el) => el.scrollTop)).toBe(0)
})

test.fixme('scroll-region restores position on back navigation after frame visit', async ({ page }) => {
  await page.goto('/svelte/frame-scroll-region')
  await expect(page.getByTestId('pane-step')).toHaveText('0')
  // Wait for initial render scroll events to settle
  await page.waitForTimeout(200)

  const scrollRegion = page.getByTestId('scroll-region')

  // Scroll to 300, wait for onScroll save, then push to step 1
  await scrollElementTo(page, scrollRegion.evaluate((el) => el.scrollTo(0, 300)))
  await page.getByTestId('pane-next-link').click()
  await expect(page.getByTestId('pane-step')).toHaveText('1')

  // Scroll to 600, wait for onScroll save, then push to step 2
  await scrollElementTo(page, scrollRegion.evaluate((el) => el.scrollTo(0, 600)))
  await page.getByTestId('pane-next-link').click()
  await expect(page.getByTestId('pane-step')).toHaveText('2')

  // goBack to step 1 — should restore scroll to 600
  await page.goBack()
  await expect(page.getByTestId('pane-step')).toHaveText('1')
  await expect.poll(() => scrollRegion.evaluate((el) => el.scrollTop)).toBe(600)

  // goBack to step 0 — should restore scroll to 300
  await page.goBack()
  await expect(page.getByTestId('pane-step')).toHaveText('0')
  await expect.poll(() => scrollRegion.evaluate((el) => el.scrollTop)).toBe(300)
})
