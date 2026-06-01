# Inertia X Changelog

## [Unreleased]

> Based on [Inertia 3.0](https://github.com/inertiajs/inertia)

This is the first release of **Inertia X** on the 3.x branch. It includes everything from Inertia 3.0 plus the features listed below.

---

### New: `Frame` component

The headline feature of Inertia X. A `Frame` is an independent Inertia region that owns its own router, page state, and browser history entry. You can embed as many frames as you like on a single page — modals, side panels, wizards, tabbed sections — and each one navigates independently without interfering with the top-level page.

```svelte
<Frame id="sidebar" src="/app/sidebar">
  <p>Loading…</p>
</Frame>
```

Frames can also be initialised with a pre-resolved page object instead of a remote `src`:

```svelte
<Frame id="details" {initialPage} {resolveComponent} />
```

#### Automatic link interception

Every `Frame` automatically intercepts clicks on plain `<a>` elements inside it and turns them into Inertia visits scoped to that frame. No `use:inertia` or `<Link>` wrappers needed. Clicks are ignored when:
- `defaultPrevented` is already set
- The anchor has a `target`, `download`, or `data-inertia-ignore` attribute
- The URL has a different origin
- A modifier key is held or a non-left mouse button is used

A custom `onClickLink` prop lets you hook into the handler:

```svelte
<Frame
  {resolveComponent}
  onClickLink={(event, href) => {
    if (shouldOpenInModal(href)) event.preventDefault()
  }}
/>
```

---

### New: `createRouter(frameId)` factory

Create a dedicated `Router` instance for any frame id. Pass it directly to a `<Frame>` to control that frame from outside the component tree.

```ts
import { createRouter } from 'inertiax-svelte'

const panelRouter = createRouter('panel')
panelRouter.visit('/users/42/details')
```

---

### New: `frameId` visit option

Every visit method (`router.visit`, `router.get`, `router.post`, …) now accepts a `frameId` option to target a specific frame without needing a reference to its router instance.

```ts
router.get('/users/42/details', {}, { frameId: 'details' })
```

---

### New: `useFrameRouter()` composable

Returns the `Router` for the frame that contains the calling component. Falls back to the global router when used outside a `Frame`.

```svelte
<script>
  import { useFrameRouter } from 'inertiax-svelte'
  const router = useFrameRouter()
</script>
```

---

### New: `useFrameContext()` composable

Returns the full context object for the containing frame: `{ id, router, resolveComponent, getPage, setPage }`.

---

### New: `useFrameId()` composable

Returns the string id of the containing frame (`'_top'` when outside any `Frame`).

---

### New: `DEFAULT_FRAME_ID` constant

The string `'_top'` exported from `inertiax-svelte`. Use it to guard code that should only run in the top-level frame.

---

### New: Frame-keyed browser history

Browser history state is now keyed by frame id:

```json
{
  "frames": {
    "_top": { "page": {}, "scrollRegions": [], "documentScrollPosition": {} },
    "sidebar": { "page": {}, "scrollRegions": [], "documentScrollPosition": {} }
  }
}
```

This allows each frame to independently restore its page on back/forward navigation. Non-top frames record history entries without updating the browser URL by default. Pass `updateBrowserUrl: true` in visit options to override.

