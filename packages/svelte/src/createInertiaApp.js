import { router, setupProgress } from 'inertiax-core'
import escape from 'html-escape'
import { render } from 'svelte/server';
import App from './App.svelte'
import store from './store'

export default async function createInertiaApp({ id = 'app', resolve, setup, progress = {}, page }) {
  const isServer = typeof window === 'undefined'
  const el = isServer ? null : document.getElementById(id)
  const initialPage = page || JSON.parse(el.dataset.page)
  const resolveComponent = (name) => Promise.resolve(resolve(name))

  await resolveComponent(initialPage.component).then((initialComponent) => {
    store.set({
      component: initialComponent,
      page: initialPage,
    })
  })

  if (isServer) {
    const { html, head } = render(App)

    return {
      body: `<div data-server-rendered="true" id="${id}" data-page="${escape(JSON.stringify(initialPage))}">${html}</div>`,
      head: [
        head
      ],
    }
  }

  router.init({
    initialPage,
    resolveComponent,
    swapComponent: async ({ component, page, preserveState }) => {
      const targetFrame = page.target
      if (targetFrame) store.update((current) => ({
        ...current,
        frames: { ...current.frames, [targetFrame]: {component, props: page.props} }
      }))
      else store.update((current) => ({
        component,
        page,
        frames: current.frames,
        key: preserveState ? current.key : Date.now(),
      }))
    },
  })

  if (progress) {
    setupProgress(progress)
  }

  return setup({
    el,
    App,
    props: {
      initialPage,
      resolveComponent,
    },
  })

}
