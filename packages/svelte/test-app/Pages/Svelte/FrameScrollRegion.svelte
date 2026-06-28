<script lang="ts">
  import type { Page } from 'inertiax-core'
  import { Frame } from 'inertiax-svelte'
  import type { ResolvedComponent } from 'inertiax-svelte'
  import FrameScrollRegionPane from './FrameScrollRegionPane.svelte'

  const pages = import.meta.glob<ResolvedComponent>('./*.svelte', { eager: true })
  const paneComponent = { default: FrameScrollRegionPane } as ResolvedComponent

  const resolveComponent = (name: string) => {
    if (name === 'Svelte/FrameScrollRegionPane') {
      return pages['./FrameScrollRegionPane.svelte'] as ResolvedComponent
    }
    throw new Error(`Unknown frame component: ${name}`)
  }

  const initialPage: Page = {
    component: 'Svelte/FrameScrollRegionPane',
    props: { step: 0, errors: {} },
    url: '/svelte/frame-scroll-region/pane?step=0',
    version: null,
    rescuedProps: [],
    flash: {},
    rememberedState: {},
  }
</script>

<div>
  <h1>Frame Scroll Region</h1>

  <!-- scroll-region wrapping the frame -->
  <div
    data-testid="scroll-region"
    scroll-region
    style="height: 400px; overflow-y: auto; border: 2px solid red;"
  >
    <Frame id="scroll-frame" initialComponent={paneComponent} initialPage={initialPage} {resolveComponent} />
  </div>
</div>
