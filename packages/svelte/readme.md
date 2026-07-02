# Inertia.js Svelte Adapter

Visit [inertiajs.com](https://inertiajs.com/) to learn more.

## Frame component

The `Frame` component renders an isolated Inertia app within a parent Inertia app.
Each frame manages its own router, history, and component tree.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `id` | `string` | `src` value, then auto-generated | Frame identifier. Deterministic when derived from `src`. |
| `src` | `string` | — | URL to load the frame content from. |
| `router` | `Router` | auto-created | Custom router instance. |
| `initialComponent` | `ResolvedComponent` | — | Pre-resolved component for SSR/hydration. |
| `initialPage` | `Page` | — | Pre-loaded page data for SSR/hydration. |
| `resolveComponent` | `ComponentResolver` | inherited | Component resolver function. |
| `defaultLayout` | `(name, page) => unknown` | — | Fallback layout when page doesn't define one. |
| `renderLayout` | `boolean` | `true` for top frame | Whether to wrap content in layouts. |
| `visitOptions` | `VisitOptions` | `{ replace: true, updateBrowserUrl: false }` (non-top) / `{ replace: false, updateBrowserUrl: true }` (top) | Default visit options applied to all navigations within the frame. Link/form-level options take precedence. |
| `onClickLink` | `(event, href) => void` | — | Called when a plain `<a>` inside the frame is clicked. Call `event.preventDefault()` to prevent navigation. |
| `skipHistoryRestore` | `boolean` | `false` | When `true`, always makes an HTTP request on mount instead of restoring page data from the browser's history stack. By default, a Frame restores its previous state (and scroll position) on browser reload or when remounting with the same `src`. |
| `children` | `Snippet` | — | Fallback content rendered while the frame loads. |

### Scroll regions

When a frame navigates, the closest ancestor `[scroll-region]` element is scrolled to top. On back/forward, its position is restored. Outer scroll regions and document scroll are left alone.

If a nested frame triggers an Inertia location/version conflict response (`409`
with `X-Inertia-Location`), Inertia X reloads the current top-level page
instead of navigating the browser to the frame URL.
