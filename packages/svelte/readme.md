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
| `forceRequest` | `boolean` | `false` | When `true`, always fetches fresh page data on mount instead of restoring from the history stack. |
| `children` | `Snippet` | — | Fallback content rendered while the frame loads. |

### Global click handler

Plain `<a>` elements inside a `Frame` are intercepted automatically.
You can control the visit behaviour with data attributes — no `<Link>`
component required.

| Attribute | Description |
|-----------|-------------|
| `data-method` | HTTP method for the request (`get`, `post`, `put`, `patch`, `delete`). |
| `data-replace` | Replace the current history entry instead of pushing. Omit or set to `"true"`. Use `"false"` to explicitly opt out. |
| `data-inertia-ignore` | Skip Inertia interception entirely — the link behaves as a normal browser navigation. |

**Example**

```html
<a href="/logout" data-method="post">Logout</a>
<a href="/settings" data-replace>Settings</a>
<a href="/external" data-inertia-ignore>External site</a>
```

### Scroll regions

When a frame navigates, the closest ancestor `[scroll-region]` element is scrolled to top. On back/forward, its position is restored. Outer scroll regions and document scroll are left alone.

If a nested frame triggers an Inertia location/version conflict response (`409`
with `X-Inertia-Location`), Inertia X reloads the current top-level page
instead of navigating the browser to the frame URL.
