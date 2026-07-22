import { type Page, type PageProps, type SharedPageProps } from 'inertiax-core'
import { get } from 'svelte/store'
import { DEFAULT_FRAME, useFrameContext } from './frameContext.svelte'

type SveltePage<TPageProps extends PageProps = PageProps> = Omit<Page<TPageProps & SharedPageProps>, 'props'> & {
  props: Page<TPageProps & SharedPageProps>['props'] & {
    [key: string]: any
  }
}

const page = $state<SveltePage>({
  component: '',
  props: {},
  url: '',
  version: null,
} as SveltePage)

export function setPage(newPage: SveltePage) {
  Object.assign(page, newPage)
}

export function usePage<TPageProps extends PageProps = PageProps>(): SveltePage<TPageProps> {
    const context = useFrameContext();
    // Default (top) frame or no frame context: return globally-synced $state
    // page. The top-level Frame.svelte already syncs its page to this global
    // $state via $effect.pre → setPage(), so it's always up to date.
    if (!context || context.id === DEFAULT_FRAME) {
        return page as SveltePage<TPageProps>;
    }
    // Nested frame: return current value from the frame-scoped store.
    // Note: this returns a snapshot — reactive updates within nested frames
    // require subscribing to the store via $page or $effect.
    return get(context.page) as SveltePage<TPageProps>;
}

export default page
