<script>
  import { page } from 'inertiax-svelte'

  const results = $derived(page.props.results)
</script>

<div id="results-data">{results.data.join(', ')}</div>
<div id="results-page">Page: {results.page}</div>
