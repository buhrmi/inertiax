<script lang="ts">
  import type { Page } from 'inertiax-core'
  import type { ResolvedComponent } from 'inertiax-svelte'
  import { Frame } from 'inertiax-svelte'
  import FramePreserveUrlPane from './FramePreserveUrlPane.svelte'

  const pages = import.meta.glob<ResolvedComponent>('./*.svelte', { eager: true })
  const paneComponent = { default: FramePreserveUrlPane } as ResolvedComponent

  const resolveComponent = (name: string) => {
    if (name === 'Svelte/FramePreserveUrlPane') {
      return pages['./FramePreserveUrlPane.svelte'] as ResolvedComponent
    }

    throw new Error(`Unknown frame component: ${name}`)
  }

  const updatesPage: Page = {
    component: 'Svelte/FramePreserveUrlPane',
    props: { frame: 'updates', step: 0, errors: {} },
    url: '/svelte/frame-preserve-url/pane/updates?step=0',
    version: null,
    rescuedProps: [],
    flash: {},
    rememberedState: {},
  }

  const preservesPage: Page = {
    component: 'Svelte/FramePreserveUrlPane',
    props: { frame: 'preserves', step: 0, errors: {} },
    url: '/svelte/frame-preserve-url/pane/preserves?step=0',
    version: null,
    rescuedProps: [],
    flash: {},
    rememberedState: {},
  }
</script>

<div data-testid="frame-preserve-url-page">
  <h1>Frame Preserve URL</h1>

  <!-- updateBrowserUrl: true → a normal link updates the browser URL; data-preserve-url keeps it -->
  <section>
    <h2>Frame that updates the browser URL</h2>
    <Frame
      id="updates"
      initialComponent={paneComponent}
      initialPage={updatesPage}
      {resolveComponent}
      visitOptions={{ replace: true, updateBrowserUrl: true }}
    />
  </section>

  <!-- non-top default (updateBrowserUrl: false) → a normal link keeps the URL; data-preserve-url="false" updates it -->
  <section>
    <h2>Frame that keeps the browser URL</h2>
    <Frame id="preserves" initialComponent={paneComponent} initialPage={preservesPage} {resolveComponent} />
  </section>
</div>
