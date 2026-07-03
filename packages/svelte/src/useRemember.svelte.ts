import { cloneDeep } from 'es-toolkit'
import { useFrameRouter } from './frameContext.svelte'

export default function useRemember<State extends object>(initialState: State, key?: string): State {
  const frameRouter = useFrameRouter()
  const scopedKey = key ?? 'default'

  const restored = frameRouter.restore(scopedKey) as State | undefined
  const state = $state(restored !== undefined ? cloneDeep(restored) : initialState)

  $effect(() => {
    frameRouter.remember(cloneDeep($state.snapshot(state)), scopedKey)
  })

  return state
}
