<script lang="ts">
  import { type ReloadOptions } from 'inertiax-core'
  import { onDestroy, onMount, getContext } from 'svelte'

  export let data: string | string[] = ''
  export let params: ReloadOptions = {}
  export let buffer: number = 0
  export let as: keyof HTMLElementTagNameMap = 'div'
  export let always: boolean = false

  const { router } = getContext('inertia')

  let loaded = false
  let fetching = false
  let el: HTMLElement
  let observer: IntersectionObserver | null = null

  onMount(() => {
    if (!el) {
      return
    }

    observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) {
          return
        }

        if (!always) {
          observer?.disconnect()
        }

        if (fetching) {
          return
        }

        fetching = true

        const reloadParams = getReloadParams()

        router.reload({
          ...reloadParams,
          onStart: (event) => {
            fetching = true
            reloadParams.onStart?.(event)
          },
          onFinish: (event) => {
            loaded = true
            fetching = false
            reloadParams.onFinish?.(event)
          },
        })
      },
      {
        rootMargin: `${buffer}px`,
      },
    )

    observer.observe(el)
  })

  onDestroy(() => {
    observer?.disconnect()
  })

  function getReloadParams(): Partial<ReloadOptions> {
    if (data !== '') {
      return {
        only: (Array.isArray(data) ? data : [data]) as string[],
      }
    }

    if (!params.data) {
      throw new Error('You must provide either a `data` or `params` prop.')
    }

    return params
  }
</script>

{#if always || !loaded}
  <svelte:element this={as} bind:this={el} />
{/if}

{#if loaded}
  <slot />
{:else if $$slots.fallback}
  <slot name="fallback" />
{/if}
