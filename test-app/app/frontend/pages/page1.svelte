<script>
  import { useForm } from 'inertiax-svelte'

  const form = useForm()
</script>
On Page 1

<form on:submit|preventDefault={$form.get('/page2')}>
  <button>Go to Page 2</button>
</form>

<a href="/page3">Go to Page 3</a>