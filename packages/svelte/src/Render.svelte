<script context="module">

  export const h = (component, props, children) => {
    return {
      component,
      ...(props ? { props } : {}),
      ...(children ? { children } : {}),
    }
  }
</script>

<script>
  import store from './store'

  let {component, props = {}, children = []} = $props()

  let key = $state(new Date().getTime())
  
  let prev = component

  function updateKey(component) {
    if (prev !== component) {
      prev = component
      key = new Date().getTime()
    }
  }

  $effect(() => updateKey(component))
</script>

{#if $store.component}
  {#key key}
    <svelte:component this={component} {...props}>
      {#each children as child, index (component && component.length === index ? $store.key : null)}
        <svelte:self {...child} />
      {/each}
    </svelte:component>
  {/key}
{/if}