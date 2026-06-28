import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  test.skip(process.env.PACKAGE !== 'svelte', 'Svelte-only test')
})

test.describe('visitOptions on Frame — default { replace: true } for non-top frames', () => {
  test('link click in defaults frame is skipped by goBack (replace, not push)', async ({ page }) => {
    await page.goto('/svelte/visit-options')

    await expect(page.getByTestId('defaults-step')).toHaveText('0')
    await expect(page.getByTestId('explicit-push-step')).toHaveText('0')

    // Navigate in the defaults frame (replace: true) — step 0→1
    await page.getByTestId('defaults-next-link').click()
    await expect(page.getByTestId('defaults-step')).toHaveText('1')

    // Navigate in the explicit-push frame (replace: false) — step 0→1 (this pushes)
    await page.getByTestId('explicit-push-next-link').click()
    await expect(page.getByTestId('explicit-push-step')).toHaveText('1')

    // goBack should undo only the explicit-push navigation.
    // The defaults frame navigation was replaced, so there's nothing to pop for it.
    await page.goBack()
    await expect(page.getByTestId('explicit-push-step')).toHaveText('0')
    // Defaults frame should still show the replaced state
    await expect(page.getByTestId('defaults-step')).toHaveText('1')
  })

  test('form submit in defaults frame is skipped by goBack (replace, not push)', async ({ page }) => {
    await page.goto('/svelte/visit-options')

    await expect(page.getByTestId('defaults-step')).toHaveText('0')
    await expect(page.getByTestId('explicit-push-step')).toHaveText('0')

    // Submit form in defaults frame (replace: true)
    await page.getByTestId('defaults-submit').click()
    await expect(page.getByTestId('defaults-step')).toHaveText('1')

    // Navigate in explicit-push frame (pushes)
    await page.getByTestId('explicit-push-next-link').click()
    await expect(page.getByTestId('explicit-push-step')).toHaveText('1')

    // goBack should only pop the explicit-push navigation
    await page.goBack()
    await expect(page.getByTestId('explicit-push-step')).toHaveText('0')
    await expect(page.getByTestId('defaults-step')).toHaveText('1')
  })
})

test.describe('visitOptions on Frame — explicit { replace: false } via prop', () => {
  test('link click in explicit-push frame pushes history (goBack returns to step 0)', async ({ page }) => {
    await page.goto('/svelte/visit-options')

    await expect(page.getByTestId('explicit-push-step')).toHaveText('0')

    // Click link in the explicit-push frame (replace: false → pushes)
    await page.getByTestId('explicit-push-next-link').click()
    await expect(page.getByTestId('explicit-push-step')).toHaveText('1')

    // goBack should restore the pushed state
    await page.goBack()
    await expect(page.getByTestId('explicit-push-step')).toHaveText('0')
  })

  test('form submit in explicit-push frame pushes history (goBack returns to step 0)', async ({ page }) => {
    await page.goto('/svelte/visit-options')

    await expect(page.getByTestId('explicit-push-step')).toHaveText('0')

    await page.getByTestId('explicit-push-submit').click()
    await expect(page.getByTestId('explicit-push-step')).toHaveText('1')

    await page.goBack()
    await expect(page.getByTestId('explicit-push-step')).toHaveText('0')
  })
})

test.describe('visitOptions on Frame — multiple navigations in explicit-push frame', () => {
  test('multiple pushes then multiple goBacks replay per-frame history', async ({ page }) => {
    await page.goto('/svelte/visit-options')

    await expect(page.getByTestId('explicit-push-step')).toHaveText('0')

    // Push: 0 → 1 → 2 → 3
    await page.getByTestId('explicit-push-next-link').click()
    await expect(page.getByTestId('explicit-push-step')).toHaveText('1')
    await page.getByTestId('explicit-push-next-link').click()
    await expect(page.getByTestId('explicit-push-step')).toHaveText('2')
    await page.getByTestId('explicit-push-next-link').click()
    await expect(page.getByTestId('explicit-push-step')).toHaveText('3')

    // goBack: 3 → 2 → 1 → 0
    await page.goBack()
    await expect(page.getByTestId('explicit-push-step')).toHaveText('2')
    await page.goBack()
    await expect(page.getByTestId('explicit-push-step')).toHaveText('1')
    await page.goBack()
    await expect(page.getByTestId('explicit-push-step')).toHaveText('0')
  })
})

test.describe('visitOptions on Frame — defaults frame replace means no history to replay', () => {
  test('multiple defaults navigations are all skipped by goBack after a push', async ({ page }) => {
    await page.goto('/svelte/visit-options')

    await expect(page.getByTestId('defaults-step')).toHaveText('0')
    await expect(page.getByTestId('explicit-push-step')).toHaveText('0')

    // Multiple navigations in defaults frame (all replaces)
    await page.getByTestId('defaults-next-link').click()
    await expect(page.getByTestId('defaults-step')).toHaveText('1')
    await page.getByTestId('defaults-next-link').click()
    await expect(page.getByTestId('defaults-step')).toHaveText('2')
    await page.getByTestId('defaults-next-link').click()
    await expect(page.getByTestId('defaults-step')).toHaveText('3')

    // One push in explicit-push
    await page.getByTestId('explicit-push-next-link').click()
    await expect(page.getByTestId('explicit-push-step')).toHaveText('1')

    // goBack should undo only the explicit-push navigation.
    // All 3 defaults navigations were replaces — no history entries to pop.
    await page.goBack()
    await expect(page.getByTestId('explicit-push-step')).toHaveText('0')
    await expect(page.getByTestId('defaults-step')).toHaveText('3')
  })
})
