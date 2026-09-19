import { getContext, hasContext, setContext } from 'svelte'
import { router as globalRouter, type Router, type VisitOptions } from 'inertiax-core'
import type { Page } from 'inertiax-core'
import type { Readable } from 'svelte/store'
import type { ComponentResolver } from './types'

export const DEFAULT_FRAME = '_top'

export type FrameContext = {
  id: string
  router: Router
  resolveComponent?: ComponentResolver
  page: Readable<Page>
  visitOptions: VisitOptions
}

const FRAME_CONTEXT_KEY = Symbol('inertia:frame-context')
let globalResolveComponent: ComponentResolver | undefined

// Resolved visit options per frame id. Lets a link that targets another frame
// via `data-frame` use that frame's options as its defaults.
const registeredFrameVisitOptions = new Map<string, VisitOptions>()

export function registerFrameVisitOptions(id: string, options: VisitOptions): () => void {
  registeredFrameVisitOptions.set(id, options)

  return () => {
    if (registeredFrameVisitOptions.get(id) === options) {
      registeredFrameVisitOptions.delete(id)
    }
  }
}

export function useFrameVisitOptions(id: string): VisitOptions | undefined {
  return registeredFrameVisitOptions.get(id)
}

export function setFrameContext(context: FrameContext): void {
  setContext(FRAME_CONTEXT_KEY, context)
}

export function useFrameContext(): FrameContext | null {
  return hasContext(FRAME_CONTEXT_KEY) ? getContext<FrameContext>(FRAME_CONTEXT_KEY) : null
}

export function useFrameRouter(): Router {
  return useFrameContext()?.router ?? globalRouter
}

export function useFrameResolveComponent(): ComponentResolver | undefined {
  return useFrameContext()?.resolveComponent
}

export function setGlobalResolveComponent(resolveComponent: ComponentResolver | undefined): void {
  globalResolveComponent = resolveComponent
}

export function useGlobalResolveComponent(): ComponentResolver | undefined {
  return globalResolveComponent
}

export function useFrame(): string {
  return useFrameContext()?.id ?? DEFAULT_FRAME
}
