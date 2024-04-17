# Inertia with Frames

This is a fork of [Inertia](https://github.com/inertiajs/inertia) that adds support for the `<Frame>` component. Frames are currently only supported in Svelte 5 and React.

## What's a Frame?

Frames can be used to encapsulate an Inertia page within another Inertia page. This is useful for creating modal dialogs, wizards, search sidebars, overlay cards, etc. Don't worry: Besides the name and concept, it has nothing to do with conventional browser frames.

By default, hyperlinks and form submissions will render the response within the frame that contains the link or the form. To change the frame in which an Inertia response is rendered, do one of the following:

- Add a `data-target="frame-id"` attribute to an `a` tag.
- Pass a  `{target: frameId}` to `router.visit()` or `form.submit()`
- Specify the frame ID in an `X-Inertia-Frame` header from the server.

To target the top (main) frame, use `_top` as the frame ID.

Navigation within frames does not create new history entries. To enable this, a more substantial rewrite of the Inertia router would be required.

Frames are loaded when the component is mounted. That means, that only the initial frame placeholder content will be rendered during SSR.

## Additional features

This fork also adds the following features to make it easy to implement features like infinite scrolling.

### transformProps and preserveURL

Each `router.visit()` can now take an additional option `transformProps`. This is a function you can use to transform the props before they are stored in the history entry. This makes it easy to implement features like infinite scrolling that can also restore state upon navigation.

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

### Try locally

Clone this repo, [build it](https://github.com/inertiajs/inertia/blob/master/.github/CONTRIBUTING.md#packages), and in your `package.json`, link it like this:

```js
{
  "devDependencies": {
    '@inertiajs/core': 'file:./repo/packages/core',
    '@inertiajs/svelte': 'file:./repo/packages/svelte',
    '@inertiajs/react': 'file:./repo/packages/react'
  }
}
```

Then run `npm install` again.

### Example

```html
<script>
import { Frame } from '@inertiajs/svelte'
</script>

<Frame src="/users/1/edit" id="edit_user">
  Loading...
</Frame>

<a href="/users/2/edit" data-target="edit_user">
  Edit a different user
</a>
```
