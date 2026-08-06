<script lang="ts">
  import { createRouter, router } from 'inertiax-core'
  import { Frame } from 'inertiax-svelte'
  import type { ResolvedComponent } from 'inertiax-svelte'

  const pages = import.meta.glob<ResolvedComponent>('./*.svelte', { eager: true })

  const resolveComponent = (name: string) => {
    if (name === 'Svelte/FrameEventsPane') {
      return pages['./FrameEventsPane.svelte'] as ResolvedComponent
    }
    throw new Error(`Unknown frame component: ${name}`)
  }

  let topCount = $state(0)
  let leftCount = $state(0)
  let rightCount = $state(0)

  const leftRouter = createRouter('left')
  const rightRouter = createRouter('right')

  router.on('success', () => { topCount++ })
  leftRouter.on('success', () => { leftCount++ })
  rightRouter.on('success', () => { rightCount++ })
</script>

<div data-testid="frame-events-host">
  <span data-testid="top-count">{topCount}</span>
  <span data-testid="left-count">{leftCount}</span>
  <span data-testid="right-count">{rightCount}</span>

  <Frame id="left" src="/svelte/frame-events/left" router={leftRouter} {resolveComponent} />
  <Frame id="right" src="/svelte/frame-events/right" router={rightRouter} {resolveComponent} />
</div>
