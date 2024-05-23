<script>
  import { onMount } from 'svelte'
  import Render, { h } from './Render.svelte'
  import store from './store'
  import { router } from 'inertiax-svelte'
  import { setContext } from 'svelte';

  export let src
  
  export let id = Math.random()
  setContext('inertia:frame-id', id)
  $: setContext('inertia:frame-src', src)

  $: components = $store.frames?.[id] && h($store.frames[id].component.default, Object.assign({}, $$restProps, $store.frames[id].props))

  onMount(() => {
    router.visit(src, {
      target: id
    })
  })

</script>

<div data-inertia-frame-id={id}>
  {#if components}
    <Render {...components} />
  {:else}
    <slot />
  {/if}
</div>

<style>
  div {
    display: contents;
  }
</style>