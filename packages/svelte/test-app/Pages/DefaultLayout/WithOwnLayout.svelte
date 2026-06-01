<script module lang="ts">
  import PageLayout from '@/Layouts/PageLayout.svelte'

  export const layout = PageLayout
</script>

<script lang="ts">
  import { inertia } from 'inertiax-svelte'
</script>

<div>
  <span id="text">DefaultLayout/WithOwnLayout</span>
  <a href="/default-layout" use:inertia>Back to Index</a>
</div>
