import { type Page, type PageProps, type SharedPageProps } from 'inertiax-core'
import { get } from 'svelte/store'
import { useFrameContext } from './frameContext.svelte'

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
  const context = useFrameContext()

  if (context) {
    return get(context.page) as SveltePage<TPageProps>
  }

  return page as SveltePage<TPageProps>
}

export default page
