<script lang="ts">
  import { Frame } from 'inertiax-svelte'
  import type { ResolvedComponent } from 'inertiax-svelte'

  const pages = import.meta.glob<ResolvedComponent>('./*.svelte', { eager: true })

  const resolveComponent = (name: string) => {
    if (name === 'Svelte/FramePollPane') {
      return pages['./FramePollPane.svelte'] as ResolvedComponent
    }

    throw new Error(`Unknown frame component: ${name}`)
  }
</script>

<div data-testid="frame-poll-host">
  <Frame id="poll" src="/svelte/frame-poll/pane" {resolveComponent} />
</div>
