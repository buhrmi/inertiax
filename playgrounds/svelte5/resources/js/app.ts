import { createInertiaApp } from 'inertiax-svelte'
import Layout from './Components/Layout.svelte'

createInertiaApp({
  layout: () => Layout,
})
