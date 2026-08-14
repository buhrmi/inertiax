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
    /** When `true`, always fetches fresh page data on mount instead of restoring from the history stack. Defaults to `false`. */
    forceRequest?: boolean
    /** Visit options applied to all navigations within this frame. Link/form-level options take precedence. Non-top frames default to `{ replace: true, updateBrowserUrl: false }`, top frame defaults to `{ replace: false, updateBrowserUrl: true }`. */
    visitOptions?: import('inertiax-core').VisitOptions
    /** Called when a plain <a> inside the frame is clicked. Call event.preventDefault() to prevent the default Inertia navigation. */
    onClickLink?: (event: MouseEvent, href: string) => void
    children?: import('svelte').Snippet
  }

  export type { InertiaFrameProps as InertiaAppProps }
</script>

<script lang="ts">
  import { createRouter, HttpResponseError, http, isPropsObject, isPropsObjectOrCallback, normalizeLayouts, shouldIntercept } from 'inertiax-core'
  import { onDestroy, onMount } from 'svelte'
  import { toStore } from 'svelte/store'
  import type { Component } from 'svelte'
  import { DEFAULT_FRAME, setFrameContext, useFrameContext, useGlobalResolveComponent } from '../frameContext.svelte'
  import { resetLayoutProps, storeState } from '../layoutProps.svelte'
  import globalPage, { setPage } from '../page.svelte'
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
    forceRequest?: InertiaFrameProps['forceRequest']
    visitOptions?: InertiaFrameProps['visitOptions']
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
    forceRequest = false,
    visitOptions,
    onClickLink,
    children,
    ...restProps
  }: Props & Record<string, unknown> = $props()

  const parentFrameContext = useFrameContext()
  // svelte-ignore state_referenced_locally
  const frameResolveComponent = resolveComponent ?? parentFrameContext?.resolveComponent ?? useGlobalResolveComponent()

  function createFrameName(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID()
    }

    return `frame-${Math.random().toString(36).slice(2, 10)}`
  }

  // Use explicit id > src > random UUID.  Using src as the frame gives
  // frames a deterministic identity — remounts with the same src share
  // history state, so the history-restore optimisation works naturally.
  const frame = id ?? src ?? createFrameName()
  const shouldRenderLayout = renderLayout ?? frame === DEFAULT_FRAME

  function resolveFrameComponent(name: string, page?: Page) {
    if (!frameResolveComponent) {
      throw new Error(`No resolveComponent available for frame "${frame}"`)
    }

    // Empty component names occur during initial frame setup when the router
    // is initialised with a placeholder page before the real data arrives.
    // Return null so the frame renders nothing until the real page loads.
    if (!name) {
      return null as unknown as ResolvedComponent
    }

    return frameResolveComponent(name, page)
  }

  const frameRouter = router ?? createRouter(frame)

  // Frame-level visit options: non-top frames default to { replace: true, updateBrowserUrl: false }
  const defaultFrameVisitOptions = frame !== DEFAULT_FRAME
    ? { replace: true, updateBrowserUrl: false }
    : { replace: false, updateBrowserUrl: true }
  const frameVisitOptions = $derived({ ...defaultFrameVisitOptions, ...visitOptions })

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
  // When true, the next component mount triggers a scroll-restore (used by the
  // history-decrypt path so scroll is restored after content has rendered).
  let pendingRestoreScroll = $state(false)

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



  setFrameContext({
    id: frame,
    router: frameRouter,
    resolveComponent: frameResolveComponent,
    page: toStore(() => page ?? emptyPage),
    visitOptions: frameVisitOptions,
  })

  if (frame === DEFAULT_FRAME && page) {
    setPage(page)
  }

  $effect.pre(() => {
    if (frame === DEFAULT_FRAME && page) {
      setPage(page)
    }
  })

  // Restore scroll position after the frame's component has been swapped
  // and rendered (used by the history-decrypt path in onMount).
  $effect(() => {
    if (pendingRestoreScroll && component) {
      pendingRestoreScroll = false
      frameRouter.restoreScroll()
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
        // Sync the global page store for the top frame so usePage()
        // outside of any Frame context stays up to date.
        if (frame === DEFAULT_FRAME) {
          setPage(args.page)
        }
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

  if (!isServer && initialPage) {
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
    if (isServer || !src || initialPage) {
      return
    }

    const load = async () => {
      // Try to restore from history state first — avoids an unnecessary
      // request when the frame's page data is already in the history stack.
      if (!forceRequest) {
        try {
          const historyPage = await frameRouter.decryptHistory()

          if (historyPage && historyPage.component) {
            initRouter(historyPage)
            pendingRestoreScroll = true

            return
          }
        } catch {
          // No history state available, fall through to HTTP request.
        }
      }

      const version = page?.version ?? globalPage.version ?? (window as any)?.initialPage?.version ?? null

      let data: any
      try {
        const response = await http.getClient().request({
          method: 'get',
          url: src,
          headers: {
            Accept: 'text/html, application/xhtml+xml',
            'X-Requested-With': 'XMLHttpRequest',
            'X-Inertia': true,
            'X-Inertia-Frame': frame,
            ...(version ? { 'X-Inertia-Version': version } : {}),
          },
        })

        data = response.data
      } catch (error: unknown) {
        // The HTTP client rejects on status >= 400, so 409 responses arrive
        // here as HttpResponseError rather than through the normal flow.
        if (error instanceof HttpResponseError && error.response.status === 409) {
          const location = error.response.headers?.['x-inertia-location']
          const redirect = error.response.headers?.['x-inertia-redirect']

          if (frame !== DEFAULT_FRAME) {
            // Non-top frames can't redirect the browser — reload the page so
            // the app recovers at the document level.
            window.location.reload()
          } else if (location || redirect) {
            window.location.href = location || redirect
          } else {
            window.location.reload()
          }

          return
        }

        throw error
      }
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data)
        } catch {
          return
        }
      }

      const loadedPage = {
        ...data,
        flash: data.flash ?? {},
        rescuedProps: data.rescuedProps ?? [],
      } as Page

      initRouter(loadedPage)
    }

    void load()
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
    node.addEventListener('click', handleClick)
    return () => {
      node.removeEventListener('click', handleClick)
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

    // Support data-method, data-replace, data-preserve-scroll, data-preserve-state,
    // data-frame, and data-http-only on plain <a> elements
    const dataMethod = target.getAttribute('data-method')
    const method = dataMethod ? (dataMethod.toLowerCase() as 'get' | 'post' | 'put' | 'patch' | 'delete') : undefined
    const replace = target.hasAttribute('data-replace')
      ? target.getAttribute('data-replace') !== 'false'
      : undefined
    const preserveScroll = target.hasAttribute('data-preserve-scroll')
      ? target.getAttribute('data-preserve-scroll') !== 'false'
      : undefined
    const preserveState = target.hasAttribute('data-preserve-state')
      ? target.getAttribute('data-preserve-state') !== 'false'
      : undefined
    const dataFrame = target.getAttribute('data-frame')

    // data-http-only: make a plain JSON request via Inertia's HTTP client
    if (target.hasAttribute('data-http-only')) {
      void http
        .getClient()
        .request({
          method: method ?? 'get',
          url: href,
          headers: {
            Accept: 'application/json',
          },
        })
        .catch(() => {})

      return
    }

    frameRouter.visit(href, {
      ...frameVisitOptions,
      ...(method ? { method } : {}),
      ...(replace !== undefined ? { replace } : {}),
      ...(preserveScroll !== undefined ? { preserveScroll } : {}),
      ...(preserveState !== undefined ? { preserveState } : {}),
      ...(dataFrame ? { frame: dataFrame } : {}),
    })
  }
</script>

<div id={frame} class="frame" style="display: contents" {@attach attachClickHandler}>
  {#if renderProps}
    <Render {...renderProps} />
  {:else}
    {@render children?.()}
  {/if}
</div>
