<script lang="ts">
  interface Props {
    children?: import('svelte').Snippet
  }

  let { children }: Props = $props()
</script>

<div data-testid="nested-frame-layout">
  Nested Frame Layout
  {@render children?.()}
</div>
