import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  test.skip(process.env.PACKAGE !== 'svelte', 'Svelte-only test')
})

test.describe('Frame-scoped router events', () => {
  test('each router only receives its own frame events', async ({ page }) => {
    await page.goto('/svelte/frame-events')
    await expect(page.getByTestId('left-label')).toBeVisible()
    await expect(page.getByTestId('right-label')).toBeVisible()

    // All start at 0
    await expect(page.getByTestId('top-count')).toHaveText('0')
    await expect(page.getByTestId('left-count')).toHaveText('0')
    await expect(page.getByTestId('right-count')).toHaveText('0')

    // Click right link first — only right router fires
    const rightResp = page.waitForResponse(r => r.url().includes('/svelte/frame-events/right') && r.status() === 200)
    await page.getByTestId('right-link').click()
    await rightResp
    await expect(page.getByTestId('right-label')).toBeVisible()
    await expect(page.getByTestId('right-count')).toHaveText('1')
    await expect(page.getByTestId('top-count')).toHaveText('0')
    await expect(page.getByTestId('left-count')).toHaveText('0')

    // Click left link — only left router fires
    const leftResp = page.waitForResponse(r => r.url().includes('/svelte/frame-events/left') && r.status() === 200)
    await page.getByTestId('left-link').click()
    await leftResp
    await expect(page.getByTestId('left-label')).toBeVisible()
    await expect(page.getByTestId('left-count')).toHaveText('1')
    await expect(page.getByTestId('right-count')).toHaveText('1')
    await expect(page.getByTestId('top-count')).toHaveText('0')
  })
})
