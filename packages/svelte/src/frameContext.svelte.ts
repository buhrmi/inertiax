import { getContext, hasContext, setContext } from 'svelte'
import { router as globalRouter, type Router } from '@inertiajs/core'
import type { Page } from '@inertiajs/core'
import type { ComponentResolver } from './types'

export const DEFAULT_FRAME_ID = '_top'

export type FrameContext = {
  id: string
  router: Router
  resolveComponent?: ComponentResolver
  getPage: () => Page
  setPage: (page: Page) => void
}

const FRAME_CONTEXT_KEY = Symbol('inertia:frame-context')

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

export function useFrameId(): string {
  return useFrameContext()?.id ?? DEFAULT_FRAME_ID
}
