# Inertia X

Inertia X is a drop-in replacement for the [Inertia](https://github.com/inertiajs/inertia) client-side adapter with additional features. Currently only available for Svelte 5.

## New Features

### `<Frame>` component

The `<Frame>` component lets you embed one Inertia page inside another Inertia page, each with its own navigation. This is useful for modals, wizards, sidebars, and more. You can find an example modal implementation using Frames [here](https://github.com/shitcoinswap/platform/blob/master/app/frontend/lib/ui/Modal.svelte).

#### Usage

```html
<script>
  import { Frame } from 'inertiax-svelte'
</script>

<Frame src="/users/1/edit">
  Loading...
</Frame>
```

The `<Frame>` component accepts these props:

 Prop | Default | Description
-----|------|-------
 `name` | *random* | The frame's name. Use this to target the frame directly in responses. The top-level frame is always named `_top`.
`src` | null | The URL of the page to load. If not provided, no request is made and the initial component and page are shown.
`renderLayout` | `true` if name == `_top` | Whether to render the component's layout.
`initialComponent` | null | The component to show before making the request. Can be a promise.
`initialPage` | null | The initial Inertia page object with initial props. Gets replaced after the request completes.
`onclick` | noop | An event handler that runs before the frame's own click handler. Call `preventDefault` on the event to skip the frame's default handler.

Any other props are passed down to the page component.

If you don't set `initialComponent`, the child content shows until the request finishes. Use this to display loading spinners and animations.

#### Redirecting back

When you make a request from inside a frame, the `referer` header still contains the current window location. 

The new `X-Inertia-Frame-Src` header solves this. The Inertia router sets this header to the originating frame's URL. Use this header instead of `referer` when you want to redirect users back to the previous URL.

#### Checking the originating frame

On the backend, you can get the originating frame's name from the `X-Inertia-Frame` header. The default top frame name is `_top`.

#### New router defaults

For all frames except `_top`, the `preserveUrl` and `replace` router visit options now default to `true`.

#### Targeting specific frames

By default, navigation through links, `router.visit` calls, and `form.submit` calls render their response in the same frame that made the request.

To render a response in a different frame, you have several options:

- Use the new `frame` router visit option: `router.visit('/url', {frame: 'otherFrame'})`.
- Set an `X-Inertia-Frame` response header with the target frame's name.
- Add a `data-target="frame"` attribute to your `a` tag.

You can also access a frame's router directly from the component:

```html
<script>
  function goSomewhereElse() {
    frame.router.visit(...)
  }
</script>

<Frame bind:this={frame} />
```

or globally:

```js
Router.for("modal").post("/users")
```

### External history state

Inertia X lets you add custom callbacks to its navigation stack using the new `pushExternal()` function. When you call this function, it adds the callbacks to the "stack" and calls the `arrive()` function. When users navigate back with the browser's back button, the `recede()` function gets called. Future forward/back navigation will call `arrive()` and `recede()` as users move back and forth. Inertia's normal navigation handling stops during these states.

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

Each frame component now has its own click handler. Clicks on elements with an `href` attribute get handled automatically. To disable this, add the `data-inertia-ignore` attribute to the element or any parent element. To disable globally, add `data-inertia-ignore` to the body element.

You can still use the `inertia` action and `<Link>` component as usual.

#### Supported attributes:

- `data-method`: The HTTP method
- `data-target`: A target frame
- `data-preserve-scroll`: Preserve scroll
- `data-preserve-state`: Preserve state
- `data-preserve-url`: Preserve URL
- `data-replace`: Replace history state (instead of pushing new state)

Note that in frames other than the top frame, `replace` and `preserve-url` default to `true`.

#### Example

```html
<a href="/session" data-method="delete">Log out</a>
```

## Breaking changes

### No global `router` and `page`

The global `router` and `page` stores have been removed. Each frame now has its own router and page store. Get them from the frame component's context. Parent frame context is also available via `inertia:frame_name`.

```diff
- import { router, page } from 'inertiax-svelte'
+ const { router, page } = getContext('inertia')
// OR
+ const { router, page } = getContext('inertia:_top')
```

### Global and frame-specific events

When you use `router.on('event', ...)`, you only receive events from that specific frame's router. To listen to events from all frames, use `document.addEventListener('inertia:event', ...)`:

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

Follow the installation guide for your backend adapter on https://inertiajs.com, but replace the `@inertiajs/svelte` package with `inertiax-svelte`.

```bash
npm i -D inertiax-svelte
```

Then use the package like you would use the original:

```js
import { createInertiaApp } from 'inertiax-svelte'

createInertiaApp( ... ) {
  // ...
}
```

## How does it work?

The "secret sauce" is actually quite simple: Instead of one global router instance for your Inertia app, Inertia X creates one router instance per frame. The top-level app component is also a `<Frame>` (the `<App>` component has been removed in Inertia X).

