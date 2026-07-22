<script lang="ts">
  import { Link } from 'inertiax-svelte'

  interface Props {
    id: string
    clicked?: boolean
  }

  let { id, clicked = false }: Props = $props()
</script>

<div data-testid="frame-header-page">
  <p data-testid="frame-header-id">{id}</p>
  {#if !clicked}
    <Link data-testid="frame-header-link" href={`/svelte/frame-header-test/${id}/click`}>Click</Link>
  {:else}
    <p data-testid="frame-header-clicked">Clicked</p>
  {/if}
</div>
