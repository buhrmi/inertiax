import { expect, test } from '@playwright/test'
import { consoleMessages } from './support'

test.beforeEach(async ({ page }) => {
  test.skip(process.env.PACKAGE !== 'svelte', 'Svelte-only test')
})

test('props and page store are in sync', async ({ page }) => {
  consoleMessages.listen(page)

  await page.goto('/svelte/props-and-page-store')

  await expect(page.getByText('foo prop is default', { exact: true })).toBeVisible()
  await expect(page.getByText('page.props.foo is default', { exact: true })).toBeVisible()
  await expect(page.getByText('pageProps.foo is default')).toBeVisible()
  await expect(page.getByText('sveltePage.props.foo is default')).toBeVisible()
  await expect(consoleMessages.messages).toHaveLength(11)
  await expect(consoleMessages.messages[0]).toBe('[script] foo prop is default')
  await expect(consoleMessages.messages[1]).toBe('[script] page.props.foo is default')
  await expect(consoleMessages.messages[2]).toBe('[script] sveltePage.props.foo is default')
  await expect(consoleMessages.messages[3]).toBe('[reactive expression] foo prop is default')
  await expect(consoleMessages.messages[4]).toBe('[reactive expression] page.props.foo is default')
  await expect(consoleMessages.messages[5]).toBe('[reactive expression] sveltePage.props.foo is default')
  await expect(consoleMessages.messages[6]).toBe('[onMount] foo prop is default')
  await expect(consoleMessages.messages[7]).toBe('[onMount] page.props.foo is default')
  await expect(consoleMessages.messages[8]).toBe('[onMount] sveltePage.props.foo is default')
  await expect(consoleMessages.messages[9]).toBe('[reactive expression] foo prop is default')
  await expect(consoleMessages.messages[10]).toBe('[reactive expression] page.props.foo is default')
  await expect(await page.locator('#input').inputValue()).toEqual('default')

  consoleMessages.messages = []
  await page.getByRole('link', { name: 'Bar' }).click()

  await expect(page.getByText('foo prop is bar', { exact: true })).toBeVisible()
  await expect(page.getByText('page.props.foo is bar', { exact: true })).toBeVisible()
  await expect(page.getByText('pageProps.foo is bar')).toBeVisible()
  await expect(page.getByText('sveltePage.props.foo is bar')).toBeVisible()
  await expect(consoleMessages.messages).toHaveLength(9)
  await expect(consoleMessages.messages[0]).toBe('[script] foo prop is bar')
  await expect(consoleMessages.messages[1]).toBe('[script] page.props.foo is bar')
  await expect(consoleMessages.messages[2]).toBe('[script] sveltePage.props.foo is bar')
  await expect(consoleMessages.messages[3]).toBe('[reactive expression] foo prop is bar')
  await expect(consoleMessages.messages[4]).toBe('[reactive expression] page.props.foo is bar')
  await expect(consoleMessages.messages[5]).toBe('[reactive expression] sveltePage.props.foo is bar')
  await expect(consoleMessages.messages[6]).toBe('[onMount] foo prop is bar')
  await expect(consoleMessages.messages[7]).toBe('[onMount] page.props.foo is bar')
  await expect(consoleMessages.messages[8]).toBe('[onMount] sveltePage.props.foo is bar')
  await expect(await page.locator('#input').inputValue()).toEqual('bar')

  consoleMessages.messages = []
  await page.getByRole('link', { name: 'Baz' }).click()

  await expect(page.getByText('foo prop is baz', { exact: true })).toBeVisible()
  await expect(page.getByText('page.props.foo is baz', { exact: true })).toBeVisible()
  await expect(page.getByText('pageProps.foo is baz')).toBeVisible()
  await expect(page.getByText('sveltePage.props.foo is baz')).toBeVisible()
  await expect(consoleMessages.messages).toHaveLength(9)
  await expect(consoleMessages.messages[0]).toBe('[script] foo prop is baz')
  await expect(consoleMessages.messages[1]).toBe('[script] page.props.foo is baz')
  await expect(consoleMessages.messages[2]).toBe('[script] sveltePage.props.foo is baz')
  await expect(consoleMessages.messages[3]).toBe('[reactive expression] foo prop is baz')
  await expect(consoleMessages.messages[4]).toBe('[reactive expression] page.props.foo is baz')
  await expect(consoleMessages.messages[5]).toBe('[reactive expression] sveltePage.props.foo is baz')
  await expect(consoleMessages.messages[6]).toBe('[onMount] foo prop is baz')
  await expect(consoleMessages.messages[7]).toBe('[onMount] page.props.foo is baz')
  await expect(consoleMessages.messages[8]).toBe('[onMount] sveltePage.props.foo is baz')
  await expect(await page.locator('#input').inputValue()).toEqual('baz')

  consoleMessages.messages = []

  await page.getByRole('link', { name: 'Home' }).click()
  await page.waitForURL('/')

  await page.goBack()
  await page.waitForURL('/svelte/props-and-page-store?foo=baz')

  await expect(page.getByText('foo prop is baz', { exact: true })).toBeVisible()
  await expect(page.getByText('page.props.foo is baz', { exact: true })).toBeVisible()
  await expect(page.getByText('pageProps.foo is baz')).toBeVisible()
  await expect(page.getByText('sveltePage.props.foo is baz')).toBeVisible()
  await expect(consoleMessages.messages).toHaveLength(9)
  await expect(consoleMessages.messages[0]).toBe('[script] foo prop is baz')
  await expect(consoleMessages.messages[1]).toBe('[script] page.props.foo is baz')
  await expect(consoleMessages.messages[2]).toBe('[script] sveltePage.props.foo is baz')
  await expect(consoleMessages.messages[3]).toBe('[reactive expression] foo prop is baz')
  await expect(consoleMessages.messages[4]).toBe('[reactive expression] page.props.foo is baz')
  await expect(consoleMessages.messages[5]).toBe('[reactive expression] sveltePage.props.foo is baz')
  await expect(consoleMessages.messages[6]).toBe('[onMount] foo prop is baz')
  await expect(consoleMessages.messages[7]).toBe('[onMount] page.props.foo is baz')
  await expect(consoleMessages.messages[8]).toBe('[onMount] sveltePage.props.foo is baz')
})

test('multi-frame links update only their own frame and history back/forward replays per-frame', async ({ page }) => {
  await page.goto('/svelte/multi-frame')

  await expect(page.getByTestId('left-step')).toHaveText('0')
  await expect(page.getByTestId('right-step')).toHaveText('0')

  await page.getByTestId('left-next-link').click()

  await expect(page.getByTestId('left-step')).toHaveText('1')
  await expect(page.getByTestId('right-step')).toHaveText('0')
  await expect(page).toHaveURL(/\/svelte\/multi-frame$/)

  await page.getByTestId('right-next-link').click()

  await expect(page.getByTestId('left-step')).toHaveText('1')
  await expect(page.getByTestId('right-step')).toHaveText('1')
  await expect(page).toHaveURL(/\/svelte\/multi-frame$/)

  await page.goBack()

  await expect(page.getByTestId('left-step')).toHaveText('1')
  await expect(page.getByTestId('right-step')).toHaveText('0')

  await page.goBack()

  await expect(page.getByTestId('left-step')).toHaveText('0')
  await expect(page.getByTestId('right-step')).toHaveText('0')
})

test('multi-frame form submit updates only submit frame', async ({ page }) => {
  await page.goto('/svelte/multi-frame')

  await expect(page.getByTestId('left-step')).toHaveText('0')
  await expect(page.getByTestId('right-step')).toHaveText('0')

  await page.getByTestId('left-submit').click()

  await expect(page.getByTestId('left-step')).toHaveText('1')
  await expect(page.getByTestId('right-step')).toHaveText('0')
  await expect(page).toHaveURL(/\/svelte\/multi-frame$/)

  await page.getByTestId('right-submit').click()

  await expect(page.getByTestId('left-step')).toHaveText('1')
  await expect(page.getByTestId('right-step')).toHaveText('1')
  await expect(page).toHaveURL(/\/svelte\/multi-frame$/)
})

test("multi-frame unchanged frame doesn't rerun effects on browser navigation", async ({ page }) => {
  const messages: string[] = []

  page.on('console', (msg) => {
    if (msg.type() !== 'log') {
      return
    }

    const text = msg.text()

    if (text.startsWith('Frame left step ') || text.startsWith('Frame right step ')) {
      messages.push(text)
    }
  })

  await page.goto('/svelte/multi-frame')

  await expect(page.getByTestId('left-step')).toHaveText('0')
  await expect(page.getByTestId('right-step')).toHaveText('0')

  messages.length = 0
  await page.getByTestId('left-next-link').click()
  await expect(page.getByTestId('left-step')).toHaveText('1')
  await expect(page.getByTestId('right-step')).toHaveText('0')
  await expect(messages).toEqual(['Frame left step 1'])

  messages.length = 0
  await page.getByTestId('right-next-link').click()
  await expect(page.getByTestId('left-step')).toHaveText('1')
  await expect(page.getByTestId('right-step')).toHaveText('1')
  await expect(messages).toEqual(['Frame right step 1'])

  messages.length = 0
  await page.goBack()
  await expect(page.getByTestId('left-step')).toHaveText('1')
  await expect(page.getByTestId('right-step')).toHaveText('0')
  await expect(messages).toEqual(['Frame right step 0'])

  messages.length = 0
  await page.goBack()
  await expect(page.getByTestId('left-step')).toHaveText('0')
  await expect(page.getByTestId('right-step')).toHaveText('0')
  await expect(messages).toEqual(['Frame left step 0'])
})

test('frame layout renders on top frame but not on nested frame by default', async ({ page }) => {
  await page.goto('/svelte/frame-layout')

  await expect(page.getByTestId('top-frame-layout')).toBeVisible()
  await expect(page.getByTestId('top-frame-page')).toBeVisible()
  await expect(page.getByTestId('nested-frame-pane')).toBeVisible()
  await expect(page.getByTestId('nested-frame-forwarded-message')).toHaveText('Forwarded from Frame')
  await expect(page.getByTestId('nested-frame-layout')).toHaveCount(0)
})
