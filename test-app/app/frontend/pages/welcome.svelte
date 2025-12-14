<script>
  import { Frame } from 'inertiax-svelte'
</script>

<div id="frame1">
  <Frame src="/page1" />
</div>

<style>
  #frame1, #frame2 {
    display: inline-block;
    border: 1px solid black;
    margin: 10px;
    padding: 10px;
  }
</style>
