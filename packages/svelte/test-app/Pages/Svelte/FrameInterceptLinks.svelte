<script lang="ts">
  import type { Page } from 'inertiax-core'
  import { Frame } from 'inertiax-svelte'
  import type { ResolvedComponent } from 'inertiax-svelte'

  const pages = import.meta.glob<ResolvedComponent>('./*.svelte', { eager: true })

  const resolveComponent = (name: string) => {
    const resolved = pages[`./${name.split('/').pop()}.svelte`]

    if (!resolved) {
      throw new Error(`Unknown frame component: ${name}`)
    }

    return resolved
  }

  const panePage: Page = {
    component: 'Svelte/FrameInterceptLinksPane',
    props: {},
    url: '/svelte/frame-intercept-links/inner',
    version: null,
    rescuedProps: [],
    flash: {},
    rememberedState: {},
  }

  let { interceptLinks = true }: { interceptLinks?: boolean } = $props()
</script>

<div data-testid="frame-intercept-outer">Outer frame</div>

<Frame
  id="frame-intercept-inner"
  initialPage={panePage}
  {resolveComponent}
  {interceptLinks}
  visitOptions={{ replace: false }}
/>
