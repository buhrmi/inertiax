import { GlobalEventDetails, GlobalEventNames, GlobalEventTrigger } from './types'

function fireEvent<TEventName extends GlobalEventNames>(
  name: TEventName,
  options: CustomEventInit<GlobalEventDetails<TEventName>>,
): boolean {
  return document.dispatchEvent(new CustomEvent(`inertia:${name}`, options))
}

export const fireBeforeEvent: GlobalEventTrigger<'before'> = (visit) => {
  return fireEvent('before', { cancelable: true, detail: { visit } })
}

export const fireErrorEvent = (errors: any, frame: string, { page, visitId }: any = {}) => {
  return fireEvent('error', { detail: { errors, frame, page, visitId } })
}

export const fireNetworkErrorEvent = (error: any, frame: string) => {
  return fireEvent('networkError', { cancelable: true, detail: { error, frame } })
}

export const fireFinishEvent: GlobalEventTrigger<'finish'> = (visit) => {
  return fireEvent('finish', { detail: { visit } })
}

export const fireHttpExceptionEvent = (response: any, frame: string) => {
  return fireEvent('httpException', { cancelable: true, detail: { response, frame } })
}

export const fireBeforeUpdateEvent = (page: any, frame: string) => {
  return fireEvent('beforeUpdate', { detail: { page, frame } })
}

export const fireNavigateEvent = (page: any, frame: string, { cached = false, visitId }: any = {}) => {
  return fireEvent('navigate', { detail: { page, frame, cached, visitId } })
}

export const fireClientVisitEvent = (page: any, frame: string, { replace, visitId }: any) => {
  return fireEvent('clientVisit', { detail: { page, frame, replace, visitId } })
}

export const fireProgressEvent = (progress: any, frame: string) => {
  return fireEvent('progress', { detail: { progress, frame } })
}

export const fireStartEvent: GlobalEventTrigger<'start'> = (visit) => {
  return fireEvent('start', { detail: { visit } })
}

export const fireSuccessEvent = (page: any, frame: string, { visitId }: any = {}) => {
  return fireEvent('success', { detail: { page, frame, visitId } })
}

export const firePrefetchedEvent: GlobalEventTrigger<'prefetched'> = (response, visit) => {
  return fireEvent('prefetched', { detail: { fetchedAt: Date.now(), response, visit } })
}

export const firePrefetchingEvent: GlobalEventTrigger<'prefetching'> = (visit) => {
  return fireEvent('prefetching', { detail: { visit } })
}

export const fireFlashEvent = (flash: any, frame: string) => {
  return fireEvent('flash', { detail: { flash, frame } })
}

export const fireLocationEvent = (url: any, versionChange: any, frame: string) => {
  return fireEvent('location', { cancelable: true, detail: { url, versionChange, frame } })
}
