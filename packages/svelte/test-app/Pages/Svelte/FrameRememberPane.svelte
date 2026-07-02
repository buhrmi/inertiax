<script lang="ts">
  import { useRemember } from 'inertiax-svelte'

  const state = useRemember({ count: 0 }, 'counter')
</script>

<div data-testid="frame-remember-pane">
  <p data-testid="remember-count">{state.count}</p>
  <button data-testid="remember-increment" onclick={() => state.count++}>
    Increment
  </button>
</div>
