import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  test.skip(process.env.PACKAGE !== 'svelte', 'Svelte-only test')
})

// A frame stores the asset version it was rendered with in its history entry.
// When the server's version changes (a deploy), a visit from the frame gets a
// 409 and the client reloads the whole document. The frame must then re-fetch
// at the new version instead of restoring the stale history entry, otherwise it
// stays pinned to the old version and every subsequent visit reloads again.
test.describe('nested frame asset version conflicts', () => {
  test('refreshes to the new asset version after a version-conflict reload', async ({ page }) => {
    test.setTimeout(20_000)
    const token = 'conflict'

    await page.goto(`/svelte/frame-version/${token}`)

    const pane = page.getByTestId('frame-version-pane')
    await expect(pane.getByTestId('version-label')).toHaveText('initial:v1')

    // Deploy: the server's asset version changes while the frame's history
    // entry still holds v1.
    await page.request.get(`/svelte/frame-version/${token}/bump`)

    // Clicking a link inside the frame sends X-Inertia-Version: v1, the server
    // answers 409 and the client reloads the document.
    await page.getByTestId('version-next-link').click()

    // After the reload the frame must be running on v2 instead of restoring the
    // stale v1 entry from history.
    await expect(page.getByTestId('frame-version-pane').getByTestId('version-label')).toHaveText('initial:v2')

    // And it must no longer be stuck: the next visit now succeeds.
    await page.getByTestId('version-next-link').click()
    await expect(page.getByTestId('frame-version-pane').getByTestId('version-label')).toHaveText('step:1:v2')
  })

  test('keeps the frame URL (not src) when refreshing a navigated frame after a deploy', async ({ page }) => {
    test.setTimeout(20_000)
    const token = 'navigated'

    await page.goto(`/svelte/frame-version/${token}`)
    await expect(page.getByTestId('frame-version-pane').getByTestId('version-label')).toHaveText('initial:v1')

    // Navigate within the frame while the version still matches, so the frame's
    // history entry points at `?step=1`.
    await page.getByTestId('version-next-link').click()
    await expect(page.getByTestId('frame-version-pane').getByTestId('version-label')).toHaveText('step:1:v1')

    // Deploy, then reload the document as a version conflict would.
    await page.request.get(`/svelte/frame-version/${token}/bump`)
    await page.reload()

    // The frame is refreshed at its own URL (with `?step=1`), not reset to src.
    await expect(page.getByTestId('frame-version-pane').getByTestId('version-label')).toHaveText('step:1:v2')
  })
})
