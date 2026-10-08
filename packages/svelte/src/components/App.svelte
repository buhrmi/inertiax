<script module lang="ts">
  import { type Page, type PageProps } from 'inertiax-core'
  import type { ComponentResolver, ResolvedComponent } from '../types'

  export interface InertiaAppProps<SharedProps extends PageProps = PageProps> {
    initialComponent: ResolvedComponent
    initialPage: Page<SharedProps>
    resolveComponent: ComponentResolver
    defaultLayout?: (name: string, page: Page) => unknown
    serverRendered?: boolean
  }
</script>

<script lang="ts">
  import { router } from 'inertiax-core'
  import { onMount } from 'svelte'
  import { DEFAULT_FRAME } from '../frameContext.svelte'
  import { setHydrationContext } from '../hydration'
  import Frame from './Frame.svelte'

  interface Props {
    initialComponent: InertiaAppProps['initialComponent']
    initialPage: InertiaAppProps['initialPage']
    resolveComponent: InertiaAppProps['resolveComponent']
    defaultLayout?: InertiaAppProps['defaultLayout']
    serverRendered?: boolean
  }

  const { initialComponent, initialPage, resolveComponent, defaultLayout, serverRendered = true }: Props = $props()

  const isServer = typeof window === 'undefined'

  // Scoped per app instance so multiple Inertia roots on one page don't clobber each other
  // svelte-ignore state_referenced_locally
  const hydration = $state({ hydrated: !serverRendered })
  setHydrationContext(hydration)

  if (!isServer) {
    onMount(() => (hydration.hydrated = true))
  }
</script>

<Frame
  id={DEFAULT_FRAME}
  {router}
  {initialComponent}
  {initialPage}
  {resolveComponent}
  {defaultLayout}
/>
