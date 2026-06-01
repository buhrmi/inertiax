<script lang="ts">
  interface Props {
    children?: import('svelte').Snippet
  }

  let { children }: Props = $props()
</script>

<div data-testid="top-frame-layout">
  Top Frame Layout
  {@render children?.()}
</div>
