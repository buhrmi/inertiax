<script>
  import App from './App.svelte'
  const {id, initialPage} = $props()
</script>

<div data-server-rendered="true" {id} data-page={JSON.stringify(initialPage)}>
  <App />
</div>
