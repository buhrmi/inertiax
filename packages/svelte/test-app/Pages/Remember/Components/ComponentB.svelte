<script>
  import { useRemember } from 'inertiax-svelte'

  let untracked = ''

  const data = useRemember(
    {
      name: '',
      remember: false,
    },
    'Example/ComponentB',
  )
</script>

<div {...$$restProps}>
  <span>This component uses a string 'key' for the remember functionality.</span>
  <label>
    Full Name
    <input type="text" class="b-name" name="full_name" bind:value={$data.name} />
  </label>
  <label>
    Remember Me
    <input type="checkbox" class="b-remember" name="remember" bind:checked={$data.remember} />
  </label>
  <label>
    Remember Me
    <input type="text" class="b-untracked" name="untracked" bind:value={untracked} />
  </label>
</div>
