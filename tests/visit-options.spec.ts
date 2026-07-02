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

test.describe('visitOptions on Frame — updateBrowserUrl: false', () => {
  test('non-top frame navigation does not update browser URL even with replace: false', async ({ page }) => {
    await page.goto('/svelte/visit-options')

    await expect(page.getByTestId('explicit-push-step')).toHaveText('0')
    await expect(page).toHaveURL(/\/svelte\/visit-options$/)

    // Navigate in the explicit-push frame (replace: false, updateBrowserUrl: false)
    await page.getByTestId('explicit-push-next-link').click()
    await expect(page.getByTestId('explicit-push-step')).toHaveText('1')

    // Browser URL must NOT change to the frame's internal URL
    await expect(page).toHaveURL(/\/svelte\/visit-options$/)

    // Per-frame history was still pushed — goBack reverts the frame
    await page.goBack()
    await expect(page.getByTestId('explicit-push-step')).toHaveText('0')
  })

  test('non-top frame form submit does not update browser URL even with replace: false', async ({ page }) => {
    await page.goto('/svelte/visit-options')

    await expect(page.getByTestId('explicit-push-step')).toHaveText('0')
    await expect(page).toHaveURL(/\/svelte\/visit-options$/)

    // Submit form in the explicit-push frame (replace: false, updateBrowserUrl: false)
    await page.getByTestId('explicit-push-submit').click()
    await expect(page.getByTestId('explicit-push-step')).toHaveText('1')

    // Browser URL must NOT change
    await expect(page).toHaveURL(/\/svelte\/visit-options$/)

    // Per-frame history was still pushed — goBack reverts the frame
    await page.goBack()
    await expect(page.getByTestId('explicit-push-step')).toHaveText('0')
  })
})

test.describe('visitOptions on Frame — updateBrowserUrl: true', () => {
  test('non-top frame navigation updates browser URL when updateBrowserUrl: true', async ({ page }) => {
    await page.goto('/svelte/visit-options')

    await expect(page.getByTestId('browser-url-step')).toHaveText('0')
    await expect(page).toHaveURL(/\/svelte\/visit-options$/)

    // Navigate in the browser-url frame (replace: true, updateBrowserUrl: true)
    await page.getByTestId('browser-url-next-link').click()
    await expect(page.getByTestId('browser-url-step')).toHaveText('1')

    // Browser URL must change to the frame's URL
    await expect(page).toHaveURL(/\/svelte\/visit-options\/browser-url\?step=1$/)

    // replace: true means no history entry — goBack skips this navigation.
    // But we also need to verify the explicit-push frame (updateBrowserUrl: false)
    // doesn't interfere. Let's push explicit-push and pop it.
    // URL should remain at the browser-url frame's URL throughout.
    await page.getByTestId('explicit-push-next-link').click()
    await expect(page.getByTestId('explicit-push-step')).toHaveText('1')
    // URL unchanged — explicit-push has updateBrowserUrl: false
    await expect(page).toHaveURL(/\/svelte\/visit-options\/browser-url\?step=1$/)

    await page.goBack()
    // explicit-push reverts, browser-url stays because it was replaced
    await expect(page.getByTestId('explicit-push-step')).toHaveText('0')
    await expect(page.getByTestId('browser-url-step')).toHaveText('1')
    // URL unchanged — explicit-push never managed the browser URL
    await expect(page).toHaveURL(/\/svelte\/visit-options\/browser-url\?step=1$/)
  })

  test('non-top frame form submit updates browser URL when updateBrowserUrl: true', async ({ page }) => {
    await page.goto('/svelte/visit-options')

    await expect(page.getByTestId('browser-url-step')).toHaveText('0')
    await expect(page).toHaveURL(/\/svelte\/visit-options$/)

    // Submit form in the browser-url frame (replace: true, updateBrowserUrl: true)
    await page.getByTestId('browser-url-submit').click()
    await expect(page.getByTestId('browser-url-step')).toHaveText('1')

    // Browser URL must change to the frame's form target URL
    await expect(page).toHaveURL(/\/svelte\/visit-options\/browser-url\/submit$/)

    // Push explicit-push and pop it — browser URL stays at browser-url frame's URL
    await page.getByTestId('explicit-push-next-link').click()
    await expect(page.getByTestId('explicit-push-step')).toHaveText('1')
    await expect(page).toHaveURL(/\/svelte\/visit-options\/browser-url\/submit$/)

    await page.goBack()
    await expect(page.getByTestId('explicit-push-step')).toHaveText('0')
    await expect(page.getByTestId('browser-url-step')).toHaveText('1')
    await expect(page).toHaveURL(/\/svelte\/visit-options\/browser-url\/submit$/)
  })
})
