<script lang="ts">
  import { Link } from 'inertiax-svelte'

  interface Props {
    step?: number
  }

  let { step = 0 }: Props = $props()
</script>

<div data-testid="frame-document-scroll-pane">
  <p data-testid="pane-step">{step}</p>
  <Link data-testid="pane-next-link" href="/svelte/frame-document-scroll/pane" data={{ step: step + 1 }}>
    Next step
  </Link>
</div>
