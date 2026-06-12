# Inertia X

Inertia X is a fork of [Inertia](https://github.com/inertiajs/inertia) that adds a handful new features to the Svelte adapter, including the `<Frame>` component.

The `Frame` component enables multiple independent Inertia page regions on the same document, where each frame owns its own router and page state, so links/forms inside one frame only update that frame. The main use cases for this are modals, side bars, dialogs, etc. You get the idea.

In addition to the Frame component, it also introduces a [global click handler](https://github.com/buhrmi/inertiax#global-click-handler).

You might also want to check out [Inertia X UI](https://github.com/buhrmi/inertiax-ui), a companion UI library featuring Svelte components built on Inertia X.

## Basic Usage

```svelte
<script>
  import { Frame } from 'inertiax-svelte'
</script>

<Frame id="sidebar" src="/users/42/edit">
  <p>Loading user...</p>
</Frame>
```

### Accessing the router

Within a frame, you can call `useFrameRouter()` to access its router. The global top-level router is still available via `import { router } from 'inertiax-svelte'`.

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

You can also access it along with the frame's page store via the frame context:

```svelte
<script>
  import { useFrameContext } from 'inertiax-svelte'

  const { id, page, router} = useFrameContext()
</script>
```

### Visiting A Different Frame

If you want to initiate a visit for another frame, pass that frame's id in the visit options:

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

### Frame Props

Here is a list of all available props on the Frame component:


| Prop | Type | Description |
|---|---|---|
| `id` | `string` | Unique frame id. Used for routing/history isolation and for targeting visits via `frameId`. If omitted, top frame uses `'_top'`; nested frames get an auto-generated id. |
| `src` | `string` | URL to load when the frame mounts (useful for lazy-loading frame content). |
| `router` | `Router` | Optional router instance to control this frame. If omitted, the frame creates its own router with the frame id. |
| `initialComponent` | `ResolvedComponent` | Initial resolved component to render before or without loading from `src`. |
| `initialPage` | `Page` | Initial Inertia page payload for the frame. |
| `resolveComponent` | `ComponentResolver` | Component resolver for frame pages. Required unless inherited from a parent frame context. |
| `defaultLayout` | `(name: string, page: Page) => unknown` | Fallback layout resolver used when the page does not provide its own layout. |
| `renderLayout` | `boolean` | Controls whether page layouts are applied inside this frame. Defaults to `true` for the top frame and `false` for nested frames. |
| `onClickLink` | `(event: MouseEvent, href: string) => void` | Called when a plain same-origin `<a>` inside the frame is clicked. Call `event.preventDefault()` to stop the default frame navigation. |
| `children` | `Snippet` | Fallback/loading content rendered when no frame page is available yet. |

All other props (restProps) are being passed to the rendered page component.

## Redirections within Frames

Inertia X introduces two requests headers and one response header to make it easier to handle redirections within frames.  

To enable server-side `redirect_back` functionality within frames, Inertia X sends an `X-Inertia-Referer` header containing the `src` URL of the initiating frame. Use this URL instead of the standard referer header when generating your 30X response, to redirect the frame back to the previous page.

Inertia X also sends an `X-Inertia-Frame` request header on every request. Its value is the ID of the **originating frame** — the frame whose router called `visit()`.

This is useful server-side when you need to know which frame triggered the request (e.g. to route a redirect back to the correct frame).

### Routing the response to a specific frame

By default the response is applied to whatever frame was set in `visitOptions.frameId`. If you return an `X-Inertia-Frame` **response** header the client will apply the response to the named frame instead, overriding `visitOptions.frameId`.

A common use-case is validation errors: when a form inside a modal frame submits to an action that might succeed in a different frame (e.g. updating the page behind the modal), but the server returns validation errors, you want those errors to appear in the originating modal frame, not the target frame.


## Global Click handler

Inertia X adds a global click handler that automatically intercepts plain `<a>` clicks within a frame and performs a frame-scoped Inertia visit.

This means you can often use regular anchor tags inside a frame without manually calling `router.visit(...)`.

### What gets intercepted

- Same-origin links inside the frame
- Left-clicks without modifier keys (Ctrl/Cmd/Alt/Shift)
- Clicks that don't have their default prevented

### What is ignored

- Links without `href`
- Fragment links (`#...`)
- `mailto:` / `tel:` links
- Links with `target`
- Links with `download`
- Links with `data-inertia-ignore`
- Cross-origin links

### Opt out per-link

If you want native browser navigation for a specific link, add `data-inertia-ignore`:

```svelte
<a href="/non-inertia" data-inertia-ignore>Open outside Inertia</a>
```

### Customize behavior with `onClickLink`

Use `onClickLink` to inspect or override the default handling. If you call `event.preventDefault()` in this callback, Frame will not perform `frameRouter.visit(...)`.

```svelte
<script lang="ts">
  import { Frame } from 'inertiax-svelte'

  function onClickLink(event: MouseEvent, href: string) {
    if (href.startsWith('/admin')) {
      event.preventDefault()
      // custom logic
    }
  }
</script>

<Frame id="sidebar" src="/users/42/edit" {onClickLink} />
```

## Installation

To use Inertia X, you just have to replace 

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
