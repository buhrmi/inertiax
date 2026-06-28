import { getContext, hasContext, setContext } from 'svelte'
import { router as globalRouter, type Router, type VisitOptions } from 'inertiax-core'
import type { Page } from 'inertiax-core'
import type { Readable } from 'svelte/store'
import type { ComponentResolver } from './types'

export const DEFAULT_FRAME_ID = '_top'

export type FrameContext = {
  id: string
  router: Router
  resolveComponent?: ComponentResolver
  page: Readable<Page>
  visitOptions: VisitOptions
}

const FRAME_CONTEXT_KEY = Symbol('inertia:frame-context')
let globalResolveComponent: ComponentResolver | undefined

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

export function useFrameId(): string {
  return useFrameContext()?.id ?? DEFAULT_FRAME_ID
}
