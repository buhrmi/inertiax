import { expect, test } from '@playwright/test'

test.describe('Frame interceptLinks', () => {
  test('a frame with interceptLinks={false} lets clicks fall through to the parent frame', async ({ page }) => {
    await page.goto('/svelte/frame-intercept-links')

    await expect(page.getByTestId('frame-intercept-outer')).toBeVisible()
    await expect(page.getByTestId('frame-intercept-inner')).toBeVisible()

    await page.getByTestId('frame-intercept-inner-link').click()

    // The top frame handled the click, so the whole outer page was replaced.
    await expect(page).toHaveURL(/\/svelte\/frame-intercept-link-target$/)
    await expect(page.getByTestId('frame-intercept-target')).toBeVisible()
    await expect(page.getByTestId('frame-intercept-outer')).toHaveCount(0)
    await expect(page.getByTestId('frame-intercept-inner')).toHaveCount(0)
  })

  test('a frame with the default interceptLinks handles clicks itself', async ({ page }) => {
    await page.goto('/svelte/frame-intercept-links/enabled')

    await expect(page.getByTestId('frame-intercept-outer')).toBeVisible()
    await expect(page.getByTestId('frame-intercept-inner')).toBeVisible()

    await page.getByTestId('frame-intercept-inner-link').click()

    // The inner frame handled the click, so the outer page is still there.
    await expect(page.getByTestId('frame-intercept-target')).toBeVisible()
    await expect(page.getByTestId('frame-intercept-outer')).toBeVisible()
    await expect(page.getByTestId('frame-intercept-inner')).toHaveCount(0)
    await expect(page).toHaveURL(/\/svelte\/frame-intercept-links\/enabled$/)
  })
})
