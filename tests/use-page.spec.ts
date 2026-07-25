import { expect, test } from '@playwright/test'

test.describe('usePage', () => {
  test.skip(process.env.PACKAGE !== 'svelte')

  test('returns the same instance on multiple calls', async ({ page }) => {
    await page.goto('/use-page/page1')

    await expect(page.getByTestId('same-ref')).toContainText('yes')
  })

  test('exposes reactive page props', async ({ page }) => {
    await page.goto('/use-page/page1')

    await expect(page.getByTestId('name-props')).toContainText('Alice')
    await expect(page.getByTestId('name-usepage')).toContainText('Alice')
    await expect(page.getByTestId('url')).toContainText('/use-page/page1')
  })

  test('exposes reactive page data in child components', async ({ page }) => {
    await page.goto('/use-page/page1')

    await expect(page.getByTestId('child-url')).toContainText('/use-page/page1')
    await expect(page.getByTestId('child-component')).toContainText('UsePage/Page1')
  })

  test('returns the same instance in parent and child components', async ({ page }) => {
    await page.goto('/use-page/page1')

    await expect(page.getByTestId('child-same-ref')).toContainText('yes')
  })

  test('updates reactively after SPA navigation (createInertiaApp was called with initial page)', async ({ page }) => {
    await page.goto('/use-page/page1')

    await expect(page.getByTestId('name-usepage')).toContainText('Alice')

    await page.getByTestId('go-page2').click()
    await expect(page.getByTestId('title-props')).toContainText('Dashboard')
    await expect(page.getByTestId('title-usepage')).toContainText('Dashboard')
    await expect(page.getByTestId('url')).toContainText('/use-page/page2')
    await expect(page.getByTestId('child-url')).toContainText('/use-page/page2')
    await expect(page.getByTestId('child-component')).toContainText('UsePage/Page2')
    await expect(page.getByTestId('same-ref')).toContainText('yes')
  })

  test('page.url is reactive in layout after top-frame navigation', async ({ page }) => {
    await page.goto('/use-page/frame-page')

    // Initial state
    await expect(page.getByTestId('layout-url')).toContainText('/use-page/frame-page')
    await expect(page.getByTestId('layout-component')).toContainText('UsePage/FramePage')

    // Navigate top frame — layout url should update reactively
    await page.getByTestId('top-nav').click()
    await expect(page.getByTestId('top-url')).toContainText('/use-page/frame-page?nav=1')
    await expect(page.getByTestId('layout-url')).toContainText('/use-page/frame-page?nav=1')
  })

  test('page.url is reactive within a child Frame', async ({ page }) => {
    await page.goto('/use-page/frame-page')

    // Child Frame shows correct initial url
    await expect(page.getByTestId('frame-url')).toContainText('/use-page/frame-pane')
    await expect(page.getByTestId('frame-component')).toContainText('UsePage/FramePane')

    // Navigate within the child Frame — url should update
    await page.getByTestId('frame-nav').click()
    await expect(page.getByTestId('frame-url')).toContainText('/use-page/frame-pane?step=1')
  })

  test('import { page } has populated props at module level before mount', async ({ page }) => {
    await page.goto('/svelte/page-store-import')

    // At module level (script tag), page.props should already be populated
    await expect(page.getByTestId('page-store-module-has-props')).toContainText('yes')
    await expect(page.getByTestId('page-store-module-component')).toContainText('Svelte/PageStoreImport')

    // In onMount, it should also still be populated
    await expect(page.getByTestId('page-store-mount-has-props')).toContainText('yes')
    await expect(page.getByTestId('page-store-mount-component')).toContainText('Svelte/PageStoreImport')
  })
})
