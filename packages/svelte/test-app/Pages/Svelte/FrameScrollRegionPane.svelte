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
  <!--
    A plain anchor so Frame.svelte's delegated click handler applies
    `data-preserve-state`. This keeps the pane component mounted, so the content
    height stays constant during the swap and the browser cannot clamp scrollTop
    to 0 on its own — the reset has to come from Scroll.reset().
  -->
  <a
    data-testid="pane-next-link-preserve"
    href={`/svelte/frame-scroll-region/pane?step=${step + 1}`}
    data-preserve-state="true"
  >
    Next step (preserve state)
  </a>
  <!-- Spacer to make the pane tall enough to cause the parent scroll-region to scroll -->
  <div style="height: 2000px"></div>
</div>
