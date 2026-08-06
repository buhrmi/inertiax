<script lang="ts">
  interface Props {
    frame: string
    label: string
  }

  let { frame, label }: Props = $props()
</script>

<div data-testid={`${frame}-pane`}>
  <p data-testid={`${frame}-label`}>{label}</p>
  <a href="/svelte/frame-events/{frame}?t={Date.now()}" data-testid={`${frame}-link`}>Navigate {frame}</a>
</div>
