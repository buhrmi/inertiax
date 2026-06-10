<script lang="ts">
  import { Frame } from 'inertiax-svelte'

  let showFrame = $state(false)
</script>

<div data-testid="frame-scroll-preserve-page">
  <div style="height: 1600px"></div>
  <div style="height: 1600px"></div>

  <button data-testid="mount-frame-button" onclick={() => (showFrame = true)}>Mount frame</button>

  {#if showFrame}
    <div data-testid="frame-mounted">
      <Frame src="/svelte/frame-scroll-preserve/pane" />
    </div>
  {/if}
</div>
