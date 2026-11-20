<script lang="ts">
  import Prompter from '../../lib/components/Prompter.svelte';
  import ScreenChrome from './ScreenChrome.svelte';
  import Icon from '../../lib/components/Icon.svelte';

  let pr: Prompter;

  function onkey(e: KeyboardEvent) {
    if (e.code === 'Space' || e.key === 'k') {
      e.preventDefault();
      pr.toggle();
    } else if (e.key === 'ArrowUp') pr.speed(0.5);
    else if (e.key === 'ArrowDown') pr.speed(-0.5);
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') pr.nudge(-3);
    else if (e.key === 'ArrowRight' || e.key === 'PageDown') pr.nudge(3);
    else if (e.key === 'Home') pr.restart();
  }
</script>

<svelte:window onkeydown={onkey} />

<ScreenChrome back="teleprompter">
  <Prompter bind:this={pr} />
  {#snippet tools()}
    <button class="cbtn" onclick={() => pr.speed(-0.5)} aria-label="Mais devagar">
      <Icon name="minus" />
    </button>
    <button class="cbtn" onclick={() => pr.speed(0.5)} aria-label="Mais rápido"><Icon name="plus" /></button>
    <button class="cbtn" onclick={() => pr.restart()} aria-label="Do começo"><Icon name="reset" /></button>
  {/snippet}
</ScreenChrome>
