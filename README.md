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

## Breaking changes

### No global `router` and `page`.

The global `router` and `page` store have been removed. Each frame now comes with its own router and page store. You can get them from the frame component's context.

```diff
- import { router, page } from '@inertiajs/svelte'
+ const { router, page } = getContext('inertia')
```

## How does it work?

The "secret sauce" that makes this work is actually quite simple: Instead of one global router instance for your Inertia app, Inertia X creates one router instance per frame. The top-level app component is also a `<Frame>` (the `<App>` component has been removed in Inertia X).