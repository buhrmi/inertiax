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
    // Intercept the request and capture the header
    let capturedFrameHeader: string | null = null

    page.on('request', (request) => {
      if (request.url().includes('/svelte/inertia-frame-header/left/submit-echo')) {
        capturedFrameHeader = request.headers()['x-inertia-frame'] ?? null
      }
    })

    await page.goto('/svelte/inertia-frame-header')

    await page.waitForSelector('[data-testid="left-pane"]')

    await page.getByTestId('left-submit-echo').click()
    await page.waitForResponse((r) => r.url().includes('/svelte/inertia-frame-header/left/submit-echo'))

    expect(capturedFrameHeader).toBe('left')
  })

  test('sends the originating frame ID even when a different frameId is set in visitOptions', async ({ page }) => {
    let capturedFrameHeader: string | null = null

    page.on('request', (request) => {
      if (request.url().includes('/svelte/inertia-frame-header/left/submit')) {
        capturedFrameHeader = request.headers()['x-inertia-frame'] ?? null
      }
    })

    await page.goto('/svelte/inertia-frame-header')
    await page.waitForSelector('[data-testid="left-pane"]')

    // The left frame submits with frameId: 'right' in visitOptions,
    // but the X-Inertia-Frame header should still be 'left' (the originating frame)
    await page.getByTestId('left-submit-cross').click()
    await page.waitForResponse((r) => r.url().includes('/svelte/inertia-frame-header/left/submit'))

    expect(capturedFrameHeader).toBe('left')
  })
})

test.describe('X-Inertia-Frame response header', () => {
  test('applies the response to the frame named in the X-Inertia-Frame response header', async ({ page }) => {
    await page.goto('/svelte/inertia-frame-header')

    await page.waitForSelector('[data-testid="left-pane"]')
    await page.waitForSelector('[data-testid="right-pane"]')

    // Both frames start at "initial"
    await expect(page.getByTestId('left-message')).toHaveText('initial')
    await expect(page.getByTestId('right-message')).toHaveText('initial')

    await page.getByTestId('left-submit-echo').click()
    await page.waitForResponse((r) => r.url().includes('/svelte/inertia-frame-header/left/submit-echo'))

    // Left frame should be updated, right frame should remain unchanged
    await expect(page.getByTestId('left-message')).toHaveText('echo-updated')
    await expect(page.getByTestId('right-message')).toHaveText('initial')
  })

  test('overrides the visitOptions frameId when X-Inertia-Frame response header is present', async ({ page }) => {
    await page.goto('/svelte/inertia-frame-header')

    await page.waitForSelector('[data-testid="left-pane"]')
    await page.waitForSelector('[data-testid="right-pane"]')

    await expect(page.getByTestId('left-message')).toHaveText('initial')
    await expect(page.getByTestId('right-message')).toHaveText('initial')

    // The left frame sends this request with frameId: 'right' in visitOptions,
    // meaning it intends to update the right frame on success.
    // However, the server reads X-Inertia-Frame ('left') from the request header
    // and echoes it back as the response X-Inertia-Frame header, causing the
    // client to update the LEFT frame instead.
    await page.getByTestId('left-submit-cross').click()
    await page.waitForResponse((r) => r.url().includes('/svelte/inertia-frame-header/left/submit'))

    // Left frame should be updated (server overrode the target), right should be unchanged
    await expect(page.getByTestId('left-message')).toHaveText('updated')
    await expect(page.getByTestId('right-message')).toHaveText('initial')
  })

  test('right frame echoes correctly when submitted', async ({ page }) => {
    await page.goto('/svelte/inertia-frame-header')

    await page.waitForSelector('[data-testid="left-pane"]')
    await page.waitForSelector('[data-testid="right-pane"]')

    await expect(page.getByTestId('left-message')).toHaveText('initial')
    await expect(page.getByTestId('right-message')).toHaveText('initial')

    await page.getByTestId('right-submit-echo').click()
    await page.waitForResponse((r) => r.url().includes('/svelte/inertia-frame-header/right/submit-echo'))

    await expect(page.getByTestId('left-message')).toHaveText('initial')
    await expect(page.getByTestId('right-message')).toHaveText('echo-updated')
  })
})
