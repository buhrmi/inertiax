<script lang="ts">
  import type { Page } from 'inertiax-core'
  import { Frame, useFrameRouter } from 'inertiax-svelte'
  import type { ResolvedComponent } from 'inertiax-svelte'
  import InertiaFramePane from './InertiaFramePane.svelte'

  const pages = import.meta.glob<ResolvedComponent>('./*.svelte', { eager: true })

  const resolveComponent = (name: string) => {
    if (name === 'Svelte/InertiaFramePane') {
      return pages['./InertiaFramePane.svelte'] as ResolvedComponent
    }
    throw new Error(`Unknown frame component: ${name}`)
  }

  const leftPage: Page = {
    component: 'Svelte/InertiaFramePane',
    props: { frame: 'left', message: 'initial', errors: {} },
    url: '/svelte/inertia-frame-header/left',
    version: null,
    rescuedProps: [],
    flash: {},
    rememberedState: {},
  }

  const rightPage: Page = {
    component: 'Svelte/InertiaFramePane',
    props: { frame: 'right', message: 'initial', errors: {} },
    url: '/svelte/inertia-frame-header/right',
    version: null,
    rescuedProps: [],
    flash: {},
    rememberedState: {},
  }
</script>

<div>
  <h1>Inertia Frame Header Test</h1>

  <section>
    <h2>Left Frame</h2>
    <Frame id="left" initialComponent={{ default: InertiaFramePane } as ResolvedComponent} initialPage={leftPage} {resolveComponent} />
  </section>

  <section>
    <h2>Right Frame</h2>
    <Frame id="right" initialComponent={{ default: InertiaFramePane } as ResolvedComponent} initialPage={rightPage} {resolveComponent} />
  </section>
</div>
