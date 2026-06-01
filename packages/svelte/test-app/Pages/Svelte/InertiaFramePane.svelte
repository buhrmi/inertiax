<script lang="ts">
  import { useFrameRouter } from 'inertiax-svelte'

  interface Props {
    frame: 'left' | 'right'
    message: string
    errors?: Record<string, string>
  }

  let { frame, message, errors = {} }: Props = $props()

  const router = useFrameRouter()

  // Submit to the cross-frame endpoint, explicitly targeting the OTHER frame via frameId.
  // The server should honour the X-Inertia-Frame response header and redirect the
  // response back to the originating (this) frame instead.
  function submitToOtherFrame() {
    const otherFrame = frame === 'left' ? 'right' : 'left'
    router.post(`/svelte/inertia-frame-header/${frame}/submit`, {}, { frameId: otherFrame })
  }

  // Submit to the cross-frame endpoint without any frameId override — the server
  // echoes X-Inertia-Frame with the originating frame ID from the request header.
  function submitNormally() {
    router.post(`/svelte/inertia-frame-header/${frame}/submit-echo`, {})
  }
</script>

<div data-testid={frame + '-pane'}>
  <p data-testid={frame + '-message'}>{message}</p>

  {#if Object.keys(errors).length > 0}
    <ul data-testid={frame + '-errors'}>
      {#each Object.entries(errors) as [key, val]}
        <li data-testid={frame + '-error-' + key}>{val}</li>
      {/each}
    </ul>
  {/if}

  <!--
    Submits with frameId overridden to the OTHER frame, but server echoes
    X-Inertia-Frame back to the originating frame.
  -->
  <button data-testid={frame + '-submit-cross'} onclick={submitToOtherFrame}>
    Submit cross-frame ({frame})
  </button>

  <!--
    Submits normally; server echoes X-Inertia-Frame with the originating frame ID
    read from the X-Inertia-Frame request header.
  -->
  <button data-testid={frame + '-submit-echo'} onclick={submitNormally}>
    Submit echo ({frame})
  </button>
</div>
