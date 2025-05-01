// The actual event passed to this function could be a native JavaScript event
// or a React synthetic event, so we are picking just the keys needed here (that
// are present in both types).

export default function shouldIntercept(
  event: Pick<
    MouseEvent,
    'altKey' | 'ctrlKey' | 'defaultPrevented' | 'target' | 'currentTarget' | 'metaKey' | 'shiftKey' | 'button'
  >,
): boolean {
  const href = ((event.target as HTMLElement).closest('[href]') as HTMLElement)?.getAttribute('href')

  return !(
    !href ||
    !href.startsWith('/') && !href.startsWith(window.location.origin) ||
    (event.target && (event?.target as HTMLElement).isContentEditable) ||
    event.defaultPrevented ||
    (href && event.altKey) ||
    (href && event.ctrlKey) ||
    (href && event.metaKey) ||
    (href && event.shiftKey) ||
    (href && 'button' in event && event.button !== 0)
  )
}
