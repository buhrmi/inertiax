<script lang="ts">
  import type { ResolvedComponent } from 'inertiax-svelte'
  import { Frame, Link } from 'inertiax-svelte'

  const pages = import.meta.glob<ResolvedComponent>('./*.svelte', { eager: true })

  const resolveComponent = (name: string) => {
    if (name === 'Svelte/FrameRememberPane') {
      return pages['./FrameRememberPane.svelte'] as ResolvedComponent
    }
    throw new Error(`Unknown frame component: ${name}`)
  }
</script>

<div data-testid="frame-remember-skip-page">
  <h1>Frame Remember (forceRequest)</h1>

  <Link data-testid="navigate-away" href="/dump/get">Navigate away</Link>

  <Frame id="remember-skip" src="/svelte/frame-remember/pane-skip" {resolveComponent} forceRequest />
</div>
