<script lang="ts">
  import type { Page } from 'inertiax-core'
  import { Frame } from 'inertiax-svelte'
  import type { ResolvedComponent } from 'inertiax-svelte'
  import MultiFramePane from './MultiFramePane.svelte'

  const pages = import.meta.glob<ResolvedComponent>('./*.svelte', { eager: true })
  const paneComponent = { default: MultiFramePane } as ResolvedComponent

  const resolveComponent = (name: string) => {
    if (name === 'Svelte/MultiFramePane') {
      return pages['./MultiFramePane.svelte'] as ResolvedComponent
    }

    throw new Error(`Unknown frame component: ${name}`)
  }

  const leftPage: Page = {
    component: 'Svelte/MultiFramePane',
    props: { frame: 'left', step: 0, errors: {} },
    url: '/svelte/multi-frame/left?step=0',
    version: null,
    rescuedProps: [],
    flash: {},
    rememberedState: {},
  }

  const rightPage: Page = {
    component: 'Svelte/MultiFramePane',
    props: { frame: 'right', step: 0, errors: {} },
    url: '/svelte/multi-frame/right?step=0',
    version: null,
    rescuedProps: [],
    flash: {},
    rememberedState: {},
  }

  const { parentVar = Math.random() } = $props()
  $effect(() => {
    console.log(`Parent var: ${parentVar}`)
  })
</script>

<div>
  <h1>Svelte Multi Frame</h1>
  
  <section>
    <h2>Left Frame</h2>
    <Frame id="left" initialComponent={paneComponent} initialPage={leftPage} {resolveComponent} />
  </section>

  <section>
    <h2>Right Frame</h2>
    <Frame id="right" initialComponent={paneComponent} initialPage={rightPage} {resolveComponent} />
  </section>
</div>
