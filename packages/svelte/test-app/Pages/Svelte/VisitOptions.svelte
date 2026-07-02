<script lang="ts">
  import type { Page } from 'inertiax-core'
  import { Frame } from 'inertiax-svelte'
  import type { ResolvedComponent } from 'inertiax-svelte'
  import VisitOptionsPane from './VisitOptionsPane.svelte'

  const pages = import.meta.glob<ResolvedComponent>('./*.svelte', { eager: true })
  const paneComponent = { default: VisitOptionsPane } as ResolvedComponent

  const resolveComponent = (name: string) => {
    if (name === 'Svelte/VisitOptionsPane') {
      return pages['./VisitOptionsPane.svelte'] as ResolvedComponent
    }

    throw new Error(`Unknown frame component: ${name}`)
  }

  const defaultsPage: Page = {
    component: 'Svelte/VisitOptionsPane',
    props: { frame: 'defaults', step: 0, errors: {} },
    url: '/svelte/visit-options/defaults?step=0',
    version: null,
    rescuedProps: [],
    flash: {},
    rememberedState: {},
  }

  const explicitPushPage: Page = {
    component: 'Svelte/VisitOptionsPane',
    props: { frame: 'explicit-push', step: 0, errors: {} },
    url: '/svelte/visit-options/explicit-push?step=0',
    version: null,
    rescuedProps: [],
    flash: {},
    rememberedState: {},
  }

  const browserUrlPage: Page = {
    component: 'Svelte/VisitOptionsPane',
    props: { frame: 'browser-url', step: 0, errors: {} },
    url: '/svelte/visit-options/browser-url?step=0',
    version: null,
    rescuedProps: [],
    flash: {},
    rememberedState: {},
  }
</script>

<div>
  <h1>Svelte Visit Options</h1>

  <!-- Defaults to { replace: true } for non-top frames -->
  <section>
    <h2>Defaults Frame (replaces history)</h2>
    <Frame id="defaults" initialComponent={paneComponent} initialPage={defaultsPage} {resolveComponent} visitOptions={{ replace: true }} />
  </section>

  <!-- Explicit { replace: false } → pushes history, updateBrowserUrl stays false (non-top default) -->
  <section>
    <h2>Explicit-Push Frame (pushes history)</h2>
    <Frame id="explicit-push" initialComponent={paneComponent} initialPage={explicitPushPage} {resolveComponent} visitOptions={{ replace: false }} />
  </section>

  <!-- Explicit { replace: true, updateBrowserUrl: true } → updates browser URL -->
  <section>
    <h2>Browser-URL Frame (updates browser URL)</h2>
    <Frame id="browser-url" initialComponent={paneComponent} initialPage={browserUrlPage} {resolveComponent} visitOptions={{ replace: true, updateBrowserUrl: true }} />
  </section>
</div>
