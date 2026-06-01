<script lang="ts">
  import { router } from 'inertiax-svelte'

  const visitDump = (e: Event) => {
    e.preventDefault()
    router.visit('/dump/get')
  }

  const throwErrorOnSuccess = (e: Event) => {
    e.preventDefault()

    router.visit('/visits/after-error/2', {
      onSuccess: () => {
        throw new Error('Error after visit')
      },
    })
  }
</script>

<div>
  <a href={'#'} onclick={visitDump}> Visit dump page </a>

  <a href={'#'} onclick={throwErrorOnSuccess}> Throw error on success </a>
</div>
