<script lang="ts">
  import type { Snippet } from 'svelte';
  import Icon from './Icon.svelte';
  import { canShareFiles, copyBlob, saveBlob, shareBlob, stamp } from '../platform';
  import { toast } from '../stores.svelte';
  import { fontsReady } from '../canvas/assets.svelte';

  let {
    width,
    height,
    draw,
    filename,
    transparent = false,
    actions,
    below,
  }: {
    width: number;
    height: number;
    /** Chamado dentro de um efeito: tudo que for reativo e lido aqui redesenha a prévia sozinho. */
    draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
    filename: string;
    transparent?: boolean;
    actions?: Snippet;
    below?: Snippet;
  } = $props();

  let canvas: HTMLCanvasElement;
  let busy = $state(false);
  const shareable = canShareFiles();

  $effect(() => {
    void fontsReady();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // o tamanho muda conforme o formato escolhido
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
    ctx.save();
    draw(ctx, width, height);
    ctx.restore();
  });

  function toBlob(): Promise<Blob> {
    return new Promise((res, rej) =>
      canvas.toBlob((b) => (b ? res(b) : rej(new Error('Falha ao gerar a imagem'))), 'image/png'),
    );
  }

  function name() {
    return `${filename}-${stamp()}.png`;
  }

  async function run(fn: () => Promise<void>) {
    if (busy) return;
    busy = true;
    try {
      await fn();
    } catch (e) {
      console.error(e);
      toast.show('Algo deu errado. Tente de novo.', 'warn');
    } finally {
      busy = false;
    }
  }

  const download = () =>
    run(async () => {
      const r = await saveBlob(await toBlob(), name());
      if (r === 'saved') toast.show('Imagem salva!', 'ok');
      else if (r === 'downloaded') toast.show('Download iniciado.', 'ok');
    });

  const copy = () =>
    run(async () => {
      if (await copyBlob(await toBlob())) toast.show('Imagem copiada. É só colar (Ctrl+V).', 'ok');
      else toast.show('Este dispositivo não deixa copiar imagens. Use “Baixar”.', 'warn');
    });

  const share = () =>
    run(async () => {
      await shareBlob(await toBlob(), name());
    });

  export function getCanvas() {
    return canvas;
  }
</script>

<div class="stage">
  <div class="frame" class:checker={transparent}>
    <canvas bind:this={canvas} {width} {height} aria-label="Prévia da imagem"></canvas>
  </div>
  <div class="row-actions">
    <button class="btn primary" onclick={download} disabled={busy}><Icon name="download" />Baixar PNG</button>
    <button class="btn" onclick={copy} disabled={busy} title="Copiar para colar no OBS, WhatsApp etc.">
      <Icon name="copy" />Copiar
    </button>
    {#if shareable}
      <button class="btn" onclick={share} disabled={busy}><Icon name="share" />Compartilhar</button>
    {/if}
    {@render actions?.()}
  </div>
  {@render below?.()}
</div>

<style>
  .stage {
    display: grid;
    gap: 12px;
    min-width: 0;
  }
  .frame {
    display: grid;
    place-items: center;
    border-radius: var(--radius);
    background: var(--stage);
    border: 1px solid var(--line);
    padding: 10px;
    min-width: 0;
  }
  .frame.checker {
    background-color: #9aa3b5;
    background-image:
      linear-gradient(45deg, #b9c0cd 25%, transparent 25%),
      linear-gradient(-45deg, #b9c0cd 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #b9c0cd 75%),
      linear-gradient(-45deg, transparent 75%, #b9c0cd 75%);
    background-size: 24px 24px;
    background-position:
      0 0,
      0 12px,
      12px -12px,
      -12px 0;
  }
  canvas {
    display: block;
    max-width: 100%;
    max-height: min(68vh, 760px);
    width: auto;
    height: auto;
    border-radius: 6px;
    box-shadow: 0 8px 30px rgb(0 0 0 / 0.25);
  }
</style>
