<script lang="ts">
  import ToolPage from '../lib/components/ToolPage.svelte';
  import Icon from '../lib/components/Icon.svelte';
  import {
    chapters,
    endLive,
    goTo,
    isLive,
    liveView,
    next,
    plannedTimes,
    prev,
    resetLive,
    rundown,
    startLive,
    totalPlanned,
  } from '../lib/rundown.svelte';
  import { createNow } from '../lib/timer.svelte';
  import { fmtDuration, hhmmToMinutes, minutesToHhmm } from '../lib/parse';
  import { copyText, openDisplay, uid } from '../lib/platform';
  import { toast } from '../lib/stores.svelte';

  const now = createNow(250);
  const lv = $derived(liveView(now.value));
  const live = $derived(isLive());
  const times = $derived(plannedTimes());
  const total = $derived(totalPlanned());
  const plannedEnd = $derived(minutesToHhmm((hhmmToMinutes(rundown.plannedStart) ?? 0) + total));
  const cur = $derived(rundown.items[rundown.index]);
  const nxt = $derived(rundown.items[rundown.index + 1]);

  function add() {
    rundown.items.push({ id: uid(), title: 'Novo momento', minutes: 5, who: '', notes: '' });
  }
  function move(i: number, d: -1 | 1) {
    const j = i + d;
    if (j < 0 || j >= rundown.items.length) return;
    const arr = [...rundown.items];
    [arr[i], arr[j]] = [arr[j], arr[i]];
    rundown.items = arr;
  }
  async function copyChapters() {
    if (await copyText(chapters())) toast.show('Capítulos copiados! Cole na descrição do YouTube.', 'ok');
  }

  function onkey(e: KeyboardEvent) {
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (!rundown.startedAt) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === 'n') next();
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') prev();
  }
</script>

<svelte:window onkeydown={onkey} />

<ToolPage
  title="Roteiro"
  lead="Planeje os momentos da live e acompanhe ao vivo quanto falta, quem conduz e se está atrasado."
>
  {#snippet preview()}
    <div class="panel live" class:on={live}>
      {#if lv && cur}
        <div class="now-label">
          {rundown.endedAt ? 'Live encerrada' : `Agora · ${rundown.index + 1}/${rundown.items.length}`}
        </div>
        <div class="now-title">{cur.title}</div>
        {#if cur.who}<div class="who">{cur.who}</div>{/if}
        {#if !rundown.endedAt}
          <div class="seg-time" class:over={lv.segRemaining < 0}>
            {fmtDuration(Math.round(lv.segRemaining))}
          </div>
          <div class="bar">
            <span style:width={`${lv.segProgress * 100}%`} class:over={lv.segRemaining < 0}></span>
          </div>
          {#if cur.notes}<p class="notes">{cur.notes}</p>{/if}
          {#if nxt}<div class="next">Depois: <b>{nxt.title}</b>{nxt.who ? ` · ${nxt.who}` : ''}</div>{/if}
        {/if}
        <div class="stats">
          <span>No ar: <b>{fmtDuration(Math.round(lv.elapsed))}</b></span>
          <span class:late={lv.delay > 30} class:early={lv.delay < -30}>
            {lv.delay > 30 ? 'Atrasado' : lv.delay < -30 ? 'Adiantado' : 'No horário'}{Math.abs(lv.delay) > 30
              ? ` ${fmtDuration(Math.abs(Math.round(lv.delay)))}`
              : ''}
          </span>
          <span>Término: <b>{lv.forecastEnd}</b></span>
        </div>
        <div class="row-actions">
          {#if !rundown.endedAt}
            <button class="btn" onclick={() => prev()} disabled={rundown.index === 0}>
              <Icon name="left" />Anterior
            </button>
            <button class="btn primary big" onclick={() => next()}>
              {nxt ? 'Próximo' : 'Encerrar'}<Icon name={nxt ? 'skip' : 'check'} />
            </button>
            <button class="btn ghost" onclick={() => endLive()}>Encerrar</button>
          {:else}
            <button class="btn primary" onclick={copyChapters}><Icon name="copy" />Copiar capítulos</button>
          {/if}
          <button
            class="btn ghost danger"
            onclick={() => confirm('Zerar o acompanhamento da live?') && resetLive()}
          >
            <Icon name="reset" />Zerar
          </button>
        </div>
      {:else}
        <div class="now-label">Pronto para começar</div>
        <div class="now-title">{rundown.items.length} momentos · {fmtDuration(total * 60)}</div>
        <p class="hint">Início previsto às {rundown.plannedStart}, término às {plannedEnd}.</p>
        <div class="row-actions">
          <button class="btn primary big" onclick={() => startLive()}>
            <Icon name="play" />Começar a live
          </button>
        </div>
      {/if}
      <div class="row-actions">
        <button class="btn small" onclick={() => openDisplay('roteiro', 'Roteiro')}>
          <Icon name="external" size={16} />Tela para a equipe
        </button>
        <button class="btn small" onclick={copyChapters}>
          <Icon name="copy" size={16} />Capítulos do YouTube
        </button>
      </div>
      <p class="hint">
        Atalhos: <kbd>→</kbd> próximo · <kbd>←</kbd> anterior (funciona com passador de slides).
      </p>
    </div>
  {/snippet}

  <div class="panel stack">
    <h2>
      <span>Momentos · {fmtDuration(total * 60)}</span>
      <span class="row" style="gap:6px">
        <label for="r-start" style="margin:0">Início</label>
        <input
          id="r-start"
          type="time"
          bind:value={rundown.plannedStart}
          style="width:auto;min-height:32px;padding:4px 8px"
        />
      </span>
    </h2>
    <ol class="segs">
      {#each rundown.items as s, i (s.id)}
        <li
          class:cur={rundown.index === i && rundown.startedAt}
          class:past={rundown.startedAt && i < rundown.index}
        >
          <div class="seg-top">
            <span class="time">{times[i]}</span>
            <input type="text" bind:value={s.title} aria-label="Momento" class="title" />
            <input type="number" min="0" bind:value={s.minutes} aria-label="Minutos" class="min" />
            <span class="hint">min</span>
          </div>
          <div class="seg-bottom">
            <input type="text" bind:value={s.who} placeholder="Quem conduz" aria-label="Quem conduz" />
            <input type="text" bind:value={s.notes} placeholder="Observação" aria-label="Observação" />
            <span class="tools">
              {#if rundown.startedAt && !rundown.endedAt}
                <button
                  class="btn small ghost icon-only"
                  onclick={() => goTo(i)}
                  aria-label="Ir para este momento"
                >
                  <Icon name="play" size={14} />
                </button>
              {/if}
              <button
                class="btn small ghost icon-only"
                onclick={() => move(i, -1)}
                disabled={i === 0}
                aria-label="Subir"
              >
                <Icon name="up" size={16} />
              </button>
              <button
                class="btn small ghost icon-only"
                onclick={() => move(i, 1)}
                disabled={i === rundown.items.length - 1}
                aria-label="Descer"
              >
                <Icon name="down" size={16} />
              </button>
              <button
                class="btn small ghost icon-only"
                onclick={() => (rundown.items = rundown.items.filter((x) => x.id !== s.id))}
                aria-label="Remover"
              >
                <Icon name="trash" size={16} />
              </button>
            </span>
          </div>
        </li>
      {/each}
    </ol>
    <button class="btn" onclick={add}><Icon name="plus" />Momento</button>
  </div>
</ToolPage>

<style>
  .live {
    display: grid;
    gap: 10px;
  }
  .live.on {
    border-color: color-mix(in srgb, var(--danger) 55%, var(--line));
  }
  .now-label {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--gold);
    font-weight: 600;
  }
  .live.on .now-label::before {
    content: '● ';
    color: var(--danger);
  }
  .now-title {
    font-size: clamp(22px, 3.2vw, 34px);
    font-weight: 700;
    line-height: 1.15;
  }
  .who {
    color: var(--muted);
    font-weight: 500;
  }
  .seg-time {
    font-size: clamp(54px, 9vw, 110px);
    font-weight: 700;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }
  .seg-time.over {
    color: var(--danger);
  }
  .bar {
    height: 10px;
    border-radius: 99px;
    background: var(--field);
    overflow: hidden;
  }
  .bar span {
    display: block;
    height: 100%;
    background: var(--accent);
    transition: width 0.25s linear;
  }
  .bar span.over {
    background: var(--danger);
  }
  .notes {
    padding: 8px 12px;
    border-left: 3px solid var(--gold);
    background: var(--field);
    border-radius: 6px;
  }
  .next {
    color: var(--muted);
  }
  .stats {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    font-size: 14px;
    color: var(--muted);
  }
  .stats b {
    color: var(--ink);
  }
  .late {
    color: var(--danger);
    font-weight: 600;
  }
  .early {
    color: var(--ok);
    font-weight: 600;
  }
  .segs {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 8px;
  }
  .segs li {
    border: 1px solid var(--line);
    border-radius: 12px;
    padding: 8px;
    display: grid;
    gap: 6px;
    background: var(--surface-2);
  }
  .segs li.cur {
    border-color: var(--accent);
    box-shadow: 0 0 0 1px var(--accent) inset;
  }
  .segs li.past {
    opacity: 0.6;
  }
  .seg-top,
  .seg-bottom {
    display: flex;
    gap: 6px;
    align-items: center;
  }
  .seg-bottom input {
    font-size: 13px;
    min-height: 34px;
    padding: 6px 9px;
  }
  .time {
    font-variant-numeric: tabular-nums;
    font-size: 13px;
    color: var(--muted);
    width: 44px;
    flex: none;
  }
  .title {
    font-weight: 600;
  }
  .min {
    width: 64px;
    flex: none;
    text-align: center;
  }
  .tools {
    display: flex;
    flex: none;
  }
  @media (max-width: 520px) {
    .seg-bottom {
      flex-wrap: wrap;
    }
    .seg-bottom input {
      flex: 1 1 140px;
    }
  }
</style>
