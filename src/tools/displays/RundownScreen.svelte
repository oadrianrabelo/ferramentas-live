<script lang="ts">
  import ScreenChrome from './ScreenChrome.svelte';
  import { liveView, next, prev, rundown } from '../../lib/rundown.svelte';
  import { createNow } from '../../lib/timer.svelte';
  import { fmtDuration } from '../../lib/parse';

  const now = createNow(250);
  const lv = $derived(liveView(now.value));
  const cur = $derived(rundown.items[rundown.index]);
  const nxt = $derived(rundown.items[rundown.index + 1]);

  function onkey(e: KeyboardEvent) {
    if (e.key === 'ArrowRight' || e.key === 'PageDown') next();
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') prev();
  }
</script>

<svelte:window onkeydown={onkey} />

<ScreenChrome back="roteiro">
  <div class="rd">
    {#if lv && cur}
      <div class="top">
        <span>● NO AR {fmtDuration(Math.round(lv.elapsed))}</span>
        <span class:late={lv.delay > 30}>
          {lv.delay > 30
            ? `Atrasado ${fmtDuration(Math.round(lv.delay))}`
            : lv.delay < -30
              ? 'Adiantado'
              : 'No horário'}
        </span>
        <span>Término {lv.forecastEnd}</span>
      </div>
      <div class="cur">
        <div class="lbl">AGORA</div>
        <div class="title">{cur.title}</div>
        {#if cur.who}<div class="who">{cur.who}</div>{/if}
        <div class="time" class:over={lv.segRemaining < 0}>{fmtDuration(Math.round(lv.segRemaining))}</div>
        {#if cur.notes}<div class="notes">{cur.notes}</div>{/if}
      </div>
      {#if nxt}
        <div class="nxt"><span class="lbl">DEPOIS</span> {nxt.title}{nxt.who ? ` · ${nxt.who}` : ''}</div>
      {/if}
    {:else}
      <div class="cur"><div class="title">Aguardando o início da live…</div></div>
    {/if}
  </div>
</ScreenChrome>

<style>
  .rd {
    position: absolute;
    inset: 0;
    display: grid;
    grid-template-rows: auto 1fr auto;
    background: radial-gradient(circle at 20% 10%, #183064, #070c19 70%);
    color: #fff;
    font-family: Poppins, system-ui, sans-serif;
    padding: 4vh 5vw;
    container-type: size;
  }
  .top {
    display: flex;
    justify-content: space-between;
    gap: 2vw;
    font-size: 3.2vh;
    font-weight: 600;
    color: #c8d7f0;
    padding-left: 120px;
  }
  .top span:first-child {
    color: #ff6b6b;
  }
  .late {
    color: #ff6b6b;
  }
  .cur {
    align-self: center;
    text-align: center;
    display: grid;
    gap: 1.5vh;
  }
  .lbl {
    color: #f5c85a;
    font-size: 3vh;
    font-weight: 700;
    letter-spacing: 0.12em;
  }
  .title {
    font-size: min(9vh, 6vw);
    font-weight: 700;
    line-height: 1.1;
  }
  .who {
    font-size: 4.5vh;
    color: #c8d7f0;
  }
  .time {
    font-size: min(22vh, 15vw);
    font-weight: 700;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }
  .time.over {
    color: #ff6b6b;
  }
  .notes {
    font-size: 3.4vh;
    color: #f5c85a;
  }
  .nxt {
    font-size: 4vh;
    color: #c8d7f0;
    text-align: center;
    border-top: 1px solid rgb(255 255 255 / 0.15);
    padding-top: 2vh;
  }
</style>
