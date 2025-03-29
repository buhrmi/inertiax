// The actual event passed to this function could be a native JavaScript event
// or a React synthetic event, so we are picking just the keys needed here (that
// are present in both types).

export default function shouldIntercept(
  event: Pick<
    MouseEvent,
    'altKey' | 'ctrlKey' | 'defaultPrevented' | 'target' | 'currentTarget' | 'metaKey' | 'shiftKey' | 'button'
  >,
): boolean {
  const hasHref = ((event.target as HTMLElement).closest('[href]') as HTMLElement)?.hasAttribute('href')

  return !(
    (event.target && (event?.target as HTMLElement).isContentEditable) ||
    event.defaultPrevented ||
    (hasHref && event.altKey) ||
    (hasHref && event.ctrlKey) ||
    (hasHref && event.metaKey) ||
    (hasHref && event.shiftKey) ||
    (hasHref && 'button' in event && event.button !== 0)
  )
}
