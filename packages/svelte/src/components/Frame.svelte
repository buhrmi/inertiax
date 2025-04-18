<script context="module" lang="ts">
  import type { ComponentResolver, ResolvedComponent } from '../types'
  import { shouldIntercept, type Page } from 'inertiax-core'

  let topResolveComponent: ComponentResolver | null = null
  
  export interface InertiaFrameProps {
    initialComponent: ResolvedComponent | Promise<ResolvedComponent>
    initialPage: Page
    resolveComponent: ComponentResolver,
    name?: string
  }
</script>

<script lang="ts">
  import type { LayoutType, LayoutResolver } from '../types'
  import { Router, type PageProps } from 'inertiax-core'
  import Render, { h, type RenderProps } from './Render.svelte'
  
  import { onDestroy, setContext } from 'svelte'
  import { writable } from 'svelte/store'

  export let initialComponent: InertiaFrameProps['initialComponent']
  export let initialPage: InertiaFrameProps['initialPage']
  export let resolveComponent: InertiaFrameProps['resolveComponent'] = topResolveComponent
  export let name: InertiaFrameProps['name'] = Math.random().toString(36).slice(6)

  export let renderLayout = name == "_top"
  export let src
  export let onclick = () => {}

  function handleClick(event: MouseEvent) {
    if (event.target.closest('[data-inertia-ignore]')) return;
    onclick(event)
    if (!shouldIntercept(event)) return
    const href = event.target.closest('[href]')?.getAttribute('href')
    if (!href) return
    event.preventDefault()
    router.visit(href)
  }

  if (name == "_top") topResolveComponent = resolveComponent

  const { set, subscribe } = writable<Page>()

  const setPage = set

  let component: ResolvedComponent | null = null
  let key: number | null = null
  let page = {
    ...initialPage,
    url: initialPage?.url || src
  }
  let renderProps = null

  // Handle initialComponent being a promise
  Promise.resolve(initialComponent).then(resolvedComponent => {
    if (!resolvedComponent) return
    component = resolvedComponent
    renderProps = resolveRenderProps(component, page, key)
  })

  setPage(page)
  
  const isServer = typeof window === 'undefined'
  
  let router: Router = new Router({
    name,
    initialPage: page,
    resolveComponent,
    swapComponent: async (args) => {
      component = args.component as ResolvedComponent
      page = args.page
      key = args.preserveState ? key : Date.now()
      renderProps = resolveRenderProps(component, page, key)
      setPage(page)
    },
  })
  onDestroy(() => {
    router.destroy()
  })
  if (!isServer && src) {
    router.visit(src, { replace: true, preserveState: true, preserveUrl: true })
  }
  
  const context = {page: { subscribe }, frame: name, router}
  setContext('inertia', context)
  setContext(`inertia:${name}`, context)
  
  
  /**
   * Resolves the render props for the current page component, including layouts.
   */
  function resolveRenderProps(component: ResolvedComponent, page: Page, key: number | null = null): RenderProps {
    const child = h(component.default || component, {...$$restProps, ...page.props}, [], key)
    const layout = renderLayout && component.layout
    
    return layout ? resolveLayout(layout, child, page.props, key) : child
  }
  
  /**
   * Builds the nested layout structure by wrapping the child component with the provided layouts.
   *
   * Resulting nested structure:
   *
   *    {
   *      "component": OuterLayout,
   *      "key": 123456,
   *      "children": [{
   *        "component": InnerLayout,
   *        "key": 123456,
   *        "children": [{
   *          "component": PageComponent,
   *          "key": 123456,
   *          "children": [],
   *        }],
   *      }],
   *    }
   */
  function resolveLayout(
    layout: LayoutType,
    child: RenderProps,
    pageProps: PageProps,
    key: number | null,
  ): RenderProps {
    if (isLayoutFunction(layout)) {
      return layout(h, child)
    }

    if (Array.isArray(layout)) {
      return layout
        .slice()
        .reverse()
        .reduce((currentRender, layoutComponent) => h(layoutComponent, pageProps, [currentRender], key), child)
    }

    return h(layout, pageProps, child ? [child] : [], key)
  }

  /**
   * Type guard to check if layout is a LayoutResolver
   */
  function isLayoutFunction(layout: LayoutType): layout is LayoutResolver {
    return typeof layout === 'function' && layout.length === 2 && typeof layout.prototype === 'undefined'
  }
</script>

<div style="display: contents" on:click={handleClick} role="presentation">
  {#if renderProps}
    <Render {...renderProps} />
  {:else}
    <slot />
  {/if}
</div>