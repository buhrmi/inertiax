# Changelog — `inertiax` 11.x

This fork of Inertia.js removes Vue and React adapters, replaces Axios with
`es-toolkit`, and adds Svelte 5 multi-frame support. Package names use the
`inertiax-*` scope.

---

## [11.0.55]

### Fixed
- `usePoll` inside a nested `Frame` now polls the frame's own URL instead of
  the top frame URL. Reloads (including polls) now target the originating
  frame's page URL from the page store rather than `window.location.href`.

---

## [11.0.53]

### Added
- `frame` added to all remaining event details: `inertia:progress`,
  `inertia:httpException`, `inertia:networkError`, and `inertia:location`.
  Every Inertia event now carries the frame it originated from.
- `router.on()` now automatically filters events to the router's own frame.
  Callbacks only fire for events belonging to that frame — no manual
  `event.detail.frame` checks needed.

---

## [11.0.52]

### Added
- `frame` added to event details for `inertia:navigate`, `inertia:clientVisit`,
  `inertia:success`, `inertia:error`, `inertia:beforeUpdate`, and
  `inertia:flash`. The frame always reflects the frame where the page change
  actually occurred, even when the server overrides the target via the
  `X-Inertia-Frame` response header.

---

## [11.0.51]

Version bump to sync packages

---

## [11.0.50]

### Fixed
- Nested `Frame` components now send `X-Inertia-Frame` header on initial load
  requests, so the server can identify which frame the request originates from.

---

## [11.0.49]

### Changed
- Reverted eager DOM initialisation of the global `page` store (from 11.0.46).
  The page object now starts empty and is seeded by `createInertiaApp` via
  `setPage()` before any component renders. This avoids stale `$state` proxy
  issues after Vite HMR in SSR dev mode where `Object.assign` was silently
  swallowed and `page.props` appeared frozen.

## [11.0.48] (reverted)

### Fixed
- `createInertiaApp` called `setPage(initialPage)` before rendering to ensure
  `page.props` was populated during SSR. This was reverted in 11.0.49 because
  the root cause was the eager DOM init + `$state` proxy interaction with HMR,
  not the timing of `setPage`.

---

## [11.0.47]

### Fixed
- Nested `Frame` components now correctly handle 409 responses on initial load.
  The HTTP client rejects promises on status ≥ 400, so 409 responses arrived as
  `HttpResponseError` and never reached the status-code check. The frame now
  catches the error and triggers a page reload for version-mismatch recovery.

---

## [11.0.46]

### Fixed
- `import { page } from "inertiax-svelte"` now has `page.props` populated
  immediately at module evaluation time. The global page store eagerly reads
  from `<script data-page="app" type="application/json">` during module init
  instead of waiting for `createInertiaApp`.

---

## [11.0.44]

### Added
- Global click handler now supports `data-frame` on `<a>` elements for targeting
  a different frame (e.g. `data-frame="_top"`).
- `use:inertia` Svelte action now forwards the `frame` option to the visit
  request.

---

## [11.0.43]

### Changed
- Renamed remaining internal `frameId` references to `frame` in router event
  handlers, response processing, `Frame.svelte` (`createFrameName`), and
  `useFormState`. No public API changes.

---

## [11.0.42]

### Fixed
- `X-Inertia-Referer` now uses the originating frame's URL instead of the
  target frame's URL. A form with `frame: "_top"` in a nested frame
  previously sent the host page URL; it now correctly sends the frame's URL.

---

## [11.0.41]

### Breaking
- Renamed all public `frameId` references to `frame`: `Visit.frame`, `createRouter(frame)`, `Router.frame`, `useFrame()`, `DEFAULT_FRAME`, `FormComponentOptions.frame`. The `X-Inertia-Frame` header is unchanged.

### Fixed
- `Frame.svelte` initial `src` request now handles 409 conflict responses
  (`X-Inertia-Location` / `X-Inertia-Redirect`). Non-top frames reload the
  page; the top frame navigates to the new location.

### Changed
- Updated dependencies across all packages.

---

## [11.0.39]

### Added
- `Frame.svelte` global click handler now supports `data-method` and
  `data-replace` attributes on plain `<a>` elements. `data-method` sets
  the HTTP method (`get`, `post`, `put`, `patch`, `delete`) and
  `data-replace` replaces the current history entry instead of pushing.

---

## [11.0.38]

### Fixed
- `Frame.svelte` scroll-region restoration when restoring from history during
  client-side navigation. `InitialVisit.handleDefault()` was using
  `preserveScroll: true` for all frames, which captured zero scroll positions
  (the frame just mounted) and overwrote the history-based scroll restoration
  from Frame's `$effect`. Non-top frames now use `preserveScroll: false` since
  they have no prior scroll position to preserve.

---

## [11.0.37]

### Added
- Merged upstream Inertia.js 3.x (up to 3.6.1):
  - `fireLocationEvent` — cancelable `location` event before external redirects
  - Version change detection for background/async requests
  - `serverHead` support in SSR
  - `async` option on `FormComponentOptions`
  - Poll `flag` support
  - `useHttp` — standalone HTTP helper with form-like API
  - Deferred forced reloads to cancelable `location` event
  - `X-Requested-With` header in built-in HTTP client
  - Raw request body support

---

## [11.0.36]

### Fixed
- `swapComponent` in `Frame.svelte` no longer overwrites the global page store
  for non-top frames. Child frame mounts were calling `setPage()` with their own
  page data, causing `usePage()` in layouts to return the wrong URL.

---

## [11.0.35]

### Fixed
- Client: `swapComponent` in `App.svelte` now calls `setPage()` before swapping
  components, ensuring the global page store is up-to-date when the new
  component's script runs. This fixes compatibility with Svelte 5's
  `experimental.async: true` compiler option.

### Added
- Test: SSR rendering and hydration of Svelte components with top-level `await`
  (requires `experimental.async: true`).

---

## [11.0.34]

### Fixed
- SSR: `render()` call in `createInertiaApp` now uses `await`. Svelte 5 returns
  a `Promise` when the component tree contains top-level `await`, which caused
  "Encountered asynchronous work while rendering synchronously" errors.

---

## [11.0.33]

### Changed
- **Breaking**: `skipHistoryRestore` prop renamed to `forceRequest` on `Frame`.
  Defaults to `false` (use history restore). Set to `true` to always fetch fresh
  data on mount.
- `useRemember` keys no longer include the redundant `frameId` prefix.

### Added
- Test: `useRemember` state survives back and back/forward browser navigation
  both with and without `forceRequest` on the Frame.

---

## [11.0.31]

### Fixed
- `useRemember` state in frames no longer lost on unmount/remount. Two issues:
  `CurrentFramePage.init()` and `set()` now merge previous `rememberedState`
  into new pages; `router.destroy()` no longer deletes frame page state,
  preserving it across frame remounts.

### Added
- Test: `useRemember` state survives frame unmount and remount with
  `forceRequest` (fresh HTTP fetch).

---

## [11.0.30]

### Fixed
- Non-top frame `pushState`/`replaceState` no longer falls back to `page.url`
  when `browserUrl` is omitted. The bug caused non-top frames with
  `updateBrowserUrl: false` to still update the browser URL to the frame's
  internal URL. Now uses `window.location.href` as the fallback for non-top
  frames, keeping the current page URL intact.

### Added
- Test: `updateBrowserUrl: false` prevents browser URL changes in non-top
  frames (link click, form submit) while retaining per-frame history.
- Test: `updateBrowserUrl: true` on non-top frames updates browser URL as
  expected.
- Core unit tests for `history.pushState`/`replaceState` URL fallback for
  top vs non-top frames.

---

## [11.0.29]

### Fixed
- Non-top frame version/location conflicts (`409` + `X-Inertia-Location`) no
  longer navigate the browser to the frame URL. Inertia X now reloads the
  current top-level page instead, preserving correct document context.

### Added
- Test: nested-frame version conflict triggers a top-level page reload and keeps
  the browser URL on the current page.

---

## [11.0.28]

### Fixed
- `usePage()` in the top frame (or outside any frame context) now returns the
  module-level `$state` proxy directly instead of `get(context.page)`. This fixes
  `page.url` not updating reactively in layouts and components after navigation.
  Child frames continue to use `get(context.page)` for frame-scoped data.

### Added
- Test: `usePage().url` reactivity in page layouts.
- Test: `usePage().url` reactivity within child Frames.
- Test: Frame restores state and scroll position on browser reload.

---

## [11.0.26]

### Changed
- Frame history-restore scroll restoration now uses a reactive `$effect`
  tied to the component mount instead of `setTimeout`. Scroll is restored
  as soon as Svelte has rendered the frame's content — no more guessing
  with arbitrary timers.

### Fixed
- Flaky `frame-scroll-region` back-navigation test: increased timeouts to
  accommodate RAF-based scroll restore delays under parallel test load.

---

## [11.0.25]

### Fixed
- `saveScrollPositions` no longer overwrites saved scroll positions with
  zero when a scroll-region's content collapses (e.g. when a Frame
  unmounts and the scroll-region shrinks). Regions without scrollable
  content (`scrollHeight ≤ clientHeight`) are skipped.
- Frame scroll-region now correctly restores its position when a Frame
  remounts after being hidden — `decryptHistory()` + `restoreScroll()`
  work in tandem on the toggle path, not just browser back/forward.

---

## [11.0.24]

### Fixed
- `restoreScroll()` on Frame mount now deferred via `setTimeout(0)` so it
  runs after frame content has rendered, fixing scroll-region restore when
  a Frame remounts from history state.
- Frame scroll-region position now correctly restored when the Frame
  unmounts (navigate away), then remounts (browser back) from the history
  stack.

### Added
- `restoreScroll()` public method on `Router` — restores scroll positions
  from `history.state.scrollRegions`. Called automatically by Frame after
  `decryptHistory()`.

---

## [11.0.23]

### Added
- `skipHistoryRestore` prop on `Frame` — when `true`, always makes an HTTP
  request on mount instead of restoring page data from the history stack.
- Frame `src` is now used as the default `frameId` when no explicit `id` is
  given. Frames with the same `src` share history state across remounts,
  making the history-restore optimisation work naturally.
- `Frame` now attempts to restore page data from `history.state` before
  making the initial HTTP request (skipped when `skipHistoryRestore` is
  set or no history state exists).

### Changed
- `CSS.escape()` used in `regionsForFrame` selector to safely handle
  frameIds containing URL characters.

---

## [11.0.22] 🎉

### Fixed
- Scroll-region restore on back/forward navigation within non-top frames
  now works correctly. The dual-router popstate race (top frame's handler
  overwriting scroll state) is prevented by an `isEqual` guard that skips
  `setQuietly` when the frame's data hasn't changed.
- Removed aggressive `page.set` save that was overwriting the correct
  `onScroll`-saved scroll positions with a zeroed capture.

### Changed
- `Scroll.restore` now uses double `requestAnimationFrame` to give frame
  content time to render before restoring scroll positions.

---

## [11.0.21]

### Changed
- Removed unused `frameId` parameters from `saveDocumentScrollPosition`,
  `getDocumentScrollPosition`, and `Scroll.onWindowScroll` — all read/write
  from root-level `history.state` now.

---

## [11.0.20]

### Changed
- Moved `scrollRegions` and `documentScrollPosition` from per-frame
  (`history.state.frames[id]`) to root level (`history.state`). Scroll
  positions are global DOM state, not frame-specific.
- `saveScrollPositions` and `saveDocumentScrollPosition` now write
  synchronously to `window.history.state` (no async queue).

### Fixed
- `Scroll.reset()` now works for non-top frames — resets the closest
  ancestor `[scroll-region]` of the navigating frame. Document scroll
  and anchor scrolling remain guarded to the top frame only.
- `Scroll.restore()` no longer skips non-top frames; scroll-region
  positions are restored for all frames.
- `Frame`'s invisible anchor `<span>` renders during SSR, avoiding a
  hydration DOM mismatch. Click action still runs client-side only.

---

## [11.0.19]

### Fixed
- `Frame`'s invisible anchor `<span>` now renders during SSR, avoiding a
  hydration DOM mismatch. The `data-inertia-frame` attribute is present in
  both server and client output; the click action only runs client-side.

---

## [11.0.18]

### Fixed
- `Scroll.reset()` and `Scroll.restore()` no longer skip scroll-region handling
  for non-top frames. Previously they were complete no-ops for any `frameId !== "_top"`,
  so `[scroll-region]` elements wrapping a `<Frame>` never reset on navigation.
  Now the closest ancestor `[scroll-region]` is scoped and reset, while outer
  scroll regions and document scroll remain untouched.

---

## [11.0.17]

### Changed
- Removed `preserveScroll` from frame-level `visitOptions` defaults.
  Parent document scroll is already protected by the `Scroll` class
  (`frameId !== DEFAULT_FRAME_ID` guard). Frames now scroll to top on
  navigation like the top frame does.

---

## [11.0.16]

### Added
- `Frame` component now accepts `visitOptions` prop — all Inertia visit options
  applied as defaults to navigations within the frame. Link/form-level options
  take precedence.
- `visitOptions` stored in frame context so `use:inertia` and `useForm` also
  inherit frame-level visit options as defaults.
- Frame-level visit defaults centralized in one place:
  - **Top frame** (`_top`): `{ replace: false, updateBrowserUrl: true }`
  - **Non-top frames**: `{ replace: true, updateBrowserUrl: false }`

### Fixed
- `use:inertia` action now correctly applies frame-level `visitOptions` defaults;
  previously hardcoded `|| false` overrides would shadow frame defaults for
  `replace`, `preserveScroll`, etc.

---

## [11.0.14]

### Changed
- Reverted `router.get()` approach for initial frame load — back to manual `http` request
  called before `initRouter()`. Avoids `InitialVisit.handle()` side effects with
  placeholder data.
- CI: Playwright browser cache key includes lockfile hash to prevent stale binaries

---

## [11.0.13]

### Added
- `children` snippet on `Frame` renders as a loading placeholder while `src` fetches

### Fixed
- `resolveFrameComponent` handles empty component names gracefully

---

## [11.0.12]

### Added
- Merged upstream Inertia.js v3.4.0:
  - **Request/response interceptors** — `exposeInterceptors()` for debugging
  - **Visit correlation ID** — `visitId` (string UUID) on navigate/error/success/clientVisit events
  - **`inertia:clientVisit` event** — fires when `router.visit()` is called client-side
  - **`cached` flag** on `inertia:navigate` — true for prefetched/cached navigations
  - **Page + `visitId`** on error event detail
- `CurrentFramePage.set` accepts `cached` and `visitId` options
- `fireSuccessEvent` includes `visitId`
- `fireNavigateEvent` includes `cached` and `visitId`
- `fireInitialEvents` accepts `frameId` + `visitId`
- New core modules: `uid.ts`, `interceptors.ts`

### Changed
- `visitId` refactored from number to string UUID
- `fireClientVisitEvent` imported and emitted in router
- Merged upstream dependency bumps (Playwright ^1.60.0, wider deps)

---

## [11.0.11]

### Changed
- `Frame` initial page load switched to `router.get()` (reverted in 11.0.14)

---

## [11.0.10]

### Fixed
- Reverted accidental behavioral change to `src` + `initialPage` interaction

---

## [11.0.9]

### Fixed
- Non-top frames no longer restore document scroll position
- Non-top frames preserve their own scroll regions correctly
- Prevent non-top frames from resetting document scroll

---

## [11.0.8]

### Changed
- Deduplicated initial page load code in `Frame` load function

---

## [11.0.7]

Version bump only.

---

## [11.0.6]

### Added
- `Frame` component preserves scroll positions by default when setting pages
- README updates

### Changed
- `Frame` no longer sets default frame ID internally — caller controls it

---

## [11.0.5]

### Changed
- Don't set default frame ID from within frame component

---

## [11.0.4]

### Added
- `resolveComponent` stored globally — frames can be mounted programmatically

---

## [11.0.3]

### Fixed
- Frame props properly passed down to children

---

## [11.0.2]

### Added
- HTTP requests send correct `X-Inertia-Version` header

---

## [11.0.1]

Version bump only.

---

## [11.0.0] — Initial Fork Release

### Breaking Changes
- **Package names**: `@inertiajs/core` → `inertiax-core`, `@inertiajs/svelte` → `inertiax-svelte`, `@inertiajs/vite` → `inertiax-vite`
- **Vue and React adapters removed** — Svelte-only
- **Axios removed** — replaced with `es-toolkit` + native XHR client

### Added
- `Frame` component — Svelte 5 multi-frame architecture with isolated router per frame
- `DEFAULT_FRAME_ID` context for top-level vs nested frame identification
- `x-inertia-frame` response header support for server-side frame routing
- `Frame.svelte` props: `id`, `src`, `router`, `initialComponent`, `initialPage`, `resolveComponent`, `defaultLayout`, `renderLayout`, `onClickLink`, `children`
- Multi-frame history encryption and scroll region management
- Programmatic frame mounting

### Changed
- Repository URLs updated to `github.com/buhrmi/inertiax`
- CI: removed Firefox and WebKit (Chromium only)
- CI: removed vite plugin tests (React/Vue-dependent)
- CI: longer timeouts for GitHub runners
- CI: removed React/Vue from GitHub workflows

### Fixed
- Unchanged frames no longer re-run effects on browser navigation
- Frame cleanup on unmount (destroy router)
