import inertia from 'inertiax-vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    minify: false,
    emptyOutDir: false,
  },
  resolve: {
    alias: {
      '@': __dirname,
    },
  },
  plugins: [
    inertia({
      ssr: {
        port: 13720,
      },
    }),
    svelte({
      compilerOptions: {
        experimental: {
          // `Frame` uses top-level `await` to resolve a frame's `initialPage`
          // component during SSR.
          async: true,
        },
      },
    }),
  ],
})
