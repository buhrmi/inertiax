# Inertia X

Inertia X is a fork of [Inertia](https://github.com/inertiajs/inertia) that adds additional features to the Svelte adapter.

Note: This is the documentation for the 3.x branch of Inertia X, which has not yet been released on NPM. To see the documentation for Inertia X based on Inertia 2.0, please see the current [master branch](https://github.com/buhrmi/inertiax/tree/master).

## Added feature: Frame Component

The `Frame` component enables multiple independent Inertia page regions on the same document.
Each frame owns its own router and page state, so links/forms inside one frame only update that frame.

The main use cases for this are modals, side panels, wizards, etc.

## Basic Usage

```svelte
<Frame id="sidebar" src="/app/sidebar">
  <p>Loading sidebar...</p>
</Frame>
```

## Using The Current Frame Router

Inside a component rendered by a `Frame`, use `useFrameRouter()` to access the router for that frame.

```svelte
<script lang="ts">
  import { useFrameRouter } from 'inertiax-svelte'

  const router = useFrameRouter()

  function nextStep() {
    router.get(`/wizard/step-2`)
  }
</script>

<button on:click={nextStep}>Next step</button>
```

If you need more than the router, `useFrameContext()` gives you the active frame id, router, resolver, and page accessors.

```svelte
<script lang="ts">
  import { useFrameContext } from 'inertiax-svelte'

  const {
    id,
    router,
    resolveComponent,
    getPage,
    setPage
  } = useFrameContext()
</script>
```

## Visiting A Different Frame

If you want to initiate a visit for another frame, pass that frame's id in the visit options.

```svelte
<script lang="ts">
  import { router } from 'inertiax-svelte'

  function openDetailsPanel(userId: number) {
    router.get(`/users/${userId}/details`, {}, { frameId: 'details' })
  }
</script>

<button on:click={() => openDetailsPanel(42)}>Open details</button>
```

This is useful when one frame controls another frame, for example a table in the main content area opening a side panel.

If you prefer explicit router instances, create one router per frame and reuse that same router anywhere you need to control it.

```svelte
<script lang="ts">
  import { createRouter, Frame } from 'inertiax-svelte'

  const detailsRouter = createRouter('details')

  function showUser(userId: number) {
    detailsRouter.visit(`/users/${userId}/details`)
  }
</script>

<button on:click={() => showUser(42)}>Show user</button>

<Frame id="details" router={detailsRouter} src="/users/42/details">
  <p>Loading details...</p>
</Frame>
```

By default, visits on non-top frames update that frame's history state without replacing the browser URL. If you want a frame visit to also update the address bar, pass `updateBrowserUrl: true` in the visit options.

---

## Upgrading from Inertia to Inertia X

### 1. Replace the packages

Remove the official Inertia packages and install Inertia X:

```bash
# npm
npm remove @inertiajs/svelte @inertiajs/vite @inertiajs/core
npm install inertiax-svelte inertiax-vite inertiax-core

# pnpm
pnpm remove @inertiajs/svelte @inertiajs/vite @inertiajs/core
pnpm add inertiax-svelte inertiax-vite inertiax-core
```

### 2. Update your imports

Find and replace all occurrences in your source files:

| Before | After |
|---|---|
| `from '@inertiajs/svelte'` | `from 'inertiax-svelte'` |
| `from '@inertiajs/core'` | `from 'inertiax-core'` |
| `from '@inertiajs/vite'` | `from 'inertiax-vite'` |

That's it. Now you're ready to use all the new features.
