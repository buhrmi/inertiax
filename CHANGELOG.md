# Changelog — `inertiax` 11.x

This fork of Inertia.js removes Vue and React adapters, replaces Axios with
`es-toolkit`, and adds Svelte 5 multi-frame support. Package names use the
`inertiax-*` scope.

---

## [11.0.14] — Unreleased

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
