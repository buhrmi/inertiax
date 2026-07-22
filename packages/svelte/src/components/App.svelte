<script module lang="ts">
  import { type Page, type PageProps } from 'inertiax-core'
  import type { ComponentResolver, ResolvedComponent } from '../types'

  export interface InertiaAppProps<SharedProps extends PageProps = PageProps> {
    initialComponent: ResolvedComponent
    initialPage: Page<SharedProps>
    resolveComponent: ComponentResolver
    defaultLayout?: (name: string, page: Page) => unknown
  }
</script>

<script lang="ts">
  import { router } from 'inertiax-core'
  import { DEFAULT_FRAME } from '../frameContext.svelte'
  import Frame from './Frame.svelte'

  interface Props {
    initialComponent: InertiaAppProps['initialComponent']
    initialPage: InertiaAppProps['initialPage']
    resolveComponent: InertiaAppProps['resolveComponent']
    defaultLayout?: InertiaAppProps['defaultLayout']
  }

  const { initialComponent, initialPage, resolveComponent, defaultLayout }: Props = $props()
</script>

<Frame
  id={DEFAULT_FRAME}
  {router}
  {initialComponent}
  {initialPage}
  {resolveComponent}
  {defaultLayout}
/>
