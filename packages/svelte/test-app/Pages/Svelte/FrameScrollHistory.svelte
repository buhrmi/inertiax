<script lang="ts">
  import { Frame } from 'inertiax-svelte'
</script>

<div>
  <h1>Frame Scroll History</h1>

  <div
    data-testid="scroll-region"
    scroll-region
    style="height: 400px; overflow-y: auto; border: 2px solid red;"
  >
    <Frame src="/svelte/frame-scroll-history/pane" />
  </div>
</div>
