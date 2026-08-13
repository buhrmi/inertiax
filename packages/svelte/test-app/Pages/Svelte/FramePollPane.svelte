<script lang="ts">
  import { usePoll } from 'inertiax-svelte'

  interface Props {
    polls: number
  }

  let { polls = 0 }: Props = $props()

  usePoll(200)
</script>

<div data-testid="frame-poll-pane">
  <span data-testid="polls">{polls}</span>
</div>
