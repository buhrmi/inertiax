import { type PollOptions, type ReloadOptions } from '@inertiajs/core'
import { onDestroy, onMount } from 'svelte'
import { useFrameRouter } from './frameContext.svelte'

export default function usePoll(
  interval: number,
  requestOptions: ReloadOptions | (() => ReloadOptions) = {},
  options: PollOptions = {
    keepAlive: false,
    autoStart: true,
  },
) {
  const frameRouter = useFrameRouter()

  const { stop, start, destroy } = frameRouter.poll(interval, requestOptions, {
    ...options,
    autoStart: false,
  })

  onMount(() => {
    if (options.autoStart ?? true) {
      start()
    }
  })

  onDestroy(() => {
    destroy()
  })

  return { stop, start }
}
