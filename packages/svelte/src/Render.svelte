<script context="module">
  export const h = (component, props, nested) => {
    return {
      component,
      ...(props ? { props } : {}),
      ...(nested ? { nested } : {}),
    }
  }
</script>

<script>
  import store from './store'

  const {component, props = {}, nested = []} = $props()
</script>

{#if $store.component}
  <svelte:component this={component} {...props}>
    {#each nested as child, index (component && component.length === index ? $store.key : null)}
      <svelte:self {...child} />
    {/each}
  </svelte:component>
{/if}
