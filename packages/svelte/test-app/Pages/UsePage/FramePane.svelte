<script lang="ts">
  import { Link, usePage } from 'inertiax-svelte'

  const page = usePage()

  interface Props {
    step?: number
  }

  let { step = 0 }: Props = $props()
</script>

<div data-testid="frame-pane">
  <p data-testid="frame-url">Frame URL: {page.url}</p>
  <p data-testid="frame-component">Frame component: {page.component}</p>

  <Link data-testid="frame-nav" href="/use-page/frame-pane" data={{ step: step + 1 }}>
    Frame navigate
  </Link>
</div>
