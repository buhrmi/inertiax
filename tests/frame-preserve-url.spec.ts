import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  test.skip(process.env.PACKAGE !== 'svelte', 'Svelte-only test')
})

test.describe('plain <a> data-preserve-url option', () => {
  test('normal link updates the browser URL in an updateBrowserUrl frame', async ({ page }) => {
    await page.goto('/svelte/frame-preserve-url')
    await expect(page).toHaveURL(/\/svelte\/frame-preserve-url$/)

    await page.getByTestId('updates-normal-link').click()

    await expect(page.getByTestId('updates-step')).toHaveText('1')
    await expect(page).toHaveURL(/\/svelte\/frame-preserve-url\/pane\/updates\?step=1$/)
  })

  test('data-preserve-url keeps the browser URL unchanged', async ({ page }) => {
    await page.goto('/svelte/frame-preserve-url')
    await expect(page).toHaveURL(/\/svelte\/frame-preserve-url$/)

    await page.getByTestId('updates-preserve-link').click()

    // The frame navigated...
    await expect(page.getByTestId('updates-step')).toHaveText('1')
    // ...but the browser URL was left untouched.
    await expect(page).toHaveURL(/\/svelte\/frame-preserve-url$/)
  })

  test('normal link keeps the browser URL in a non-top frame', async ({ page }) => {
    await page.goto('/svelte/frame-preserve-url')
    await expect(page).toHaveURL(/\/svelte\/frame-preserve-url$/)

    await page.getByTestId('preserves-normal-link').click()

    await expect(page.getByTestId('preserves-step')).toHaveText('1')
    await expect(page).toHaveURL(/\/svelte\/frame-preserve-url$/)
  })

  test('data-preserve-url="false" opts back in to updating the browser URL', async ({ page }) => {
    await page.goto('/svelte/frame-preserve-url')
    await expect(page).toHaveURL(/\/svelte\/frame-preserve-url$/)

    await page.getByTestId('preserves-update-link').click()

    await expect(page.getByTestId('preserves-step')).toHaveText('1')
    await expect(page).toHaveURL(/\/svelte\/frame-preserve-url\/pane\/preserves\?step=1$/)
  })
})

test.describe('plain <a> data-frame uses the target frame defaults', () => {
  test('targeting an updateBrowserUrl frame updates the browser URL', async ({ page }) => {
    await page.goto('/svelte/frame-preserve-url')
    await expect(page).toHaveURL(/\/svelte\/frame-preserve-url$/)

    // The link lives in the `preserves` frame (updateBrowserUrl: false) but
    // targets the `updates` frame (updateBrowserUrl: true), so the target
    // frame's defaults must win and the browser URL must change.
    await page.getByTestId('preserves-cross-frame-link').click()

    await expect(page.getByTestId('updates-step')).toHaveText('1')
    await expect(page).toHaveURL(/\/svelte\/frame-preserve-url\/pane\/updates\?step=1$/)
  })

  test('targeting a non-top frame keeps the browser URL', async ({ page }) => {
    await page.goto('/svelte/frame-preserve-url')
    await expect(page).toHaveURL(/\/svelte\/frame-preserve-url$/)

    // The link lives in the `updates` frame (updateBrowserUrl: true) but
    // targets the `preserves` frame (updateBrowserUrl: false), so the browser
    // URL must be left alone.
    await page.getByTestId('updates-cross-frame-link').click()

    await expect(page.getByTestId('preserves-step')).toHaveText('1')
    await expect(page).toHaveURL(/\/svelte\/frame-preserve-url$/)
  })
})
