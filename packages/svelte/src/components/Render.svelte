<script context="module" lang="ts">
  import type { PageProps } from 'inertiax-core'
  import type { ComponentType } from 'svelte'
  import Render from './Render.svelte'
  
  export type RenderProps = {
    component: ComponentType
    props?: PageProps
    children?: RenderProps[]
    key?: number | null
  } | null

  export type RenderFunction = {
    (component: ComponentType, props?: PageProps, children?: RenderProps[], key?: number | null): RenderProps
    (component: ComponentType, children?: RenderProps[], key?: number | null): RenderProps
  }

  export const h: RenderFunction = (component, propsOrChildren, childrenOrKey, key: number | null = null) => {
    const hasProps = typeof propsOrChildren === 'object' && propsOrChildren !== null && !Array.isArray(propsOrChildren)

    return {
      component,
      key: hasProps ? key : typeof childrenOrKey === 'number' ? childrenOrKey : null,
      props: hasProps ? propsOrChildren : {},
      children: hasProps
        ? ((Array.isArray(childrenOrKey)
            ? childrenOrKey
            : childrenOrKey !== null
              ? [childrenOrKey]
              : []) as RenderProps[])
        : ((Array.isArray(propsOrChildren)
            ? propsOrChildren
            : propsOrChildren !== null
              ? [propsOrChildren]
              : []) as RenderProps[]),
    }
  }
</script>

<script lang="ts">
  const {
    component: Component, 
    props,
    children,
    key
  } = $props()
</script>

{#if Component}
  <!--
  Add the `key` only to the last (page) component in the tree.
  This ensures that the page component re-renders when `forgetState` is disabled,
  while the layout components are persisted across page changes. -->
  {#key children?.length === 0 ? key : null}
    {#if children.length > 0}
      <Component {...props}>
        {#each children as child}
          <Render {...child} />
        {/each}
      </Component>
    {:else}
      <Component {...props} />
    {/if}
  {/key}
{/if}
