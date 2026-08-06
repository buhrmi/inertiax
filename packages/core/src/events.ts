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

export const fireErrorEvent: GlobalEventTrigger<'error'> = (errors, frame, { page, visitId } = {}) => {
  return fireEvent('error', { detail: { errors, frame, page, visitId } })
}

export const fireNetworkErrorEvent: GlobalEventTrigger<'networkError'> = (error) => {
  return fireEvent('networkError', { cancelable: true, detail: { error } })
}

export const fireFinishEvent: GlobalEventTrigger<'finish'> = (visit) => {
  return fireEvent('finish', { detail: { visit } })
}

export const fireHttpExceptionEvent: GlobalEventTrigger<'httpException'> = (response) => {
  return fireEvent('httpException', { cancelable: true, detail: { response } })
}

export const fireBeforeUpdateEvent: GlobalEventTrigger<'beforeUpdate'> = (page, frame) => {
  return fireEvent('beforeUpdate', { detail: { page, frame } })
}

export const fireNavigateEvent: GlobalEventTrigger<'navigate'> = (page, frame, { cached = false, visitId } = {}) => {
  return fireEvent('navigate', { detail: { page, frame, cached, visitId } })
}

export const fireClientVisitEvent: GlobalEventTrigger<'clientVisit'> = (page, frame, { replace, visitId }) => {
  return fireEvent('clientVisit', { detail: { page, frame, replace, visitId } })
}

export const fireProgressEvent: GlobalEventTrigger<'progress'> = (progress) => {
  return fireEvent('progress', { detail: { progress } })
}

export const fireStartEvent: GlobalEventTrigger<'start'> = (visit) => {
  return fireEvent('start', { detail: { visit } })
}

export const fireSuccessEvent: GlobalEventTrigger<'success'> = (page, frame, { visitId } = {}) => {
  return fireEvent('success', { detail: { page, frame, visitId } })
}

export const firePrefetchedEvent: GlobalEventTrigger<'prefetched'> = (response, visit) => {
  return fireEvent('prefetched', { detail: { fetchedAt: Date.now(), response, visit } })
}

export const firePrefetchingEvent: GlobalEventTrigger<'prefetching'> = (visit) => {
  return fireEvent('prefetching', { detail: { visit } })
}

export const fireFlashEvent: GlobalEventTrigger<'flash'> = (flash, frame) => {
  return fireEvent('flash', { detail: { flash, frame } })
}

export const fireLocationEvent: GlobalEventTrigger<'location'> = (url, versionChange) => {
  return fireEvent('location', { cancelable: true, detail: { url, versionChange } })
}
