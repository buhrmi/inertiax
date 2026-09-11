<script lang="ts">
  import type { Page } from 'inertiax-core'
  import { Frame } from 'inertiax-svelte'
  import type { ResolvedComponent } from 'inertiax-svelte'
  import FrameDocumentScrollPane from './FrameDocumentScrollPane.svelte'

  const pages = import.meta.glob<ResolvedComponent>('./*.svelte', { eager: true })
  const paneComponent = { default: FrameDocumentScrollPane } as ResolvedComponent

  const resolveComponent = (name: string) => {
    if (name === 'Svelte/FrameDocumentScrollPane') {
      return pages['./FrameDocumentScrollPane.svelte'] as ResolvedComponent
    }
    throw new Error(`Unknown frame component: ${name}`)
  }

  const initialPage: Page = {
    component: 'Svelte/FrameDocumentScrollPane',
    props: { step: 0, errors: {} },
    url: '/svelte/frame-document-scroll/pane?step=0',
    version: null,
    rescuedProps: [],
    flash: {},
    rememberedState: {},
  }
</script>

<div data-testid="frame-document-scroll-page">
  <!--
    A nested frame that is NOT wrapped in a [scroll-region]. Navigating within
    it should reset the document scroll position, because the document is its
    effective scroll container.
  -->
  <Frame
    id="document-scroll-frame"
    initialComponent={paneComponent}
    initialPage={initialPage}
    {resolveComponent}
  />

  <!-- Tall spacer so the document itself is scrollable -->
  <div style="height: 3000px"></div>
</div>
