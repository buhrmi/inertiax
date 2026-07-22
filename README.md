![X](https://github.com/buhrmi/inertiax-ui/blob/main/playground/public/logo.png?raw=true)

# Inertia X

Inertia X is a fork of [Inertia.js](https://inertiajs.com/) that adds multi-frame support and a global click handler to the Svelte adapter.

## What is Inertia.js?

[Inertia.js](https://inertiajs.com/) lets you build single-page apps using classic server-side routing and controllers — no API needed. You write your backend routing and controllers like you always have, and Inertia handles the navigation, component swapping, and history management. Think of it as the glue between your server-side framework (Laravel, Rails, etc.) and your Svelte components.

## What does Inertia X add?

- **`<Frame>` component** — multiple independent Inertia page regions on the same document. Each frame has its own router, history, and page state. Links and forms inside one frame only update that frame.
- **Global click handler** — plain `<a>` clicks inside a frame are automatically intercepted and turned into frame-scoped Inertia visits. No need to wrap every link in a `<Link>` component.
- **`visitOptions` prop** — set default visit behavior per frame (replace vs push, scroll preservation, URL updates).
- **History-aware mount** — Frames restore their previous page and scroll position from the browser history state on mount. This means frames survive browser reloads and remount without losing props.

## Demo?

For a demo, you can play around with [Inertia X UI](https://github.com/buhrmi/inertiax-ui), a UI library built on Inertia X.

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

The most common use case: a form inside a modal that should update the main page on success. Pass `frame: "_top"` to tell Inertia X to apply the response to the top frame instead of the current one.

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

`frame: "_top"` handles the **success** case — the response lands in the top frame. But if validation fails and your controller calls `redirect_back`, you want the errors to render back inside the modal, not in `_top`. This next section explains how to do that.

### Handling validation errors in the right frame

Every Inertia X request includes an `X-Inertia-Frame` header with the originating frame's id. The server can return an `X-Inertia-Frame` response header to override where the response lands — this is what makes the `frame: "_top"` example above work.

| Header | Direction | Purpose |
|---|---|---|
| `X-Inertia-Frame` | Request | Frame that initiated the visit |
| `X-Inertia-Frame` | Response | Override which frame receives the response |
| `X-Inertia-Referer` | Request | Originating frame's URL, for `redirect_back` |

When a form in a nested frame submits with `frame: "_top"` and validation fails, `redirect_back` needs to follow the frame's URL (`X-Inertia-Referer`) — not the host page's `Referer` — and route the response back to the originating frame. The Rails initializer below handles both.

#### Rails initializer

Add this to get `inertia: { frame: "_top" }` in `redirect_to` and frame-aware `redirect_back`:

```ruby
# config/initializers/inertia_rails_frame.rb
# frozen_string_literal: true

module InertiaFrameExtension
  def self.prepended(base)
    base.singleton_class.prepend(Module.new do
      def included(controller_class)
        super
        controller_class.before_action :set_inertia_frame_header
      end
    end)
  end

  private

  def capture_inertia_session_options(options)
    super
    return unless (inertia = options[:inertia])
    session[:inertia_frame] = inertia[:frame] if inertia.key?(:frame)
  end

  def set_inertia_frame_header
    response["X-Inertia-Frame"] = session[:inertia_frame] if session[:inertia_frame]
  end

  def redirect_back(**options)
    if (inertia_referer = request.headers["X-Inertia-Referer"])
      frame = request.headers["X-Inertia-Frame"]
      session[:inertia_frame] = frame
      redirect_to inertia_referer, **options
    else
      super
    end
  end
end

module InertiaFrameMiddlewareExtension
  def response
    status, headers, body = super
    request = ActionDispatch::Request.new(@env)
    request.session.delete(:inertia_frame) unless keep_inertia_session_options?(status) || !request.session.loaded?
    [status, headers, body]
  end
end

Rails.application.config.to_prepare do
  InertiaRails::Controller.prepend(InertiaFrameExtension)
  InertiaRails::Middleware::InertiaRailsRequest.prepend(InertiaFrameMiddlewareExtension)
end
```

With the initializer in place, a controller action like this just works:

```ruby
def create
  @user = User.new(user_params)

  if @user.save
    redirect_to dashboard_root_path, inertia: { frame: "_top" }
  else
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
```

Use `onClickLink` to intercept before navigation. Call `event.preventDefault()` to stop it.

```svelte
<Frame onClickLink={(e, href) => { if (href.startsWith('/admin')) e.preventDefault() }} />
```
