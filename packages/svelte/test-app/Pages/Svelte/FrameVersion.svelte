<script lang="ts">
  import { Frame } from 'inertiax-svelte'

  interface Props {
    token: string
  }

  let { token }: Props = $props()
</script>

<div data-testid="frame-version-page">
  <Frame id="version-frame" src={`/svelte/frame-version/${token}/pane`} />
</div>
