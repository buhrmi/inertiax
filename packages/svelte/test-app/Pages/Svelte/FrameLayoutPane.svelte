<script module lang="ts">
  import FrameLayoutNestedLayout from './FrameLayoutNestedLayout.svelte'

  export const layout = FrameLayoutNestedLayout
</script>

<script lang="ts">
  const { forwardedMessage = '' }: { forwardedMessage?: string } = $props()
</script>

<div data-testid="nested-frame-pane">Nested Frame Pane</div>
<div data-testid="nested-frame-forwarded-message">{forwardedMessage}</div>
