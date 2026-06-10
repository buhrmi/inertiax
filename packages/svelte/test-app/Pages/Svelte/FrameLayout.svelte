<script module lang="ts">
  import FrameLayoutTopLayout from './FrameLayoutTopLayout.svelte'

  export const layout = FrameLayoutTopLayout
</script>

<script lang="ts">
  import type { Page } from 'inertiax-core'
  import { Frame } from 'inertiax-svelte'
  import type { ResolvedComponent } from 'inertiax-svelte'

  const pages = import.meta.glob<ResolvedComponent>('./*.svelte', { eager: true })

  const resolvePaneComponent = (name: string) => {
    if (name === 'Svelte/FrameLayoutPane') {
      return pages['./FrameLayoutPane.svelte'] as ResolvedComponent
    }

    throw new Error(`Unknown frame component: ${name}`)
  }

  const panePage: Page = {
    component: 'Svelte/FrameLayoutPane',
    props: { errors: {} },
    url: '/svelte/frame-layout/pane',
    version: null,
    rescuedProps: [],
    flash: {},
    rememberedState: {},
  }
</script>

<div data-testid="top-frame-page">Top Frame Page</div>
<Frame id="nested-layout-test" initialPage={panePage} resolveComponent={resolvePaneComponent} forwardedMessage="Forwarded from Frame" />
