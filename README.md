# Inertia X

This is a Svelte-only fork of [Inertia](https://github.com/inertiajs/inertia) with additional features.

## New Features

### `<Frame>` component

The `<Frame>` component allows you to embed an Inertia page within another Inertia page, complete with its own navigation.

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
`initialComponent` | null | The component to show before the request is made.
`initialPage` | null | The initial Inertia page object, containing the initial props. Will be replaced after request is made.

If `initialComponent` is not set, the child content is shown until the request has finished. You can use this to show loading spinners and animations.

Requests made from within frames (basically all requests) send their current URL in the `X-Inertia-Frame-Src` header. You can use this instead of the `referer` header if you want to redirect the user back to the previous URL. 

## Breaking changes

### No global `router` and `page`.

The global `router` and `page` store have been removed. Each frame now comes with its own router and page store. You can get them from the frame component's context.

```diff
- import { router, page } from '@inertiajs/svelte'
+ const { router, page } = getContext('inertia')
```

## How does it work?

The "secret sauce" that makes this work is actually quite simple: Instead of one global router instance for your Inertia app, Inertia X creates one router instance per frame. The top-level app component is also a `<Frame>` (the `<App>` component has been removed in Inertia X).