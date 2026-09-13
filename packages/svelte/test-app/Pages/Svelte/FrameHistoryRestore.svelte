<script lang="ts">
  import { Frame } from 'inertiax-svelte'
</script>

<div>
  <h1>Frame History Restore</h1>

  <section>
    <h2>Fresh request (default)</h2>
    <div data-testid="default-section">
      <Frame id="history-default" src="/svelte/frame-history-restore/pane" />
    </div>
  </section>

  <section>
    <h2>With restore</h2>
    <div data-testid="restore-section">
      <Frame id="history-restore"
             src="/svelte/frame-history-restore/pane"
             restore />
    </div>
  </section>
</div>
