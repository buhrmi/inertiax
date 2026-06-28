<script lang="ts">
  import { Link } from 'inertiax-svelte'

  interface Props {
    step: number
  }

  let { step = 0 }: Props = $props()
</script>

<div data-testid="frame-mount-pane">
  <p data-testid="scroll-mount-step">{step}</p>
  <Link
    data-testid="scroll-mount-next-link"
    href="/svelte/frame-mount-scroll-restore/pane"
    data={{ step: step + 1 }}
  >
    Next step
  </Link>
  <!-- Tall content so scrolling produces a noticeable offset -->
  <div style="height: 2000px; background: linear-gradient(to bottom, #e0e0e0, #ffffff);"></div>
</div>
