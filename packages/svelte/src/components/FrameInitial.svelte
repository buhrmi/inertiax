<script lang="ts">
  import type { Page } from 'inertiax-core'
  import type { ComponentResolver, ResolvedComponent } from '../types'
  import Render, { type RenderProps } from './Render.svelte'

  interface Props {
    page: Page
    /** The component the router has swapped in, if any. */
    component: ResolvedComponent | null
    resolveComponent: ComponentResolver
    build: (component: ResolvedComponent, page: Page) => RenderProps
  }

  const { page, component, resolveComponent, build }: Props = $props()

  // Resolve the component for a frame that was created with an `initialPage`
  // but no `initialComponent`. This `await` is what lets such a frame render
  // during SSR, while keeping `Frame` itself synchronous (an async `Frame`
  // would delay the first render of every frame on the client).
  //
  // NOTE: requires the `experimental.async: true` compiler option.
  // svelte-ignore state_referenced_locally
  // @ts-ignore `await` in a component is supported by the Svelte compiler with
  // `experimental.async: true`, but svelte2tsx (used by svelte-check) does not
  // model async components yet.
  const initialComponent = (await resolveComponent(page.component, page)) as ResolvedComponent

  // Prefer whatever the router has swapped in; fall back to the component that
  // was resolved from `initialPage` until the router's initial visit lands.
  const resolved = $derived(component ?? initialComponent)
</script>

{#if resolved}
  <Render {...build(resolved, page)} />
{/if}
