<script>
  import { inertia, usePoll } from 'inertiax-svelte'

  usePoll(500, {
    only: ['custom_prop'],
    onFinish() {
      console.log('hook poll finished')
    },
  })
</script>

<a href="/" use:inertia>Home</a>
