import { cloneDeep } from 'es-toolkit'
import { useFrameId, useFrameRouter } from './frameContext.svelte'

export default function useRemember<State extends object>(initialState: State, key?: string): State {
  const frameRouter = useFrameRouter()
  const frameId = useFrameId()
  const scopedKey = `${frameId}:${key ?? 'default'}`

  const restored = frameRouter.restore(scopedKey) as State | undefined
  const state = $state(restored !== undefined ? cloneDeep(restored) : initialState)

  $effect(() => {
    frameRouter.remember(cloneDeep($state.snapshot(state)), scopedKey)
  })

  return state
}
