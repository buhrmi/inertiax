<script lang="ts">
  import { page } from 'inertiax-svelte'
  import { onMount } from 'svelte'

  // Capture at module evaluation time (script tag runs during component init)
  const moduleHasProps = Object.keys(page.props).length > 0
  const moduleComponent = page.component

  let mountHasProps = false
  let mountComponent = ''

  onMount(() => {
    mountHasProps = Object.keys(page.props).length > 0
    mountComponent = page.component
  })
</script>

<div>
  <p data-testid="page-store-module-has-props">{moduleHasProps ? 'yes' : 'no'}</p>
  <p data-testid="page-store-module-component">{moduleComponent}</p>
  <p data-testid="page-store-mount-has-props">{mountHasProps ? 'yes' : 'no'}</p>
  <p data-testid="page-store-mount-component">{mountComponent}</p>
</div>
