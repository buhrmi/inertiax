<script lang="ts">
  import { Link } from 'inertiax-svelte'

  interface Props {
    frame?: string
    step?: number
  }

  let { frame = '', step = 0 }: Props = $props()
</script>

<div data-testid={`opts-pane-${frame}`}>
  <p data-testid={`opts-step-${frame}`}>{step}</p>
  <Link data-testid={`opts-next-${frame}`} href="/svelte/frame-history-options/pane" data={{ frame, step: step + 1 }}>
    Next
  </Link>
</div>
