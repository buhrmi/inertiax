<script>
  import { router } from 'inertiax-svelte'

  const defaultHeadersMethod = () => {
    router.visit('/dump/get')
  }

  const visitWithCustomHeaders = () => {
    router.visit('/dump/get', {
      headers: {
        foo: 'bar',
      },
    })
  }

  const getMethod = () => {
    router.get(
      '/dump/get',
      {},
      {
        headers: {
          bar: 'baz',
        },
      },
    )
  }

  const postMethod = () => {
    router.post(
      '/dump/post',
      {},
      {
        headers: {
          baz: 'foo',
        },
      },
    )
  }

  const putMethod = () => {
    router.put(
      '/dump/put',
      {},
      {
        headers: {
          foo: 'bar',
        },
      },
    )
  }

  const patchMethod = () => {
    router.patch(
      '/dump/patch',
      {},
      {
        headers: {
          bar: 'baz',
        },
      },
    )
  }

  const deleteMethod = () => {
    router.delete('/dump/delete', {
      headers: {
        baz: 'foo',
      },
    })
  }

  const overridden = () => {
    router.post(
      '/dump/post',
      {},
      {
        headers: {
          bar: 'baz',
          'X-Requested-With': 'custom',
        },
      },
    )
  }
</script>

<div>
  <span class="text">This is the page that demonstrates passing custom headers through manual visits</span>

  <a href="#" on:click={defaultHeadersMethod} class="default">Standard visit Link</a>

  <a href="#" on:click={visitWithCustomHeaders} class="visit">Specific visit Link</a>
  <a href="#" on:click={getMethod} class="get">GET Link</a>
  <a href="#" on:click={postMethod} class="post">POST Link</a>
  <a href="#" on:click={putMethod} class="put">PUT Link</a>
  <a href="#" on:click={patchMethod} class="patch">PATCH Link</a>
  <a href="#" on:click={deleteMethod} class="delete">DELETE Link</a>

  <a href="#" on:click={overridden} class="overridden">Overriden Link</a>
</div>
