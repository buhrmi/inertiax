# Inertia X

Inertia X is a fork of [Inertia](https://github.com/inertiajs/inertia) that adds additional features to the Svelte adapter.

## Frame Component

The `Frame` component enables multiple independent Inertia page regions on the same document.
Each frame owns its own router and page state, so links/forms inside one frame only update that frame.

The main use case for this are modals, side panels, wizards, etc. Essentially, any Inertia app that requires some part of the page to update indepently from the rest.

## Basic Usage

```svelte
<Frame id="sidebar" src="/app/sidebar">
    <p>Loading sidebar...</p>
</Frame>
```

## Frame API

- `id?: string`
- `src?: string`
- `router?: Router`
- `initialComponent?: ResolvedComponent`
- `initialPage?: Page`
- `resolveComponent: ComponentResolver`
- `defaultLayout?: (name: string, page: Page) => unknown`
- `children?: Snippet`

Notes:
- If `id` is omitted, the frame uses the default id `_top`.
- If `initialPage` is absent and `src` exists, `Frame` boots by fetching the Inertia payload from `src`.
- The `children` snippet is used as fallback UI while `src` loading is in progress.

## Router and State Isolation

Each `Frame` creates (or accepts) a router scoped to the frame id.

This means:
- Link clicks inside a frame navigate that frame only.
- Form submissions inside a frame update that frame only.
- `usePage`, `useRemember`, `useForm`, `usePoll`, and `usePrefetch` resolve through frame context.

This isolation is what enables multiple independently interactive Inertia panes on one page.

## Back/Forward Navigation Behavior

History state is frame-keyed, not single-page keyed.

At a high level:
- History entries store a `frames` object keyed by frame id.
- A popstate event is dispatched to all frame routers.
- Each frame router restores only its own frame state when that state exists on the history entry.
- Entries for older single-frame history format are migrated on read for backward compatibility.

Practical behavior:
- If frame A navigates and frame B does not, browser back first replays frame A's previous state.
- Back/forward operations do not force unrelated frames to reload.
- Default frame popstate handling preserves state to avoid remounting and resetting child frame trees.

## Implementation Summary (New vs Previous)

Previous model:
- One global router.
- One global current page object.
- History state effectively modeled a single page payload.
- Popstate restoration was global.

New model:
- Router instances are frame-scoped (`createRouter(frameId)`).
- Page store is frame-scoped (internally keyed by frame id).
- History state is frame-scoped (`state.frames[frameId]`).
- Event handling fans out popstate/pageshow to registered frame handlers.
- Svelte adapter provides frame context hooks (`useFrameRouter`, `useFrameId`, context-aware `usePage`).
- Existing `App` remains available and delegates to the default frame for compatibility.

## Compatibility Notes

- Existing single-app usage remains supported through `App` and the default frame id `_top`.
- Legacy history entries are normalized into frame format when read.
- Multi-frame features can be adopted incrementally: start with one `Frame`, then split additional regions.
