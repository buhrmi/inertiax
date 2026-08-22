![X](https://github.com/buhrmi/inertiax-ui/blob/main/playground/public/logo.png?raw=true)

# Inertia X

Inertia X is a (Svelte-only) fork of [Inertia.js](https://inertiajs.com/) that replaces the singleton router with an instantiable version. This enables the following features:

- **`<Frame>` component** — multiple independent Inertia page regions on the same document. Each frame has its own router, history, and page state. Links and forms inside one frame only update that frame. Useful for modals, sidebars, or mobile UIs that quickly switch between screens.
- **Global click handler** — plain `<a>` clicks inside a frame are automatically intercepted and turned into frame-scoped Inertia visits. No need to wrap every link in a `<Link>` component.

## See it in action

You can see frames in action in the [Inertia X UI playground](https://github.com/buhrmi/inertiax-ui), a work-in-progress UI library built on Inertia X.

## Installation

### 1. Replace the packages

Remove the official Inertia packages and install Inertia X:

```bash
# npm
npm remove @inertiajs/svelte @inertiajs/vite @inertiajs/core
npm install inertiax-svelte inertiax-vite inertiax-core

# pnpm
pnpm remove @inertiajs/svelte @inertiajs/vite @inertiajs/core
pnpm add inertiax-svelte inertiax-vite inertiax-core
```

### 2. Update your imports

Find and replace all occurrences in your source files:

| Before | After |
|---|---|
| `from '@inertiajs/svelte'` | `from 'inertiax-svelte'` |
| `from '@inertiajs/core'` | `from 'inertiax-core'` |
| `from '@inertiajs/vite'` | `from 'inertiax-vite'` |

That's it. Now you're ready to use all the new features.

## &lt;Frame&gt; component

```svelte
<script>
  import { Frame } from 'inertiax-svelte'
</script>

<Frame id="sidebar" src="/users/42/edit">
  <p>Loading user...</p>
</Frame>
```

### Frame Props

| Prop | Type | Description |
|---|---|---|
| `id` | `string` | `src` value, then auto-generated | Unique frame id. Deterministic when derived from `src` — frames with the same `src` share history state across remounts. |
| `src` | `string` | URL to load when the frame mounts (useful for lazy-loading frame content). |
| `router` | `Router` | Optional router instance to control this frame. If omitted, the frame creates its own router with the frame id. |
| `initialComponent` | `ResolvedComponent` | Initial resolved component to render before or without loading from `src`. |
| `initialPage` | `Page` | Initial Inertia page payload for the frame. |
| `resolveComponent` | `ComponentResolver` | Component resolver for frame pages. Required unless inherited from a parent frame context. |
| `defaultLayout` | `(name: string, page: Page) => unknown` | Fallback layout resolver used when the page does not provide its own layout. |
| `renderLayout` | `boolean` | Controls whether page layouts are applied inside this frame. Defaults to `true` for the top frame and `false` for nested frames. |
| `onClickLink` | `(event: MouseEvent, href: string) => void` | Called when a plain same-origin `<a>` inside the frame is clicked. Call `event.preventDefault()` to stop the default frame navigation. |
| `forceRequest` | `boolean` | When `true`, always fetches fresh data on mount instead of restoring from the history stack. Defaults to `false`. |
| `visitOptions` | `VisitOptions` | Default visit options applied to all navigations within this frame. Link/form-level options take precedence. Defaults per frame: `{ replace: true, updateBrowserUrl: false }` (non-top) / `{ replace: false, updateBrowserUrl: true }` (top). |
| `children` | `Snippet` | Fallback/loading content rendered when no frame page is available yet. |

All other props (restProps) are forwarded to the rendered page component.

### Accessing the router

Within a frame, call `useFrameRouter()` to access its router. The global top-level router is still available via `import { router } from 'inertiax-svelte'`.

```svelte
<script lang="ts">
  import { useFrameRouter } from 'inertiax-svelte'

  const router = useFrameRouter()

  function nextStep() {
    router.get(`/wizard/step-2`)
  }
</script>

<button on:click={nextStep}>Next step</button>
```

You can also access the frame id, router, and page store together via the frame context:

```svelte
<script>
  import { useFrameContext } from 'inertiax-svelte'

  const { id, page, router } = useFrameContext()
</script>
```

### Default visit behavior

Non-top frames use different defaults than the top frame to work well as embedded regions:

| Option | Top frame (`_top`) | Non-top frame |
|---|---|---|
| `replace` | `false` (push history) | `true` (replace history) |
| `updateBrowserUrl` | `true` | `false` |

Override either by passing them explicitly in the frame's `visitOptions` prop, or per-link/per-form in your visit calls.

### Scroll regions

When a frame navigates, the closest ancestor element with the `scroll-region` attribute is automatically scrolled to the top. This makes it easy to wrap a frame in a scrollable container:

```svelte
<div scroll-region class="overflow-y-auto h-96">
  <Frame src="/long-content" />
</div>
```

On back/forward navigation, the scroll position is restored. Outer `scroll-region` ancestors and the document scroll position are not affected.

### Targeting another frame

Inertia X introduces a new `frame` visit option that tells the response which frame to update. This is useful when you want a navigation inside one frame to update a different one.

```svelte
<a href="/users/4/details" use:inertia={{frame: "sidePanel"}}>
  Show Details
</a>
```

### Handling validation errors in the right frame

Sometimes however, you might want to override in which frame the response should be rendered. For example, take this form:

```svelte
<script>
  import { Form } from 'inertiax-svelte'

  const { close } = $props()
</script>

<Form action="/users" method="post" options={{ frame: "_top" }}>
  {#snippet children({ errors })}
    <Input name="user.email" label="Email" {errors} />
    <Input name="user.password" label="Password" type="password" {errors} />
    <button type="submit">Create account</button>
  {/snippet}
</Form>
```

`frame: "_top"` handles the **success** case — the response lands in the top frame. But if validation fails and your controller calls `redirect_back`, you want the errors to render back inside the modal, not in `_top`. To do that, you have to specify the modal's frame id in the response header.

Every Inertia X request includes an `X-Inertia-Frame` header with the originating frame's id. The server can return an `X-Inertia-Frame` response header to override where the response lands — this is what makes the `frame: "_top"` example above work.

| Header | Direction | Purpose |
|---|---|---|
| `X-Inertia-Frame` | Request | Frame that initiated the visit |
| `X-Inertia-Frame` | Response | Override which frame receives the response |
| `X-Inertia-Referer` | Request | Originating frame's URL, for `redirect_back` |

When a form in a nested frame submits with `frame: "_top"` and validation fails, `redirect_back` needs to follow the frame's URL (`X-Inertia-Referer`) — not the host page's `Referer` — and route the response back to the originating frame. Here is a simple recipe how you can do this with a few controller methods:

```ruby
class ApplicationController < ActionController::Base
  before_action :set_inertia_frame_header

  private
  def set_inertia_frame_header
    response["X-Inertia-Frame"] = session.delete(:inertia_frame) if session[:inertia_frame]
  end

  def redirect_back(**options)
    if inertia_referer = request.headers["X-Inertia-Referer"]
      session[:inertia_frame] = request.headers["X-Inertia-Frame"]
      redirect_to inertia_referer, **options
    else
      super
    end
  end
end

```

With the controller methods in place, a controller action like this just works:

```ruby
def create
  @user = User.new(user_params)

  if @user.save
    # will render the result in the `_top` frame
    redirect_to dashboard_root_path
  else
    # will render the result in the originating frame
    redirect_back inertia: { errors: @user.errors }
  end
end
```

On success the response lands in `_top`. On failure `redirect_back` follows the modal's URL and routes the validation errors back to the modal.

## Global click handler

Plain `<a>` clicks inside a frame are intercepted automatically — no `<Link>` component needed.

**Intercepted:** same-origin links, left-clicks without modifier keys.

**Ignored:** missing/fragment links, `mailto:`/`tel:`, `target`, `download`, `data-inertia-ignore`, cross-origin links.

```html
<!-- Native browser navigation -->
<a href="/non-inertia" data-inertia-ignore>External</a>

<!-- POST request -->
<a href="/logout" data-method="post">Logout</a>

<!-- Replace history instead of push -->
<a href="/settings" data-replace>Settings</a>

<!-- Target a different frame -->
<a href="/users/42" data-frame="details">View user</a>
```

Use `onClickLink` to intercept before navigation. Call `event.preventDefault()` to stop it.

```svelte
<Frame onClickLink={(e, href) => { if (href.startsWith('/admin')) e.preventDefault() }} />
```

## Events

Every Inertia event carries the originating `frame` in its detail. Events with a `visit` object expose it via `detail.visit.frame`; all others have `detail.frame`.

| Event | Frame source |
|---|---|
| `inertia:navigate` | `detail.frame` |
| `inertia:clientVisit` | `detail.frame` |
| `inertia:success` | `detail.frame` |
| `inertia:error` | `detail.frame` |
| `inertia:beforeUpdate` | `detail.frame` |
| `inertia:flash` | `detail.frame` |
| `inertia:progress` | `detail.frame` |
| `inertia:httpException` | `detail.frame` |
| `inertia:networkError` | `detail.frame` |
| `inertia:location` | `detail.frame` |
| `inertia:before` | `detail.visit.frame` |
| `inertia:start` | `detail.visit.frame` |
| `inertia:finish` | `detail.visit.frame` |
| `inertia:prefetched` | `detail.visit.frame` |
| `inertia:prefetching` | `detail.visit.frame` |

The `frame` always reflects where the page change actually occurred - even when the server overrides the target via `X-Inertia-Frame`.

### Frame-scoped listeners

Use `router.on()` to listen to events for a specific frame;

```ts
import { useFrameRouter } from 'inertiax-svelte'

const myRouter = useFrameRouter()

myRouter.on('navigate', (event) => {
  // Only fires for navigations in this frame
  console.log(event.detail.page.url)
})
```

To listen globally (all frames), use `document.addEventListener` directly.
