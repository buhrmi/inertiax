<script lang="ts">
  import { Form, Link } from 'inertiax-svelte'

  interface Props {
    frame: 'left' | 'right'
    step: number
  }

  let { frame, step }: Props = $props()
  const otherFrame = frame === 'left' ? 'right' : 'left'

  $effect(() => {
    console.log(`Frame ${frame} step ${step}`)
  })
</script>

<div data-testid={frame + '-pane'}>
  <p data-testid={frame + '-step'}>{step}</p>

  <Link data-testid={frame + '-next-link'} href={`/svelte/multi-frame/${frame}`} data={{ step: step + 1 }}>
    Next ({frame})
  </Link>

  <Form data-testid={frame + '-form'} action={`/svelte/multi-frame/${frame}/submit`} method="post">

    <input type="hidden" name="step" value={step} />
    <button data-testid={frame + '-submit'} type="submit">Submit ({frame})</button>

  </Form>

  <Link data-testid={frame + '-cross-link'} href={`/svelte/multi-frame/${otherFrame}`} data={{ step: 99 }} frame={otherFrame}>
    Cross to {otherFrame}
  </Link>
</div>
