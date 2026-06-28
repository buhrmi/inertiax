<script lang="ts">
  import { Link } from 'inertiax-svelte'

  interface Props {
    step: number
  }

  let { step = 0 }: Props = $props()
</script>

<div data-testid="frame-history-pane">
  <p data-testid="history-step">{step}</p>
  <Link data-testid="history-next-link" href="/svelte/frame-history-restore/pane" data={{ step: step + 1 }}>
    Next step
  </Link>
  <div style="height: 2000px"></div>
</div>
