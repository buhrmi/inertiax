<script lang="ts">
  interface Props {
    frame: string
    step: number
  }

  let { frame, step = 0 }: Props = $props()

  const otherFrame = frame === 'updates' ? 'preserves' : 'updates'
</script>

<div data-testid={frame + '-pane'}>
  <p data-testid={frame + '-step'}>{step}</p>

  <a
    data-testid={frame + '-normal-link'}
    href={`/svelte/frame-preserve-url/pane/${frame}?step=${step + 1}`}
  >
    Normal link ({frame})
  </a>
  <a
    data-testid={frame + '-preserve-link'}
    href={`/svelte/frame-preserve-url/pane/${frame}?step=${step + 1}`}
    data-preserve-url
  >
    Preserve URL link ({frame})
  </a>
  <a
    data-testid={frame + '-update-link'}
    href={`/svelte/frame-preserve-url/pane/${frame}?step=${step + 1}`}
    data-preserve-url="false"
  >
    Preserve URL false link ({frame})
  </a>

  <a
    data-testid={frame + '-cross-frame-link'}
    href={`/svelte/frame-preserve-url/pane/${otherFrame}?step=${step + 1}`}
    data-frame={otherFrame}
  >
    Cross to {otherFrame}
  </a>
</div>
