<script lang="ts">
  import ToolPage from '../lib/components/ToolPage.svelte';
  import Prompter from '../lib/components/Prompter.svelte';
  import Segmented from '../lib/components/Segmented.svelte';
  import Icon from '../lib/components/Icon.svelte';
  import { prompter as p } from '../lib/prompter.svelte';
  import { openDisplay, toggleFullscreen } from '../lib/platform';

  let pr: Prompter;
  let screen: HTMLDivElement;
  const words = $derived(p.text.split(/\s+/).filter(Boolean).length);

  function onkey(e: KeyboardEvent) {
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    const ctl = pr;
    if (e.code === 'Space' || e.key === 'k') {
      e.preventDefault();
      ctl.toggle();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      ctl.speed(0.5);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      ctl.speed(-0.5);
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') ctl.nudge(-3);
    else if (e.key === 'ArrowRight' || e.key === 'PageDown') ctl.nudge(3);
    else if (e.key === 'Home') ctl.restart();
    else if (e.key === 'f' || e.key === 'F') toggleFullscreen(screen);
  }
</script>

<svelte:window onkeydown={onkey} />

<ToolPage
  title="Teleprompter"
  lead="Toque no texto (ou Espaço) para iniciar e pausar. Arraste para voltar ou adiantar."
>
  {#snippet preview()}
    <div class="stage">
      <div class="screen" bind:this={screen}><Prompter bind:this={pr} /></div>
      <div class="row-actions">
        <button class="btn primary" onclick={() => pr.toggle()}><Icon name="play" />Iniciar / pausar</button>
        <button class="btn" onclick={() => pr.restart()}><Icon name="reset" />Do começo</button>
        <button class="btn icon-only" onclick={() => pr.speed(-0.5)} aria-label="Mais devagar">
          <Icon name="minus" />
        </button>
        <button class="btn icon-only" onclick={() => pr.speed(0.5)} aria-label="Mais rápido">
          <Icon name="plus" />
        </button>
        <button class="btn" onclick={() => toggleFullscreen(screen)}><Icon name="expand" />Tela cheia</button>
        <button class="btn" onclick={() => openDisplay('teleprompter', 'Teleprompter')}>
          <Icon name="external" />Outra janela
        </button>
      </div>
      <p class="hint">
        <kbd>Espaço</kbd> inicia/pausa · <kbd>↑</kbd>/<kbd>↓</kbd> velocidade · <kbd>←</kbd>/<kbd>→</kbd>
        volta/avança ·
        <kbd>Home</kbd> recomeça · <kbd>F</kbd> tela cheia. Funciona com passador de slides (PageUp/PageDown).
      </p>
    </div>
  {/snippet}

  <div class="panel stack">
    <h2>
      <span>Texto</span><span class="hint">
        {words} palavras · ~{Math.max(1, Math.round(words / 140))} min
      </span>
    </h2>
    <textarea bind:value={p.text} rows="12" aria-label="Texto do teleprompter"></textarea>
    <p class="hint">Dica: linhas começando com <b>#</b> viram títulos.</p>
  </div>

  <div class="panel stack">
    <h2>Leitura</h2>
    <label>
      Tamanho da letra · {p.fontSize}<input
        type="range"
        min="3"
        max="16"
        step="0.5"
        bind:value={p.fontSize}
      />
    </label>
    <label>
      Velocidade · {p.speed}<input type="range" min="1" max="20" step="0.5" bind:value={p.speed} />
    </label>
    <label>
      Espaço entre linhas · {p.lineHeight}<input
        type="range"
        min="1.1"
        max="2.2"
        step="0.05"
        bind:value={p.lineHeight}
      />
    </label>
    <label>Margens · {p.margin}%<input type="range" min="0" max="30" step="1" bind:value={p.margin} /></label>
    <div class="grid2">
      <Segmented
        label="Alinhamento"
        options={[
          { value: 'left', label: 'Esquerda' },
          { value: 'center', label: 'Centro' },
        ]}
        bind:value={p.align}
      />
      <Segmented
        label="Cores"
        options={[
          { value: 'escuro', label: 'Fundo preto' },
          { value: 'claro', label: 'Fundo branco' },
        ]}
        bind:value={p.theme}
      />
    </div>
    <label class="check">
      <input type="checkbox" bind:checked={p.mirror} /> Espelhar (para vidro de teleprompter)
    </label>
    <label class="check">
      <input type="checkbox" bind:checked={p.flipV} /> Inverter de cabeça para baixo
    </label>
    <label class="check"><input type="checkbox" bind:checked={p.guide} /> Linha-guia de leitura</label>
    <label class="check">
      <input type="checkbox" bind:checked={p.countdown} /> Contagem 3-2-1 antes de começar
    </label>
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
  }
  .screen:fullscreen {
    border-radius: 0;
  }
  label input[type='range'] {
    display: block;
    margin-top: 4px;
  }
</style>
