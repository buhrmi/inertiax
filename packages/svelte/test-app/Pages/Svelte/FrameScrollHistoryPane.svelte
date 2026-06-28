<script lang="ts">
  import { Link } from 'inertiax-svelte'

  interface Props {
    step: number
  }

  let { step = 0 }: Props = $props()
</script>

<div data-testid="frame-scroll-history-pane">
  <p data-testid="scroll-history-step">{step}</p>
  <Link data-testid="scroll-history-next-link" href="/svelte/frame-scroll-history/pane" data={{ step: step + 1 }}>
    Next step
  </Link>
  <div style="height: 2000px"></div>
</div>
