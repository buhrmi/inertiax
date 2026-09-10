import adapter from '@sveltejs/adapter-auto'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  compilerOptions: {
    // `Frame` uses top-level `await` to resolve a frame's `initialPage`
    // component during SSR.
    experimental: { async: true },
  },
  kit: {
    adapter: adapter(),
  },
  files: {
    lib: 'src',
  },
}

export default config
