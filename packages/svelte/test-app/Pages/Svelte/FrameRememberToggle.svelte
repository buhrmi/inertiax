<script lang="ts">
  import type { ResolvedComponent } from 'inertiax-svelte'
  import { Frame } from 'inertiax-svelte'

  const pages = import.meta.glob<ResolvedComponent>('./*.svelte', { eager: true })

  const resolveComponent = (name: string) => {
    if (name === 'Svelte/FrameRememberPane') {
      return pages['./FrameRememberPane.svelte'] as ResolvedComponent
    }
    throw new Error(`Unknown frame component: ${name}`)
  }

  let showFrame = $state(false)
</script>

<div data-testid="frame-remember-toggle-page">
  <h1>Frame Remember (toggle)</h1>

  <button data-testid="toggle-frame" onclick={() => (showFrame = !showFrame)}>
    {showFrame ? 'Unmount' : 'Mount'} Frame
  </button>

  {#if showFrame}
    <!-- A fresh HTTP fetch on remount (the default) must not lose the
         remembered state; it survives via the frame's preserved page state. -->
    <Frame id="remember-toggle" src="/svelte/frame-remember/pane-toggle" {resolveComponent} />
  {/if}
</div>
