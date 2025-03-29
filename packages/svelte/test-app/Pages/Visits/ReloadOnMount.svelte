<script>
import { router } from 'inertiax-svelte'
import { onMount } from 'svelte'

export let name = undefined;

onMount(() => {
    router.reload({only: ['name']})
})

</script>


<div>Name is {name}</div>
