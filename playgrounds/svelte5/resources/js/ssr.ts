import { createInertiaApp, type ResolvedComponent } from 'inertiax-svelte'
import createServer from 'inertiax-svelte/server'

createServer((page) =>
  createInertiaApp({
    page,
    resolve: (name) => {
      const pages = import.meta.glob<ResolvedComponent>('./Pages/**/*.svelte', { eager: true })
      return pages[`./Pages/${name}.svelte`]
    },
  }),
)
