import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  test.skip(process.env.PACKAGE !== 'svelte', 'Svelte-only test')
})

test('nested frame without a scroll-region scrolls the document to top on navigation', async ({ page }) => {
  await page.goto('/svelte/frame-document-scroll')
  await expect(page.getByTestId('pane-step')).toHaveText('0')

  await page.evaluate(() => window.scrollTo(0, 800))
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0)

  // Click via evaluate() so Playwright doesn't scroll the link into view first
  // (that would reset the document scroll position and mask the bug).
  await page.getByTestId('pane-next-link').evaluate((el) => (el as HTMLElement).click())
  await expect(page.getByTestId('pane-step')).toHaveText('1')

  // No wrapping scroll-region: the document is the frame's scroll container,
  // so it must be reset to the top.
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
})

test('nested frame wrapped in a scroll-region does not scroll the document', async ({ page }) => {
  await page.goto('/svelte/frame-scroll-region')
  await expect(page.getByTestId('pane-step')).toHaveText('0')

  // Make the document scrollable and scroll it down.
  await page.evaluate(() => {
    document.body.style.paddingBottom = '3000px'
    window.scrollTo(0, 600)
  })
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0)

  await page.getByTestId('pane-next-link').evaluate((el) => (el as HTMLElement).click())
  await expect(page.getByTestId('pane-step')).toHaveText('1')

  // The frame owns a scroll-region, so only that region is reset — the
  // document scroll position must be left untouched.
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
})
