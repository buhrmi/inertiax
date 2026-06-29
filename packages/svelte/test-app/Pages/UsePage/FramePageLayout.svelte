<script lang="ts">
  import { usePage } from 'inertiax-svelte'
  import type { Snippet } from 'svelte'

  const page = usePage()

  interface Props {
    children: Snippet
  }

  let { children }: Props = $props()
</script>

<div data-testid="layout-wrapper">
  <p data-testid="layout-url">Layout URL: {page.url}</p>
  <p data-testid="layout-component">Layout component: {page.component}</p>
  {@render children()}
</div>
