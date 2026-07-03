import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  test.skip(process.env.PACKAGE !== 'svelte', 'Svelte-only test')
})

test('useRemember state survives back navigation', async ({ page }) => {
  await page.goto('/svelte/frame-remember')

  await expect(page.getByTestId('frame-remember-pane')).toBeVisible({ timeout: 10000 })
  await expect(page.getByTestId('remember-count')).toHaveText('0')

  // Increment counter — triggers useRemember to persist state
  await page.getByTestId('remember-increment').click()
  await page.getByTestId('remember-increment').click()
  await expect(page.getByTestId('remember-count')).toHaveText('2')

  // Navigate away, then go back — frame should restore remembered state
  await page.getByTestId('navigate-away').click()
  await page.waitForURL('/dump/get')

  await page.goBack()
  await expect(page.getByTestId('frame-remember-pane')).toBeVisible({ timeout: 10000 })
  await expect(page.getByTestId('remember-count')).toHaveText('2')
})

test('useRemember state survives back then forward navigation', async ({ page }) => {
  // Start on a different page so back history is populated
  await page.goto('/dump/get')
  await page.goto('/svelte/frame-remember')

  await expect(page.getByTestId('frame-remember-pane')).toBeVisible({ timeout: 10000 })

  await page.getByTestId('remember-increment').click()
  await page.getByTestId('remember-increment').click()
  await expect(page.getByTestId('remember-count')).toHaveText('2')

  // Go back (frame unmounts), then forward (frame remounts)
  await page.goBack()
  await page.waitForURL('/dump/get')

  await page.goForward()
  await expect(page.getByTestId('frame-remember-pane')).toBeVisible({ timeout: 10000 })
  await expect(page.getByTestId('remember-count')).toHaveText('2')
})

test('useRemember state survives back navigation with forceRequest', async ({ page }) => {
  await page.goto('/svelte/frame-remember-skip')

  await expect(page.getByTestId('frame-remember-pane')).toBeVisible({ timeout: 10000 })
  await expect(page.getByTestId('remember-count')).toHaveText('0')

  await page.getByTestId('remember-increment').click()
  await page.getByTestId('remember-increment').click()
  await expect(page.getByTestId('remember-count')).toHaveText('2')

  // Navigate away, then go back — frame does fresh HTTP fetch due to
  // forceRequest, but rememberedState should still survive.
  await page.getByTestId('navigate-away').click()
  await page.waitForURL('/dump/get')

  await page.goBack()
  await expect(page.getByTestId('frame-remember-pane')).toBeVisible({ timeout: 10000 })
  await expect(page.getByTestId('remember-count')).toHaveText('2')
})

test('useRemember state survives back/forward with forceRequest', async ({ page }) => {
  await page.goto('/dump/get')
  await page.goto('/svelte/frame-remember-skip')

  await expect(page.getByTestId('frame-remember-pane')).toBeVisible({ timeout: 10000 })

  await page.getByTestId('remember-increment').click()
  await page.getByTestId('remember-increment').click()
  await expect(page.getByTestId('remember-count')).toHaveText('2')

  await page.goBack()
  await page.waitForURL('/dump/get')

  await page.goForward()
  await expect(page.getByTestId('frame-remember-pane')).toBeVisible({ timeout: 10000 })
  await expect(page.getByTestId('remember-count')).toHaveText('2')
})
