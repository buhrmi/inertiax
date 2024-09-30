<script>
  import { onMount, setContext } from 'svelte'
  import Render, { h } from './Render.svelte'
  import store from './store'
  import { router } from 'inertiax-svelte'

  const {children, src, hint, component, id = Math.random(), ...restProps} = $props()

  setContext('inertia:frame-id', id)

  const components = $derived($store.frames?.[id] && h($store.frames[id].component.default, Object.assign({}, restProps, $store.frames[id].props)))

  onMount(() => {
    // we already have components (probably from history navigation), don't need to make a request
    if (components) return;
    router.visit(src, {
      target: id,
      hint,
      component
    })
  })

</script>

<div data-inertia-frame-id={id}>
  {#if components}
    <Render {...components} />
  {:else}
    {@render children?.()}
  {/if}
</div>

<style>
  div {
    display: contents;
  }
</style>