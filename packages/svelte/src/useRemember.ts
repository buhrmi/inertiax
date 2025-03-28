import { onDestroy, getContext } from 'svelte'
import { writable } from 'svelte/store'

export default function useRemember<State>(initialState: State, key?: string) {
  const { router } = getContext('inertia')
  const restored = router.restore(key) as State | undefined
  const store = writable(restored !== undefined ? restored : initialState)
  const unsubscribe = store.subscribe((state) => router.remember(state, key))

  onDestroy(unsubscribe)

  return store
}
