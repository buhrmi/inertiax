![X](https://github.com/buhrmi/inertiax-ui/blob/main/playground/public/logo.png?raw=true)

# Inertia X

Inertia X is a fork of [Inertia.js](https://inertiajs.com/) that adds multi-frame support and a global click handler to the Svelte adapter.

## What is Inertia.js?

[Inertia.js](https://inertiajs.com/) lets you build single-page apps using classic server-side routing and controllers — no API needed. You write server-rendered pages like you always have, and Inertia handles the client-side navigation, component swapping, and history management. Think of it as the glue between your server-side framework (Laravel, Rails, etc.) and your Svelte components.

## What does Inertia X add?

- **`<Frame>` component** — multiple independent Inertia page regions on the same document. Each frame has its own router, history, and page state. Links and forms inside one frame only update that frame. Use cases: modals, sidebars, slide-out panels, multi-pane layouts.
- **Global click handler** — plain `<a>` clicks inside a frame are automatically intercepted and turned into frame-scoped Inertia visits. No need to wrap every link in a `<Link>` component.
- **`visitOptions` prop** — set default visit behavior per frame (replace vs push, scroll preservation, URL updates).
- **History-aware mount** — by default, a Frame restores its previous page and scroll position from the browser history stack on mount. This means frame state survives browser reloads and remounts with the same `src`. Opt out with `skipHistoryRestore`.

You might also want to check out [Inertia X UI](https://github.com/buhrmi/inertiax-ui), a companion UI library featuring Svelte components built on Inertia X.

## Installation

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

## &lt;Frame&gt; component

```svelte
<script>
  import { Frame } from 'inertiax-svelte'
</script>

<Frame id="sidebar" src="/users/42/edit">
  <p>Loading user...</p>
</Frame>
```

### Frame Props

| Prop | Type | Description |
|---|---|---|
| `id` | `string` | `src` value, then auto-generated | Unique frame id. Deterministic when derived from `src` — frames with the same `src` share history state across remounts. |
| `src` | `string` | URL to load when the frame mounts (useful for lazy-loading frame content). |
| `router` | `Router` | Optional router instance to control this frame. If omitted, the frame creates its own router with the frame id. |
| `initialComponent` | `ResolvedComponent` | Initial resolved component to render before or without loading from `src`. |
| `initialPage` | `Page` | Initial Inertia page payload for the frame. |
| `resolveComponent` | `ComponentResolver` | Component resolver for frame pages. Required unless inherited from a parent frame context. |
| `defaultLayout` | `(name: string, page: Page) => unknown` | Fallback layout resolver used when the page does not provide its own layout. |
| `renderLayout` | `boolean` | Controls whether page layouts are applied inside this frame. Defaults to `true` for the top frame and `false` for nested frames. |
| `onClickLink` | `(event: MouseEvent, href: string) => void` | Called when a plain same-origin `<a>` inside the frame is clicked. Call `event.preventDefault()` to stop the default frame navigation. |
| `skipHistoryRestore` | `boolean` | When `true`, always makes an HTTP request on mount instead of restoring page data from the history stack. Defaults to `false`. |
| `visitOptions` | `VisitOptions` | Default visit options applied to all navigations within this frame. Link/form-level options take precedence. Defaults per frame: `{ replace: true, updateBrowserUrl: false }` (non-top) / `{ replace: false, updateBrowserUrl: true }` (top). |
| `children` | `Snippet` | Fallback/loading content rendered when no frame page is available yet. |

All other props (restProps) are forwarded to the rendered page component.

### Accessing the router

Within a frame, call `useFrameRouter()` to access its router. The global top-level router is still available via `import { router } from 'inertiax-svelte'`.

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

You can also access the frame id, router, and page store together via the frame context:

```svelte
<script>
  import { useFrameContext } from 'inertiax-svelte'

  const { id, page, router } = useFrameContext()
</script>
```

### Default visit behavior

Non-top frames use different defaults than the top frame to work well as embedded regions:

| Option | Top frame (`_top`) | Non-top frame |
|---|---|---|
| `replace` | `false` (push history) | `true` (replace history) |
| `updateBrowserUrl` | `true` | `false` |

Override either by passing them explicitly in the frame's `visitOptions` prop, or per-link/per-form in your visit calls.

### Scroll regions

When a frame navigates, the closest ancestor element with the `scroll-region` attribute is automatically scrolled to the top. This makes it easy to wrap a frame in a scrollable container:

```svelte
<div scroll-region class="overflow-y-auto h-96">
  <Frame src="/long-content" />
</div>
```

On back/forward navigation, the scroll position is restored. Outer `scroll-region` ancestors and the document scroll position are not affected.

### Visiting a different frame

Pass `frameId` in visit options to target another frame. Useful when one frame controls another — for example, a table in the main content area opening a side panel.

```svelte
<script lang="ts">
  import { router } from 'inertiax-svelte'

  function openDetailsPanel(userId: number) {
    router.get(`/users/${userId}/details`, {}, { frameId: 'details' })
  }
</script>

<button on:click={() => openDetailsPanel(42)}>Open details</button>
```

Or create an explicit router instance and reuse it:

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

## Redirections within frames

Inertia X sends two request headers and accepts one response header to handle frame-aware redirects.

### Request headers

- **`X-Inertia-Frame`** — the ID of the frame whose router initiated the request. Use server-side to know which frame triggered a visit.
- **`X-Inertia-Referer`** — the `src` URL of the initiating frame. Use this instead of the standard referer for `redirect_back` within frames.

### Response header: `X-Inertia-Frame`

By default the response is applied to the frame set in `visitOptions.frameId`. Return an `X-Inertia-Frame` response header to route the response to a different frame instead.

A common use case: a form in a modal submits to an action that updates the main page. If validation fails, return `X-Inertia-Frame` pointing back to the modal so errors appear there, not in the main content area.

## Global click handler

Inertia X automatically intercepts plain `<a>` clicks inside a frame and performs a frame-scoped Inertia visit — no `<Link>` component needed.

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

Add `data-inertia-ignore` for native browser navigation:

```svelte
<a href="/non-inertia" data-inertia-ignore>Open outside Inertia</a>
```

### Customize with `onClickLink`

Use `onClickLink` to inspect or override the default handling. Call `event.preventDefault()` to stop the frame navigation.

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
