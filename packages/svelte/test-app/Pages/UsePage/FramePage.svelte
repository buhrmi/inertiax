<script lang="ts">
  import { Frame, usePage } from 'inertiax-svelte'

  const page = usePage()
</script>

<div>
  <h2>Frame Page</h2>
  <p data-testid="top-url">Top URL: {page.url}</p>
  <p data-testid="top-component">Top component: {page.component}</p>

  <a data-testid="top-nav" href="/use-page/frame-page?nav=1" use:inertia>Top navigate</a>

  <hr />

  <Frame src="/use-page/frame-pane" />
</div>
