import inertia from 'inertiax-vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'
import laravel from 'laravel-vite-plugin'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    minify: false,
  },
  plugins: [
    laravel({
      input: ['resources/css/app.css', 'resources/js/app.ts'],
      refresh: true,
    }),
    inertia(),
    svelte({
      compilerOptions: {
        // `Frame` uses top-level `await` to resolve a frame's `initialPage`
        // component during SSR.
        experimental: { async: true },
      },
    }),
    tailwindcss(),
  ],
})
