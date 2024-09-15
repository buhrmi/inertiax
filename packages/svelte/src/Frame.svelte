<script>
  import { onMount, setContext } from 'svelte'
  import Render, { h } from './Render.svelte'
  import store from './store'
  import { router } from 'inertiax-svelte'
  
  const {children, src, id = Math.random(), ...restProps} = $props()
  
  setContext('inertia:frame-id', id)

  const components = $derived($store.frames?.[id] && h($store.frames[id].component.default, Object.assign({}, restProps, $store.frames[id].props)))

  onMount(() => {
    router.visit(src, {
      target: id
    })
  })

</script>

<div data-inertia-frame-id={id}>
  {#if components}
    <Render {...components} />
  {:else if children()}
    {@render children()}
  {/if}
</div>

<style>
  div {
    display: contents;
  }
</style>