# Inertia X

Inertia X is a Svelte-only fork of [Inertia](https://github.com/inertiajs/inertia) with additional features.

## New Features

### `<Frame>` component

The `<Frame>` component allows you to embed an Inertia page within another Inertia page, complete with its own navigation. This is useful for modals, wizards, sidebars, etc.

#### Usage

```html
<script>
  import { Frame } from 'inertiax-svelte'
</script>

<Frame src="/users/1/edit">
  Loading...
</Frame>
```

The following props are available on the `<Frame>` component:

 Prop | Default | Description
-----|------|-------
 `name` | *random* | The name of the frame. This is used to directly target the frame in responses. The name of the top-level frame is `_top`.
`src` | null | The url of the page to load. If not set, no request is made, and the initial component and page are shown.
`renderLayout` | `true` if name == `_top` | Whether or not to render the layout of the component.
`initialComponent` | null | The component to show before the request is made. Can be a promise.
`initialPage` | null | The initial Inertia page object, containing the initial props. Will be replaced after request is made.

Any other unknown props will be passed down to the underlying page component.

If `initialComponent` is not set, the child content is shown until the request has finished. You can use this to show loading spinners and animations.

#### Redirecting back

When making a request from within a frame, the `referer` request header will still be the current window location. 

That's where the new `X-Inertia-Frame-Src` header comes in. The Inertia router sets this header to the url of the originating frame. You can use this instead of the `referer` header if you want to redirect the user back to the previous URL. 

#### New router defaults

For all frames other than the `_top` frame, the `preserveUrl` and `replace` router visit options now default to `true`.

#### Targeting specific frames

By default, `router.visit` and `form.submit` calls render their response in whatever frame the request originated in.

To render a response in a frame that is not the originating frame, you have multiple options:

- Use the new `frame` router visit option: `router.visit('/url', {frame: 'otherFrame'})`.
- Set an `X-Inertia-Frame` response header containing the name of the target frame.

You can also grab the router of a frame by accessing it directly on the component:

```html
<script>
  function goSomewhereElse() {
    frame.router.visit(...)
  }
</script>

<Frame bind:this={frame} />
```

### External history state

Inertia X allows you to push a set of callbacks onto its navigation stack using the new `pushExternal()` function. When this function is called, it will push the callbacks on its "stack", and calls the `arrive()` function. When the user navigates back using the browser's back button, the `recede()` function will be called. Subsequent forward/back navigations will call `arrive()` and `recede()` as the user navigates back and forth. All of Inertia's usual navigation handling is suspended in these cases.

```html
<script>
  import { history } from 'inertiax-core'

  function onclick() {
    history.pushExternal(url, {
      arrive() {
        alert("You arrived at an external history state")
      },
      recede() {
        alert("You navigated back from an external history state")
      }
    })
  }
</script>

<button {onclick}>Push external state</button>
```

### Global click handler

Each frame component now comes with its own click handler. Clicks on an element with an `href` attribute will be automatically handled by it. To opt out, add the `data-inertia-ignore` attribute to the element or one of its parents. To opt-out globally, add the `data-inertia-ignore` attribute to the body. 

You can continue to use the `inertia` action and `<Link>` component as usual.

#### Supported attributes:

- `data-method`: The HTTP method

#### Example

```html
<a href="/session" data-method="delete">Log out</a>
```

## Breaking changes

### No global `router` and `page`.

The global `router` and `page` store have been removed. Each frame now comes with its own router and page store. You can get them from the frame component's context. Parent frame's context is also available via `inertia:frame_name'.

```diff
- import { router, page } from 'inertiax-svelte'
+ const { router, page } = getContext('inertia')
// OR
+ const { router, page } = getContext('inertia:_top')
```

You can also get the router for a frame through the `Router` object exported by `inertiax-core`:

```js
import { Router } from 'inertiax-core'
const router = Router.for('myframe')
```

### Global and frame-bound events

When using `router.on('event', ...)`, you will only receive events that happen within the frame for that specific router. To listen to events globally, use `document.addEventListener('inertia:event', ...)`:

```js
import { getContext } from "svelte";
const { router, frame } = getContext("inertia");

router.on("navigate", () => {
  console.log("navigated inside frame ", frame);
})

// or listen to all frames:
document.addEventListener('inertia:navigate', ...)

```

## Installation

Follow the installation guide for your favourite backend adapter on https://inertiajs.com, but replace the `@inertiajs/svelte` package with `inertiax-svelte`.

```bash
npm i -D inertiax-svelte@^10.0.0-beta.0
```

Then use the package as you would use the original package:

```js
import { createInertiaApp } from 'inertiax-svelte'

createInertiaApp( ... ) {
  // ...
}
```

## How does it work?

The "secret sauce" that makes this work is actually quite simple: Instead of one global router instance for your Inertia app, Inertia X creates one router instance per frame. The top-level app component is also a `<Frame>` (the `<App>` component has been removed in Inertia X).

