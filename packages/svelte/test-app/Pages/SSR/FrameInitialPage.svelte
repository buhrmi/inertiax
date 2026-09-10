<script lang="ts">
  import type { Page } from 'inertiax-core'
  import { Frame } from 'inertiax-svelte'

  const panePage: Page = {
    component: 'SSR/FrameInitialPane',
    props: { message: 'Rendered from initialPage' },
    url: '/ssr/frame-initial-page/pane',
    version: null,
    rescuedProps: [],
    flash: {},
    rememberedState: {},
  }
</script>

<div data-testid="frame-initial-page-top">Top frame</div>

<!-- No `initialComponent` and no local resolver: the frame has to resolve the
     async app-level resolver from `initialPage`. -->
<Frame id="initial-page-frame" initialPage={panePage} />
