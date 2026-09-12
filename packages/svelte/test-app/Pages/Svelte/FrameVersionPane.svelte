<script lang="ts">
  import { Link } from 'inertiax-svelte'

  interface Props {
    token: string
    label?: string
  }

  let { token, label = '' }: Props = $props()
</script>

<div data-testid="frame-version-pane">
  <p data-testid="version-label">{label}</p>
  <Link data-testid="version-next-link" href={`/svelte/frame-version/${token}/pane`} data={{ step: '1' }}>Next</Link>
</div>
