# Inertia X Æ A-Xii

Inertia X Æ A-Xii is an adaptation and (almost) drop-in replacement for the [Inertiajs](https://inertiajs.com) client side adapter for Svelte 5.

This is a complete rewrite of Inertia X, based on Inertia 2.0. Inertia X started as a proof-of-concept for the `<Frame>` component, but has since graduated into a "real" project. I'm using it myself to build [my startup](https://github.com/buhrmi).

Compared to Inertia 2.0, Inertia X brings the following new features and changes:

* All state is now saved within `<Frame>` components, leveraging Svelte 5's fine-grained reactivity. The global page store has been removed. 
* A top-level `<Frame>` component is taking the place of the `<App>` component. The `<App>` component has been removed.
* The structure of the history state has been altered: The `Page` object does not contain props anymore. Instead, it now contains several `Frame` objects that contain the props for each frame.
* A global click handler
* Svelte 5 only


## New Features

### `<Frame>`

The Frame component is the defining feature of Inertia X. It allows you to embed an Inertia page within another Inertia page. This way you can easily create interactive modals, wizards, dialogs, sidebars, etc.

#### Usage

```html
<Frame url="/dashboard">
  Loading...
</Frame>
```

#### Things to note

* All navigation (including form submissions) is encapsulated within the frame that initiated the request.
* To programmatically navigate within a different frame, make the request on the frame's router. Frame components export their router via `frame.router`.
* The new `X-Inertia-Referer` header contains the URL of the frame that initiated the request. Use this URL instead of calling `redirect_back` on your backend, when you want to redirect the user back to the originating URL.
* Frame content is wrapped in a `<div>` with `style="display: contents"` and `class="[frame name]"`. The frame's click handler is added on this div.

#### Props

| Prop | Type | Description |
| --- | --- | --- |
| `name` | string | (optional) The name of the frame. This is used to identify the frame in the history state |
| `url` | string | (required if `component` is not given) The URL of the page to load |
| `component` | string | (required if `url` is not given) The name of the Inertia page component to load. |
| `props` | object | (optional) The initial props to pass to the Inertia page component. They will be replaced once `url` has been loaded. |
| `renderLayout` | boolean | (optional) Whether to render the layout. Defaults to `true` if `name` == `_top`. `false` otherwise. |
| `history` | boolean | (optional) Whether this frame should save its state in the history. Setting this to false effectively makes this frame invisible to browser navigation. |
| `onclick` | function(e) | (optional) Provide your own click handler. Call `e.preventDefault()` to prevent Inertia from navigating inside the frame. |

### Global click handler

The `<Link>` component and the `use:inertia` action have been removed. Instead, we use a global click handler to intercept clicks and pass them to the Inertia router. You can opt out of this by adding a `data-inertia-ignore` attribute to the link. To opt-out globally, set the `data-inertia-ignore` attribute on the `<body>`.

## Breaking Changes

### `router.on`

Calls to `router.on(eventname)` now set up a listener for `inertia:[framename]:[eventname]`. This currently only works for the `finish`, `before`, `start`, and `prefetching` events. For other events, attach your listeners to the document directly, eg `document.addEventListener('inertia:navigate'`).

### Context instead of imports

Routers and page stores now exist at the Frame level (yes, an Inertia X app has multiple routers, one for each frame). That means, that they are not globally exported anymore. Instead, they are saved in the Svelte context of each Frame:

```diff
-import { router, page } from '@inertiajs/svelte'
+const { router, page } = getContext('inertia')
```

To get the context of a parent Frame, use `getContext('inertia:[frame name]))`. For example, to get the top-level router (which exists within the Frame with the name `_top`), use `const { router } = getContext('inertia:_top')`.

### `preserveState` and `preserveScroll`

The `preserveState` router option has been replaced by `forgetState` and can now take a string in addition to a boolean. It now defaults to the name of the frame that made the request. If set to a frame name, the state of that frame will be forgotten after making a request. If set to true, the state of all frames will be forgotten.

The `preserveScroll` option is true by default within non-top frames.


## Installation

```bash
npm install -D inertiax-svelte inertiax-core
```

```diff
-import { createInertiaApp } from '@inertiajs/svelte'
+import { createInertiaApp } from 'inertiax-svelte'
```
