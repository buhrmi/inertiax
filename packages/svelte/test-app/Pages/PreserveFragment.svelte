<script lang="ts">
  import { inertia, usePage } from 'inertiax-svelte'
  import { router } from 'inertiax-svelte'

  const page = usePage()

  const visitWithFragment = (e: MouseEvent) => {
    e.preventDefault()
    router.visit('/preserve-fragment/redirect#my-fragment')
  }
</script>

<div>
  <span id="current-url">{page.url}</span>

  <a href="/preserve-fragment/redirect#my-fragment" use:inertia id="link-with-fragment">Link with fragment</a>

  <a href={'#'} onclick={visitWithFragment} id="manual-visit-with-fragment">Manual visit with fragment</a>
</div>
