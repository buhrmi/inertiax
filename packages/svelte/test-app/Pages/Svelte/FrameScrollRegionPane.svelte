<script lang="ts">
  import { Link } from 'inertiax-svelte'

  interface Props {
    step: number
  }

  let { step = 0 }: Props = $props()
</script>

<div data-testid="frame-scroll-region-pane">
  <p data-testid="pane-step">{step}</p>
  <Link data-testid="pane-next-link" href="/svelte/frame-scroll-region/pane" data={{ step: step + 1 }}>
    Next step
  </Link>
  <!-- Spacer to make the pane tall enough to cause the parent scroll-region to scroll -->
  <div style="height: 2000px"></div>
</div>
