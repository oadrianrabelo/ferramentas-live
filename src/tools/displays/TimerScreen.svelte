<script lang="ts">
  import TimerFace from '../../lib/components/TimerFace.svelte';
  import ScreenChrome from './ScreenChrome.svelte';
  import { addMinutes, createNow, reset, toggle } from '../../lib/timer.svelte';

  const now = createNow();

  function onkey(e: KeyboardEvent) {
    if (e.code === 'Space') {
      e.preventDefault();
      toggle();
    } else if (e.key === 'r' || e.key === 'R') reset();
    else if (e.key === '+' || e.key === '=') addMinutes(1);
    else if (e.key === '-') addMinutes(-1);
  }
</script>

<svelte:window onkeydown={onkey} />

<ScreenChrome back="cronometro">
  <TimerFace now={now.value} />
</ScreenChrome>
