<script lang="ts">
  import RaffleBoard from '../../lib/components/RaffleBoard.svelte';
  import ScreenChrome from './ScreenChrome.svelte';
  import { drawWinner, raffle, SPIN_MS } from '../../lib/raffle.svelte';
  import { createNow } from '../../lib/timer.svelte';

  const now = createNow(50);

  function onkey(e: KeyboardEvent) {
    if ((e.code === 'Space' || e.key === 'Enter') && now.value > raffle.draw.at + SPIN_MS) {
      e.preventDefault();
      drawWinner();
    }
  }
</script>

<svelte:window onkeydown={onkey} />

<ScreenChrome back="sorteio">
  <RaffleBoard now={now.value} />
</ScreenChrome>
