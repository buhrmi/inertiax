<script lang="ts">
  interface Props {
    message?: string
  }

  let { message = '' }: Props = $props()
</script>

<p data-testid="frame-initial-pane">Pane: {message}</p>
