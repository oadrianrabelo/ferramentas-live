<script lang="ts">
  import ToolPage from '../lib/components/ToolPage.svelte';
  import Segmented from '../lib/components/Segmented.svelte';
  import TimerFace from '../lib/components/TimerFace.svelte';
  import Icon from '../lib/components/Icon.svelte';
  import {
    addMinutes,
    beep,
    createNow,
    pause,
    reset,
    start,
    timer,
    toggle,
    view,
    type TimerMode,
  } from '../lib/timer.svelte';
  import { THEMES } from '../lib/canvas/themes';
  import { openDisplay, toggleFullscreen, keepAwake } from '../lib/platform';

  const now = createNow();
  const v = $derived(view(now.value));
  let faceEl: HTMLDivElement;

  // bipa quando chega a zero (só nesta janela, para não tocar no telão)
  let lastStatus = '';
  $effect(() => {
    const st = v.status;
    if (st === 'over' && lastStatus && lastStatus !== 'over' && lastStatus !== 'idle' && timer.beep) beep();
    lastStatus = st;
  });

  $effect(() => {
    if (!timer.running) return;
    let release = () => {};
    keepAwake().then((r) => (release = r));
    return () => release();
  });

  let minutes = $state(Math.floor(timer.duration / 60));
  let seconds = $state(timer.duration % 60);
  function applyDuration() {
    timer.duration = Math.max(1, (Number(minutes) || 0) * 60 + (Number(seconds) || 0));
  }
  function preset(m: number) {
    reset();
    timer.duration = m * 60;
    minutes = m;
    seconds = 0;
  }
  $effect(() => {
    // mantém os campos em dia quando a duração muda por outro caminho (+1 min, outra janela)
    minutes = Math.floor(timer.duration / 60);
    seconds = timer.duration % 60;
  });

  const MODES: { value: TimerMode; label: string }[] = [
    { value: 'countdown', label: 'Contagem' },
    { value: 'target', label: 'Até um horário' },
    { value: 'stopwatch', label: 'Cronômetro' },
    { value: 'clock', label: 'Relógio' },
  ];

  const LABELS: Record<TimerMode, string[]> = {
    countdown: ['Tempo restante', 'Tempo do pregador', 'Intervalo', 'Voltamos em'],
    target: ['A live começa em', 'Começamos em', 'Faltam'],
    stopwatch: ['Tempo de live', 'No ar há', ''],
    clock: [],
  };

  function changeMode(m: TimerMode) {
    reset();
    if (m === 'target' && timer.label === 'Tempo restante') timer.label = 'A live começa em';
    if (m === 'countdown' && timer.label === 'A live começa em') timer.label = 'Tempo restante';
    if (m === 'stopwatch') timer.label = 'Tempo de live';
  }

  function onkey(e: KeyboardEvent) {
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (e.code === 'Space') {
      e.preventDefault();
      toggle();
    } else if (e.key === 'r' || e.key === 'R') reset();
    else if (e.key === '+' || e.key === '=') addMinutes(1);
    else if (e.key === '-') addMinutes(-1);
    else if (e.key === 'f' || e.key === 'F') toggleFullscreen(faceEl);
  }
</script>

<svelte:window onkeydown={onkey} />

<ToolPage
  title="Cronômetro"
  lead="Contagem para o início, tempo de fala com alertas coloridos, cronômetro de live e relógio."
>
  {#snippet preview()}
    <div class="stage">
      <div class="screen" bind:this={faceEl}><TimerFace now={now.value} /></div>
      <div class="row-actions">
        {#if timer.mode === 'countdown' || timer.mode === 'stopwatch'}
          <button class="btn primary big" onclick={() => (timer.running ? pause() : start())}>
            <Icon name={timer.running ? 'pause' : 'play'} />{timer.running ? 'Pausar' : 'Iniciar'}
          </button>
          <button class="btn big" onclick={reset}><Icon name="reset" />Zerar</button>
        {/if}
        {#if timer.mode === 'countdown' || timer.mode === 'target'}
          <button class="btn big" onclick={() => addMinutes(-1)} aria-label="Menos um minuto">−1 min</button>
          <button class="btn big" onclick={() => addMinutes(1)} aria-label="Mais um minuto">+1 min</button>
        {/if}
      </div>
      <div class="row-actions">
        <button class="btn" onclick={() => openDisplay('cronometro', 'Cronômetro')}>
          <Icon name="external" />Abrir em outra janela
        </button>
        <button class="btn" onclick={() => toggleFullscreen(faceEl)}><Icon name="expand" />Tela cheia</button>
      </div>
      <p class="hint">
        Atalhos: <kbd>Espaço</kbd> inicia/pausa · <kbd>R</kbd> zera · <kbd>+</kbd>/<kbd>−</kbd> minuto ·
        <kbd>F</kbd> tela cheia. A outra janela acompanha tudo em tempo real — arraste para o telão ou capture no
        OBS.
      </p>
    </div>
  {/snippet}

  <div class="panel stack">
    <h2>Modo</h2>
    <Segmented label="Modo" options={MODES} bind:value={timer.mode} onchange={changeMode} />
    {#if timer.mode === 'countdown'}
      <div class="dur">
        <div>
          <label for="t-m">Minutos</label><input
            id="t-m"
            type="number"
            min="0"
            max="600"
            bind:value={minutes}
            onchange={applyDuration}
          />
        </div>
        <div>
          <label for="t-s">Segundos</label><input
            id="t-s"
            type="number"
            min="0"
            max="59"
            bind:value={seconds}
            onchange={applyDuration}
          />
        </div>
      </div>
      <div class="row">
        {#each [1, 3, 5, 10, 15, 20, 30, 45] as m (m)}
          <button class="btn small" onclick={() => preset(m)}>{m} min</button>
        {/each}
      </div>
    {:else if timer.mode === 'target'}
      <div>
        <label for="t-t">Horário de início</label>
        <input id="t-t" type="time" bind:value={timer.target} />
      </div>
    {/if}
  </div>

  {#if timer.mode !== 'clock'}
    <div class="panel stack">
      <h2>Texto</h2>
      <div>
        <label for="t-l">Frase acima do tempo</label>
        <input id="t-l" type="text" bind:value={timer.label} maxlength="40" />
        <div class="row chips">
          {#each LABELS[timer.mode] as l (l)}<button class="btn small" onclick={() => (timer.label = l)}>
              {l || '(sem frase)'}
            </button>{/each}
        </div>
      </div>
      {#if timer.mode !== 'stopwatch'}
        <label class="check">
          <input type="checkbox" bind:checked={timer.overtime} /> Continuar contando depois do zero (tempo extra)
        </label>
        {#if !timer.overtime}
          <div>
            <label for="t-e">Mensagem no fim</label><input
              id="t-e"
              type="text"
              bind:value={timer.endText}
              maxlength="30"
            />
          </div>
        {/if}
      {/if}
    </div>
  {/if}

  {#if timer.mode === 'countdown' || timer.mode === 'target'}
    <div class="panel stack">
      <h2>Alertas</h2>
      <div class="grid2">
        <div>
          <label for="t-w">Amarelo quando faltar (s)</label>
          <input id="t-w" type="number" min="0" bind:value={timer.warn} />
        </div>
        <div>
          <label for="t-d">Vermelho quando faltar (s)</label>
          <input id="t-d" type="number" min="0" bind:value={timer.danger} />
        </div>
      </div>
      <label class="check">
        <input type="checkbox" bind:checked={timer.beep} /> Bipar ao zerar (só nesta janela)
      </label>
    </div>
  {/if}

  <div class="panel stack">
    <h2>Visual</h2>
    <select bind:value={timer.theme} aria-label="Tema">
      {#each THEMES.filter((t) => !t.transparent) as t (t.id)}<option value={t.id}>{t.name}</option>{/each}
    </select>
    <label class="check"><input type="checkbox" bind:checked={timer.showLogo} /> Mostrar logo</label>
  </div>
</ToolPage>

<style>
  .stage {
    display: grid;
    gap: 12px;
  }
  .screen {
    aspect-ratio: 16 / 9;
    border-radius: var(--radius);
    overflow: hidden;
    border: 1px solid var(--line);
    background: #000;
  }
  .screen:fullscreen {
    border-radius: 0;
    border: 0;
  }
  .dur {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    max-width: 320px;
  }
  .chips {
    margin-top: 8px;
    gap: 6px;
  }
</style>
