<script module>
  export { default as layout } from '../Components/Layout.svelte'
</script>

<script>
  import { inertia } from 'inertiax-svelte'

  let { appName } = $props()
</script>

<svelte:head>
  <title>Home - {appName}</title>
</svelte:head>

<h1 class="text-3xl">Home</h1>

<p class="mt-6">
  <a href="/article#far-down" use:inertia class="text-blue-700 underline">Link to bottom of article page</a>
</p>
