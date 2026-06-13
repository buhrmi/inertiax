<script module lang="ts">
  import { type Page, type PageProps, type Router } from 'inertiax-core'
  import type { ComponentResolver, ResolvedComponent } from '../types'

  export interface InertiaFrameProps<SharedProps extends PageProps = PageProps> {
    id?: string
    src?: string
    router?: Router
    initialComponent?: ResolvedComponent
    initialPage?: Page<SharedProps>
    resolveComponent: ComponentResolver
    defaultLayout?: (name: string, page: Page) => unknown
    renderLayout?: boolean
    /** Called when a plain <a> inside the frame is clicked. Call event.preventDefault() to prevent the default Inertia navigation. */
    onClickLink?: (event: MouseEvent, href: string) => void
    children?: import('svelte').Snippet
  }

  export type { InertiaFrameProps as InertiaAppProps }
</script>

<script lang="ts">
  import { createRouter, isPropsObject, isPropsObjectOrCallback, normalizeLayouts, shouldIntercept } from 'inertiax-core'
  import { onDestroy, onMount } from 'svelte'
  import { toStore } from 'svelte/store'
  import type { Component } from 'svelte'
  import { DEFAULT_FRAME_ID, setFrameContext, useFrameContext, useGlobalResolveComponent } from '../frameContext.svelte'
  import { resetLayoutProps, storeState } from '../layoutProps.svelte'
  import { setPage } from '../page.svelte'
  import type { LayoutResolver, LayoutType } from '../types'
  import Render, { h, type RenderProps } from './Render.svelte'

  interface Props {
    id?: string
    src?: string
    router?: InertiaFrameProps['router']
    initialComponent?: InertiaFrameProps['initialComponent']
    initialPage?: InertiaFrameProps['initialPage']
    resolveComponent?: InertiaFrameProps['resolveComponent']
    defaultLayout?: InertiaFrameProps['defaultLayout']
    renderLayout?: InertiaFrameProps['renderLayout']
    onClickLink?: InertiaFrameProps['onClickLink']
    children?: InertiaFrameProps['children']
  }

  const {
    id = undefined,
    src = undefined,
    router = undefined,
    initialComponent = undefined,
    initialPage = undefined,
    resolveComponent = undefined,
    defaultLayout,
    renderLayout = undefined,
    onClickLink,
    children,
    ...restProps
  }: Props & Record<string, unknown> = $props()

  const parentFrameContext = useFrameContext()
  // svelte-ignore state_referenced_locally
  const frameResolveComponent = resolveComponent ?? parentFrameContext?.resolveComponent ?? useGlobalResolveComponent()

  function createFrameId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID()
    }

    return `frame-${Math.random().toString(36).slice(2, 10)}`
  }

  // App passes DEFAULT_FRAME_ID explicitly for the top frame. All other
  // implicit frames get an isolated generated id.
  const frameId = id ?? createFrameId()
  const shouldRenderLayout = renderLayout ?? frameId === DEFAULT_FRAME_ID

  function resolveFrameComponent(name: string, page?: Page) {
    if (!frameResolveComponent) {
      throw new Error(`No resolveComponent available for frame "${frameId}"`)
    }

    return frameResolveComponent(name, page)
  }

  const frameRouter = router ?? createRouter(frameId)

  const emptyPage: Page = {
    component: '',
    props: { errors: {} },
    url: '',
    version: null,
    rescuedProps: [],
    flash: {},
    rememberedState: {},
  }

  let booted = $state(false)

  // svelte-ignore state_referenced_locally
  let component = $state<ResolvedComponent | null>(initialComponent ?? null)
  let key = $state<number | null>(null)
  // svelte-ignore state_referenced_locally
  let page = $state<Page | null>(initialPage ? { ...initialPage, flash: initialPage.flash ?? {} } : null)
  let renderProps = $derived.by<RenderProps | null>(() => {
    if (!component || !page) {
      return null
    }

    return resolveRenderProps(component, page, key)
  })

  const shouldLoadFromSrc = initialPage === undefined && !!src

  setFrameContext({
    id: frameId,
    router: frameRouter,
    resolveComponent: frameResolveComponent,
    page: toStore(() => page ?? emptyPage),
  })

  if (frameId === DEFAULT_FRAME_ID && page) {
    setPage(page)
  }

  $effect.pre(() => {
    if (frameId === DEFAULT_FRAME_ID && page) {
      setPage(page)
    }
  })

  const isServer = typeof window === 'undefined'

  function initRouter(initial: Page): void {
    if (isServer || booted) {
      return
    }

    frameRouter.init<ResolvedComponent>({
      initialPage: initial,
      resolveComponent: resolveFrameComponent,
      swapComponent: async (args) => {
        component = args.component
        page = args.page
        key = args.preserveState ? key : Date.now()

        if (!args.preserveState) {
          resetLayoutProps()
        }
      },
      onFlash: (flash) => {
        page = { ...(page ?? initial), flash }
      },
    })

    booted = true
  }

  if (!isServer && initialPage && !shouldLoadFromSrc) {
    initRouter(initialPage)
  }

  onDestroy(() => {
    // Only destroy routers that were created by this Frame instance (not ones
    // passed in via the router prop — the caller owns those).
    if (!router) {
      frameRouter.destroy()
    }
  })

  onMount(() => {
    if (isServer || !shouldLoadFromSrc || !src) {
      return
    }

    // Init router with empty page so router.get() has a baseline to work from.
    // The swapComponent callback handles setting component, page, and key once
    // the response arrives — no need to duplicate the request/parse/resolve logic.
    // replace: true prevents adding a browser history entry for the initial load.
    initRouter(emptyPage)
    frameRouter.get(src, {}, { replace: true, preserveScroll: true })
  })

  function isComponent(value: unknown): value is Component {
    if (!value) {
      return false
    }

    if (typeof value === 'function') {
      const fn = value as Function & { name?: string }
      return fn.name !== ''
    }

    if (typeof value === 'object' && '$$' in value) {
      return true
    }

    return false
  }

  function isRenderFunction(value: unknown): boolean {
    return (
      typeof value === 'function' &&
      (value as Function).length === 2 &&
      typeof (value as Function).prototype === 'undefined'
    )
  }

  function resolveRenderProps(component: ResolvedComponent, page: Page, key: number | null = null): RenderProps {
    const child = h(component.default, { ...page.props, ...restProps }, [], key)

    if (!shouldRenderLayout) {
      return child
    }

    if (component.layout && isRenderFunction(component.layout)) {
      return (component.layout as LayoutResolver)(h, child)
    }

    let effectiveLayout: LayoutType | undefined
    let callbackProps: Record<string, unknown> | null = null
    const layoutValue = component.layout

    if (
      typeof layoutValue === 'function' &&
      (layoutValue as Function).length <= 1 &&
      typeof (layoutValue as Function).prototype === 'undefined'
    ) {
      const result = (layoutValue as Function)(page.props)

      if (isPropsObjectOrCallback(result, isComponent)) {
        effectiveLayout = defaultLayout?.(page.component, page) as LayoutType | undefined
        callbackProps = result as Record<string, unknown>
      } else {
        effectiveLayout = result as LayoutType | undefined
      }
    } else if (isPropsObject(layoutValue, isComponent)) {
      effectiveLayout = defaultLayout?.(page.component, page) as LayoutType | undefined
      callbackProps = layoutValue as Record<string, unknown>
    } else {
      effectiveLayout = (layoutValue ?? defaultLayout?.(page.component, page)) as LayoutType | undefined
    }

    return effectiveLayout
      ? resolveLayout(effectiveLayout, child, page.props, key, !!component.layout && !callbackProps, callbackProps)
      : child
  }

  function resolveLayout(
    layout: LayoutType,
    child: RenderProps,
    pageProps: PageProps,
    key: number | null,
    isFromPage: boolean = true,
    callbackProps: Record<string, unknown> | null = null,
  ): RenderProps {
    if (isFromPage && isRenderFunction(layout)) {
      return (layout as LayoutResolver)(h, child)
    }

    let layouts = normalizeLayouts(layout, isComponent, isFromPage ? isRenderFunction : undefined)

    if (callbackProps) {
      layouts = layouts.map((l) => ({ ...l, props: { ...l.props, ...callbackProps } }))
    }

    if (layouts.length > 0) {
      const dynamicProps = isServer ? { shared: {}, named: {} } : { shared: storeState.shared, named: storeState.named }

      return layouts.reduceRight((child, layout) => {
        return {
          ...h(
            layout.component,
            {
              ...pageProps,
              ...layout.props,
              ...dynamicProps.shared,
              ...(layout.name ? dynamicProps.named[layout.name] || {} : {}),
            },
            [child],
            key,
          ),
          name: layout.name,
        }
      }, child)
    }

    return child
  }

  function attachClickHandler(node: HTMLElement) {
    const parent = node.parentElement

    if (!parent) {
      return
    }

    parent.addEventListener('click', handleClick)

    return () => {
      parent.removeEventListener('click', handleClick)
    }
  }

  function handleClick(event: MouseEvent): void {
    // Find the closest anchor from the click target (handles clicks on child elements)
    const target = (event.target as HTMLElement).closest('a')

    if (!target) {
      return
    }

    const href = target.getAttribute('href')

    // Ignore: no href, fragment-only, mailto/tel/other non-http schemes
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      return
    }

    // Ignore: opens in a new context
    if (target.hasAttribute('target')) {
      return
    }

    // Ignore: file download
    if (target.hasAttribute('download')) {
      return
    }

    // Ignore: explicitly opted out
    if (target.hasAttribute('data-inertia-ignore')) {
      return
    }

    // Ignore: external URLs (different origin)
    try {
      const url = new URL(href, window.location.href)
      if (url.origin !== window.location.origin) {
        return
      }
    } catch {
      return
    }

    // Honour modifier keys, non-left-button clicks, content-editable, and
    // already-prevented events (shouldIntercept checks all of these)
    if (!shouldIntercept({ ...event, currentTarget: target })) {
      return
    }

    onClickLink?.(event, href)

    if (event.defaultPrevented) {
      return
    }

    event.preventDefault()
    frameRouter.visit(href)
  }
</script>

{#if renderProps}
  <Render {...renderProps} />
{:else}
  {@render children?.()}
{/if}

<!--
  Invisible anchor used solely to find the nearest DOM parent so we can attach a
  delegated click handler that intercepts plain <a> clicks inside this Frame.
  We use "display:contents" so it adds no layout box.
-->
{#if !isServer}
  <span style="display:contents" {@attach attachClickHandler}></span>
{/if}
