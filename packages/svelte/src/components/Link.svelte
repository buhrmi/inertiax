<script lang="ts">
  import { isUrlMethodPair, resolveUrlMethodPairComponent } from 'inertiax-core'
  import type { LinkComponentBaseProps } from 'inertiax-core'
  import { useFrameRouter } from '../frameContext.svelte'
  import { inertia } from '../index'

  interface Props {
    href?: LinkComponentBaseProps['href']
    as?: keyof HTMLElementTagNameMap
    data?: LinkComponentBaseProps['data']
    method?: LinkComponentBaseProps['method']
    replace?: LinkComponentBaseProps['replace']
    preserveScroll?: LinkComponentBaseProps['preserveScroll']
    preserveState?: LinkComponentBaseProps['preserveState'] | null
    preserveUrl?: LinkComponentBaseProps['preserveUrl']
    only?: LinkComponentBaseProps['only']
    except?: LinkComponentBaseProps['except']
    headers?: LinkComponentBaseProps['headers']
    queryStringArrayFormat?: LinkComponentBaseProps['queryStringArrayFormat']
    async?: LinkComponentBaseProps['async']
    prefetch?: LinkComponentBaseProps['prefetch']
    cacheFor?: LinkComponentBaseProps['cacheFor']
    cacheTags?: LinkComponentBaseProps['cacheTags']
    viewTransition?: LinkComponentBaseProps['viewTransition']
    component?: LinkComponentBaseProps['component']
    instant?: LinkComponentBaseProps['instant']
    pageProps?: LinkComponentBaseProps['pageProps']
    frame?: string
    children?: import('svelte').Snippet
    [key: string]: any
  }

  // Are these defined anywhere else?
  type Callbacks = {
    onfocus?: () => void
    onblur?: () => void
    onclick?: () => void
    ondblclick?: () => void
    onmousedown?: () => void
    onmousemove?: () => void
    onmouseout?: () => void
    onmouseover?: () => void
    onmouseup?: () => void
    'oncancel-token'?: () => void
    onbefore?: () => void
    onstart?: () => void
    onprogress?: () => void
    onfinish?: () => void
    oncancel?: () => void
    onsuccess?: () => void
    onerror?: () => void
    onprefetching?: () => void
    onprefetched?: () => void
  }

  let {
    href = '',
    as = 'a',
    data = {},
    method = 'get',
    replace = false,
    preserveScroll = false,
    preserveState = null,
    preserveUrl = false,
    only = [],
    except = [],
    headers = {},
    queryStringArrayFormat = 'brackets',
    async = false,
    prefetch = false,
    cacheFor = 0,
    cacheTags = [],
    viewTransition = false,
    component = undefined,
    instant = false,
    pageProps = null,
    frame = undefined,
    children,
    ...rest
  }: Props & Callbacks = $props()

  let _method = $derived(isUrlMethodPair(href) ? href.method : method)
  let _href = $derived(isUrlMethodPair(href) ? href.url : href)
  let resolvedComponent = $derived(
    component ? component : instant && isUrlMethodPair(href) ? resolveUrlMethodPairComponent(href) : null,
  )

  let asProp = $derived(_method !== 'get' ? 'button' : as.toLowerCase())
  let elProps = $derived(
    {
      a: { href: _href },
      button: { type: 'button' },
    }[asProp] || {},
  )

  const frameRouter = useFrameRouter()
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<svelte:element
  this={asProp}
  use:inertia={{
    ...(asProp !== 'a' ? { href: _href } : {}),
    data,
    method: _method,
    replace,
    preserveScroll,
    preserveState: preserveState ?? _method !== 'get',
    preserveUrl,
    only,
    except,
    headers,
    queryStringArrayFormat,
    async,
    prefetch,
    cacheFor,
    cacheTags,
    viewTransition,
    component: resolvedComponent,
    pageProps,
    frame,
    router: frameRouter,
  }}
  {...rest}
  {...elProps}
>
  {@render children?.()}
</svelte:element>
