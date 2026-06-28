<script lang="ts">
  import { Frame } from 'inertiax-svelte'

  let visible = $state(true)
</script>

<div>
  <h1>Frame Mount Scroll Restore</h1>

  <button data-testid="toggle-hide" onclick={() => visible = false}>Hide Frame</button>
  <button data-testid="toggle-show" onclick={() => visible = true}>Show Frame</button>
  <span data-testid="visible-status">{visible ? 'visible' : 'hidden'}</span>

  <div
    data-testid="scroll-region"
    scroll-region
    style="height: 400px; overflow-y: auto; border: 2px solid blue;"
  >
    {#if visible}
      <Frame id="toggle-frame" src="/svelte/frame-mount-scroll-restore/pane" />
    {/if}
  </div>
</div>
