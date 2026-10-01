<script lang="ts">
  import { Frame } from 'inertiax-svelte'
</script>

<div data-testid="frame-history-options-page">
  <!-- Default: stores its page in the history entry and follows back/forward. -->
  <Frame id="opts-normal" src="/svelte/frame-history-options/pane?frame=normal" restore />

  <!-- Never writes its page into the history entry (so it also can't restore). -->
  <Frame
    id="opts-no-state"
    src="/svelte/frame-history-options/pane?frame=no-state"
    restore
    historyState={false}
  />

  <!-- Stores/restores its page, but ignores back/forward navigation. -->
  <Frame
    id="opts-no-nav"
    src="/svelte/frame-history-options/pane?frame=no-nav"
    restore
    historyNavigation={false}
  />
</div>
