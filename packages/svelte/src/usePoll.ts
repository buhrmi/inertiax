import { type PollOptions, type ReloadOptions, type Context } from 'inertiax-core'
import { onDestroy, onMount, getContext } from 'svelte'


export default function usePoll(
  interval: number,
  requestOptions: ReloadOptions = {},
  options: PollOptions = {
    keepAlive: false,
    autoStart: true,
  },
) {
  const { router } = getContext<Context>('inertia')

  const { stop, start } = router.poll(interval, requestOptions, {
    ...options,
    autoStart: false,
  })

  onMount(() => {
    if (options.autoStart ?? true) {
      start()
    }
  })

  onDestroy(() => {
    stop()
  })

  return { stop, start }
}
