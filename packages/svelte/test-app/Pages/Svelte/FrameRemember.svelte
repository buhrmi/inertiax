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

<div data-testid="frame-remember-page">
  <h1>Frame Remember</h1>

  <button data-testid="toggle-frame" onclick={() => (showFrame = !showFrame)}>
    {showFrame ? 'Unmount' : 'Mount'} Frame
  </button>

  {#if showFrame}
    <Frame id="remember-frame" src="/svelte/frame-remember/pane" {resolveComponent} skipHistoryRestore />
  {/if}
</div>
