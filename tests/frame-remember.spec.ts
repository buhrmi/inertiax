import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  test.skip(process.env.PACKAGE !== 'svelte', 'Svelte-only test')
})

test('useRemember state survives frame unmount and remount', async ({ page }) => {
  await page.goto('/svelte/frame-remember')

  // Mount the frame
  await page.getByTestId('toggle-frame').click()
  await expect(page.getByTestId('frame-remember-pane')).toBeVisible({ timeout: 10000 })
  await expect(page.getByTestId('remember-count')).toHaveText('0')

  // Increment counter twice — this triggers useRemember to persist state
  await page.getByTestId('remember-increment').click()
  await page.getByTestId('remember-increment').click()
  await expect(page.getByTestId('remember-count')).toHaveText('2')

  // Unmount the frame
  await page.getByTestId('toggle-frame').click()
  await expect(page.getByTestId('frame-remember-pane')).not.toBeAttached()

  // Remount the frame — fresh HTTP fetch, should restore remembered state
  await page.getByTestId('toggle-frame').click()
  await expect(page.getByTestId('frame-remember-pane')).toBeVisible({ timeout: 10000 })
  await expect(page.getByTestId('frame-remember-pane')).toBeVisible()

  // Counter should still be 2, not reset to 0
  await expect(page.getByTestId('remember-count')).toHaveText('2')
})
