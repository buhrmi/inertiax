# Inertia X

> The **X** stands for eXperimental

This is a fork of [Inertia](https://github.com/inertiajs/inertia) that adds additional features. These features are experimental in nature and serve as proof-of-concept for the Inertia core team. Inertia X currently only supports Svelte 5 and React.

## Features added

- `<Frame>` component
- `transformProps` router visit option
- `preserveURL` router visit option
- Global click handler

## Breaking changes

- The Inertia SSR output does no longer include the `<div id="app" data-server-rendered="true">` wrapper. Rendering of the wrapping `<div>` during SSR is now the responsibility of the backend framework. If you're using Rails, you can use my [inertia-rails fork](https://github.com/buhrmi/inertia-rails).

### Frames

Frames can be used to encapsulate an Inertia page within another Inertia page. This is useful for creating modal dialogs, wizards, search sidebars, overlay cards, etc. Don't worry: Besides the name and concept, it has nothing to do with conventional browser frames.

When you click on a hyperlink or submit a form within an Inertia frame, the response will be rendered in the frame that triggered the request (sans layout). You can change the frame in which an Inertia response is rendered by doing one of the following:

- Add an `data-target="frame-id"` attribute to the hyperlink.
- Pass `{target: frameId}` to `router.visit()` or `form.submit()`
- Specify the frame ID in an `X-Inertia-Frame` header from the server.

To target the top (main) frame, use `_top` as the frame ID.

#### Things to note

- Props on the `<Frame>` component will be passed on to the rendered Inertia component.
- Navigation within frames currently does not create new history entries. This feature might be added in the future.
- During SSR, only the initial placeholder slot will be rendered. The actual content is loaded when the frame component is mounted. You can use this to add loading animations, etc.

#### Example

```html
<script>
import { Frame } from 'inertiax-svelte'
</script>

<Frame src="/users/1/edit" id="edit_user">
  Loading...
</Frame>

<a href="/users/2/edit" data-target="edit_user">
  Edit a different user
</a>
```

### transformProps and preserveURL

Each `router.visit()` can now take an additional option `transformProps`. This is a function you can use to transform the props before they are stored in the history entry. This makes it easy to implement features like infinite scrolling with state preservation spanning history navigation.

Normally, Inertia replaces the URL when making a call to `router.reload({data: {page: currentPage + 1}})`. This is not desirable when loading additional data for infinite scrolling. That's why `preserveURL` is introduced to preserve the URL when using the Inertia router to load more data.

```js
// load more posts and append them to props.posts
router.reload({
  data: {
    page: currentPage + 1
  },
  preserveURL: true,
  transformProps: (props) => {
    props.posts = [...posts, ...props.posts]
  }
})
```



### Global click handler

No need for `use:inertia` or `<Link>` tags anymore. All `<a>` tags are automatically handled by Inertia. To opt out, add the `rel="external"` attribute.

## Installing

To install, follow the guide on [inertiajs.com](https://inertiajs.com), but replace your `@inertiajs/[package]` imports with the corresponding `inertiax-[package]`.

## Contributing

To link this repo in your project for local development, clone it, then [build it](https://github.com/inertiajs/inertia/blob/master/.github/CONTRIBUTING.md#packages), and in your `package.json`, link it like this:

```js
{
  "devDependencies": {
    'inertiax-core': 'file:./repo/packages/core',
    'inertiax-svelte': 'file:./repo/packages/svelte',
    'inertiax-react': 'file:./repo/packages/react'
  }
}
```

Then run `npm install` again.

