<script module lang="ts">
  import { type Page, type PageProps, type Router } from '@inertiajs/core'
  import type { ComponentResolver, ResolvedComponent } from '../types'

  export interface InertiaFrameProps<SharedProps extends PageProps = PageProps> {
    id?: string
    src?: string
    router?: Router
    initialComponent?: ResolvedComponent
    initialPage?: Page<SharedProps>
    resolveComponent: ComponentResolver
    defaultLayout?: (name: string, page: Page) => unknown
    children?: import('svelte').Snippet
  }

  export type { InertiaFrameProps as InertiaAppProps }
</script>

<script lang="ts">
  import { createRouter, http, isPropsObject, isPropsObjectOrCallback, normalizeLayouts } from '@inertiajs/core'
  import { onMount } from 'svelte'
  import type { Component } from 'svelte'
  import { DEFAULT_FRAME_ID, setFrameContext, useFrameContext } from '../frameContext.svelte'
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
    children,
  }: Props = $props()

  const parentFrameContext = useFrameContext()
  const frameResolveComponent = resolveComponent ?? parentFrameContext?.resolveComponent

  function createFrameId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID()
    }

    return `frame-${Math.random().toString(36).slice(2, 10)}`
  }

  const frameId = id ?? (parentFrameContext ? createFrameId() : DEFAULT_FRAME_ID)

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
    getPage: () => page ?? emptyPage,
    setPage: (nextPage) => {
      page = nextPage
    },
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

  onMount(() => {
    if (isServer || !shouldLoadFromSrc || !src) {
      return
    }

    const load = async () => {
      const version = page?.version ?? (window as any)?.initialPage?.version ?? null

      const response = await http.getClient().request({
        method: 'get',
        url: src,
        headers: {
          Accept: 'text/html, application/xhtml+xml',
          'X-Requested-With': 'XMLHttpRequest',
          'X-Inertia': true,
          ...(version ? { 'X-Inertia-Version': version } : {}),
        },
      })

      let data: any = response.data

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

      const loadedComponent = (await Promise.resolve(resolveFrameComponent(loadedPage.component, loadedPage))) as ResolvedComponent

      component = loadedComponent
      page = loadedPage
      key = Date.now()

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
    const child = h(component.default, page.props, [], key)

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
</script>

{#if renderProps}
  <Render {...renderProps} />
{:else}
  {@render children?.()}
{/if}
