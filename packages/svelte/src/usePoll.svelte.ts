import { type PollOptions, type ReloadOptions } from 'inertiax-core'
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

  const autoStart = options.autoStart ?? true

  const { stop, start, destroy } = frameRouter.poll(interval, requestOptions, {
    ...options,
    autoStart: false,
  })

  let polling = $state(autoStart)

  onMount(() => {
    if (autoStart) {
      start()
    }
  })

  onDestroy(() => {
    destroy()
  })

  return {
    get polling() {
      return polling
    },
    stop() {
      stop()
      polling = false
    },
    start() {
      start()
      polling = true
    },
  }
}
