<script lang="ts">
  import { Frame } from 'inertiax-svelte'
</script>

<div>
  <h1>Frame History Restore</h1>

  <section>
    <h2>With history restore (default)</h2>
    <div data-testid="default-section">
      <Frame id="history-default" src="/svelte/frame-history-restore/pane" />
    </div>
  </section>

  <section>
    <h2>With forceRequest</h2>
    <div data-testid="skip-section">
      <Frame id="history-skip"
             src="/svelte/frame-history-restore/pane"
             forceRequest />
    </div>
  </section>
</div>
