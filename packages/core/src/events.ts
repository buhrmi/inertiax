import { GlobalEventDetails, GlobalEventNames, GlobalEventTrigger } from './types'

function fireEvent<TEventName extends GlobalEventNames>(
  name: TEventName,
  options: CustomEventInit<GlobalEventDetails<TEventName>>,
): boolean {
  return document.dispatchEvent(new CustomEvent(`inertia:${name}`, options))
}

export const fireBeforeEvent: GlobalEventTrigger<'before'> = (visit) => {
  return fireEvent('before', { cancelable: true, detail: { visit } }) && fireEvent(`${visit.frame}:before`, { cancelable: true, detail: { visit } })
}

export const fireErrorEvent: GlobalEventTrigger<'error'> = (errors, frame) => {
  return fireEvent('error', { detail: { errors } }) && fireEvent(`${frame}:error`, { detail: { errors } })
}

export const fireExceptionEvent: GlobalEventTrigger<'exception'> = (exception, frame) => {
  return fireEvent('exception', { cancelable: true, detail: { exception } }) && fireEvent(`${frame}:exception`, { cancelable: true, detail: { exception } })
}

export const fireFinishEvent: GlobalEventTrigger<'finish'> = (visit) => {
  return fireEvent('finish', { detail: { visit } }) && fireEvent(`${visit.frame}:finish`, { detail: { visit } })
}

export const fireInvalidEvent: GlobalEventTrigger<'invalid'> = (response, frame) => {
  return fireEvent('invalid', { cancelable: true, detail: { response } }) && fireEvent(`${frame}:invalid`, { cancelable: true, detail: { response } })
}

export const fireNavigateEvent: GlobalEventTrigger<'navigate'> = (page, frame) => {
  return fireEvent('navigate', { detail: { page } }) && fireEvent(`${frame}:navigate`, { detail: { page } })
}

export const fireProgressEvent: GlobalEventTrigger<'progress'> = (progress, frame) => {
  return fireEvent('progress', { detail: { progress } }) && fireEvent(`${frame}:progress`, { detail: { progress } })
}

export const fireStartEvent: GlobalEventTrigger<'start'> = (visit) => {
  return fireEvent('start', { detail: { visit } }) && fireEvent(`${visit.frame}:start`, { detail: { visit } })
}

export const fireSuccessEvent: GlobalEventTrigger<'success'> = (page, frame) => {
  return fireEvent('success', { detail: { page } }) && fireEvent(`${frame}:success`, { detail: { page } })
}

export const firePrefetchedEvent: GlobalEventTrigger<'prefetched'> = (response, visit) => {
  return fireEvent('prefetched', { detail: { fetchedAt: Date.now(), response: response.data, visit } }) &&
         fireEvent(`${visit.frame}:prefetched`, { detail: { fetchedAt: Date.now(), response: response.data, visit } })
}

export const firePrefetchingEvent: GlobalEventTrigger<'prefetching'> = (visit) => {
  return fireEvent('prefetching', { detail: { visit } }) && fireEvent(`${visit.frame}:prefetching`, { detail: { visit } })
}
