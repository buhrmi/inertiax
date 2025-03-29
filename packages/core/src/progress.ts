import ProgressComponent from './progress-component'
import { GlobalEvent } from './types'

let hideCount = 0

export const reveal = (force = false) => {
  hideCount = Math.max(0, hideCount - 1)

  if (force || hideCount === 0) {
    ProgressComponent.show()
  }
}

export const hide = () => {
  hideCount++

  ProgressComponent.hide()
}

function addEventListeners(delay: number): void {
  document.addEventListener('inertia:_top:start', ((e: Event) => start(e as GlobalEvent<'start'>, delay)) as EventListener)
  document.addEventListener('inertia:_top:progress', progress)
}

function start(event: GlobalEvent<'start'>, delay: number): void {
  if (!event.detail.visit.showProgress) {
    hide()
  }

  const timeout = setTimeout(() => ProgressComponent.start(), delay)
  document.addEventListener('inertia:_top:finish', ((e: Event) => finish(e as GlobalEvent<'finish'>, timeout)) as EventListener, { once: true })
}

function progress(event: Event): void {
  const customEvent = event as GlobalEvent<'progress'>
  if (ProgressComponent.isStarted() && customEvent.detail.progress?.percentage) {
    ProgressComponent.set(Math.max(ProgressComponent.status!, (customEvent.detail.progress.percentage / 100) * 0.9))
  }
}

function finish(event: GlobalEvent<'finish'>, timeout: NodeJS.Timeout): void {
  clearTimeout(timeout!)

  if (!ProgressComponent.isStarted()) {
    return
  }

  if (event.detail.visit.completed) {
    ProgressComponent.done()
  } else if (event.detail.visit.interrupted) {
    ProgressComponent.set(0)
  } else if (event.detail.visit.cancelled) {
    ProgressComponent.done()
    ProgressComponent.remove()
  }
}

export default function setupProgress({
  delay = 250,
  color = '#29d',
  includeCSS = true,
  showSpinner = false,
} = {}): void {
  addEventListeners(delay)
  ProgressComponent.configure({ showSpinner, includeCSS, color })
}
