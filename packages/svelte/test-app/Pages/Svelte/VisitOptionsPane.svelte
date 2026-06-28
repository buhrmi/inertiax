<script lang="ts">
  import { Form, Link } from 'inertiax-svelte'

  interface Props {
    frame: string
    step: number
  }

  let { frame, step }: Props = $props()

  $effect(() => {
    console.log(`VisitOptions frame ${frame} step ${step}`)
  })
</script>

<div data-testid={frame + '-pane'}>
  <p data-testid={frame + '-step'}>{step}</p>

  <Link data-testid={frame + '-next-link'} href={`/svelte/visit-options/${frame}`} data={{ step: step + 1 }}>
    Next ({frame})
  </Link>

  <Form data-testid={frame + '-form'} action={`/svelte/visit-options/${frame}/submit`} method="post">
    <input type="hidden" name="step" value={step} />
    <button data-testid={frame + '-submit'} type="submit">Submit ({frame})</button>
  </Form>
</div>
