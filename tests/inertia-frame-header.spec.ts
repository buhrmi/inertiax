import { expect, test } from '@playwright/test'

/**
 * Tests for the X-Inertia-Frame request/response header feature.
 *
 * Every Inertia X request includes an `X-Inertia-Frame` request header containing
 * the ID of the frame that initiated the visit (the "originating frame").
 *
 * If the server responds with an `X-Inertia-Frame` response header the client
 * will apply the response to the named frame, overriding any `frameId` that was
 * set in the visit options.
 *
 * This lets the server decide where a response lands — for example, redirecting
 * a validation-error response back to the originating frame even if the initial
 * visit specified a different target frame.
 */

test.beforeEach(async ({ page }) => {
  test.skip(process.env.PACKAGE !== 'svelte', 'Svelte-only test')
})

test.describe('X-Inertia-Frame request header', () => {
  test('sends the originating frame ID in the X-Inertia-Frame request header', async ({ page }) => {
    await page.goto('/svelte/inertia-frame-header')
    await page.waitForSelector('[data-testid="left-pane"]')

    const responsePromise = page.waitForResponse((r) => r.url().includes('/svelte/inertia-frame-header/left/submit-echo'))
    const [response] = await Promise.all([
      responsePromise,
      page.getByTestId('left-submit-echo').click(),
    ])

    expect(response.request().headers()['x-inertia-frame']).toBe('left')
  })

  test('sends the originating frame ID even when a different frameId is set in visitOptions', async ({ page }) => {
    await page.goto('/svelte/inertia-frame-header')
    await page.waitForSelector('[data-testid="left-pane"]')

    const responsePromise = page.waitForResponse((r) => r.url().includes('/svelte/inertia-frame-header/left/submit'))
    const [response] = await Promise.all([
      responsePromise,
      page.getByTestId('left-submit-cross').click(),
    ])

    expect(response.request().headers()['x-inertia-frame']).toBe('left')
  })
})

test.describe('X-Inertia-Frame response header', () => {
  test('applies the response to the frame named in the X-Inertia-Frame response header', async ({ page }) => {
    await page.goto('/svelte/inertia-frame-header')
    await page.waitForSelector('[data-testid="left-pane"]')
    await page.waitForSelector('[data-testid="right-pane"]')

    await expect(page.getByTestId('left-message')).toHaveText('initial')
    await expect(page.getByTestId('right-message')).toHaveText('initial')

    const responsePromise = page.waitForResponse((r) => r.url().includes('/svelte/inertia-frame-header/left/submit-echo'))
    await Promise.all([
      responsePromise,
      page.getByTestId('left-submit-echo').click(),
    ])

    await expect(page.getByTestId('left-message')).toHaveText('echo-updated')
    await expect(page.getByTestId('right-message')).toHaveText('initial')
  })

  test('overrides the visitOptions frameId when X-Inertia-Frame response header is present', async ({ page }) => {
    await page.goto('/svelte/inertia-frame-header')
    await page.waitForSelector('[data-testid="left-pane"]')
    await page.waitForSelector('[data-testid="right-pane"]')

    await expect(page.getByTestId('left-message')).toHaveText('initial')
    await expect(page.getByTestId('right-message')).toHaveText('initial')

    const responsePromise = page.waitForResponse((r) => r.url().includes('/svelte/inertia-frame-header/left/submit'))
    await Promise.all([
      responsePromise,
      page.getByTestId('left-submit-cross').click(),
    ])

    await expect(page.getByTestId('left-message')).toHaveText('updated')
    await expect(page.getByTestId('right-message')).toHaveText('initial')
  })

  test('right frame echoes correctly when submitted', async ({ page }) => {
    await page.goto('/svelte/inertia-frame-header')
    await page.waitForSelector('[data-testid="left-pane"]')
    await page.waitForSelector('[data-testid="right-pane"]')

    await expect(page.getByTestId('left-message')).toHaveText('initial')
    await expect(page.getByTestId('right-message')).toHaveText('initial')

    const responsePromise = page.waitForResponse((r) => r.url().includes('/svelte/inertia-frame-header/right/submit-echo'))
    await Promise.all([
      responsePromise,
      page.getByTestId('right-submit-echo').click(),
    ])

    await expect(page.getByTestId('left-message')).toHaveText('initial')
    await expect(page.getByTestId('right-message')).toHaveText('echo-updated')
  })
})
