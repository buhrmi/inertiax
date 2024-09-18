<script module>
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

  let {component: Component, props = {}, children = []} = $props()

  // let key = $state(new Date().getTime())
  
  // let prev = Component

  // function updateKey(Component) {
  //   if (prev !== Component) {
  //     console.log('prev: ', prev)
  //     console.log('new: ', Component)
  //     prev = Component
  //     key = new Date().getTime()
  //   }
  // }

  // $effect(() => updateKey(Component))
</script>


<Component {...props}>
  {#each children as child, index (Component && Component.length === index ? $store.key : null)}
    <svelte:self {...child} />
  {/each}
</Component>
