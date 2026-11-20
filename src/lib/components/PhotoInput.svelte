<script lang="ts">
  import Icon from './Icon.svelte';
  import { fileToDataUrl, getImage } from '../canvas/assets.svelte';
  import { drawCover, type Crop } from '../canvas/draw';
  import { toast } from '../stores.svelte';

  let {
    src = $bindable(),
    crop = $bindable(),
    label = 'Foto',
    maxSide = 640,
    round = true,
    png = false,
  }: {
    src: string | null;
    crop?: Crop;
    label?: string;
    maxSide?: number;
    round?: boolean;
    png?: boolean;
  } = $props();

  let input: HTMLInputElement;
  let thumb: HTMLCanvasElement | undefined = $state();

  $effect(() => {
    const img = getImage(src);
    const ctx = thumb?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, 128, 128);
    if (img) drawCover(ctx, img, 0, 0, 128, 128, crop ? { ...crop } : undefined);
  });
  let over = $state(false);
  let drag: { x: number; y: number; ox: number; oy: number } | null = null;

  async function load(file: File | undefined | null) {
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.show('Esse arquivo não é uma imagem.', 'warn');
    try {
      src = await fileToDataUrl(file, maxSide, png ? 'image/png' : 'image/jpeg');
      if (crop) crop = { zoom: 1, ox: 0, oy: 0 };
    } catch (e) {
      toast.show((e as Error).message, 'warn');
    }
  }

  function onpaste(e: ClipboardEvent) {
    const f = [...(e.clipboardData?.files ?? [])].find((x) => x.type.startsWith('image/'));
    if (f) {
      e.preventDefault();
      load(f);
    }
  }

  // arrastar a miniatura para reenquadrar
  function down(e: PointerEvent) {
    if (!crop || !src) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag = { x: e.clientX, y: e.clientY, ox: crop.ox, oy: crop.oy };
  }
  function move(e: PointerEvent) {
    if (!drag || !crop) return;
    const k = 200 / 64 / crop.zoom;
    crop.ox = Math.max(-100, Math.min(100, drag.ox - (e.clientX - drag.x) * k));
    crop.oy = Math.max(-100, Math.min(100, drag.oy - (e.clientY - drag.y) * k));
  }
  function wheel(e: WheelEvent) {
    if (!crop || !src) return;
    e.preventDefault();
    crop.zoom = Math.max(1, Math.min(4, crop.zoom - e.deltaY * 0.002));
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="photo"
  class:over
  {onpaste}
  ondragover={(e) => {
    e.preventDefault();
    over = true;
  }}
  ondragleave={() => (over = false)}
  ondrop={(e) => {
    e.preventDefault();
    over = false;
    load(e.dataTransfer?.files?.[0]);
  }}
>
  <div
    class="thumb"
    class:round
    onpointerdown={down}
    onpointermove={move}
    onpointerup={() => (drag = null)}
    onwheel={wheel}
    title={src && crop ? 'Arraste para enquadrar; role para dar zoom' : ''}
  >
    {#if src}<canvas bind:this={thumb} width="128" height="128"></canvas>{:else}<Icon
        name="image"
        size={22}
      />{/if}
  </div>
  <div class="side">
    <div class="btns">
      <button type="button" class="btn small" onclick={() => input.click()}>
        <Icon name="upload" size={16} />{src ? 'Trocar' : label}
      </button>
      {#if src}
        <button type="button" class="btn small ghost" onclick={() => (src = null)}>
          <Icon name="x" size={16} />Remover
        </button>
      {/if}
    </div>
    {#if src && crop}
      <label class="zoom">
        Zoom <input
          type="range"
          min="1"
          max="4"
          step="0.05"
          bind:value={crop.zoom}
          aria-label="Zoom da foto"
        />
      </label>
    {:else}
      <p class="hint">Escolha, cole (Ctrl+V) ou arraste uma imagem.</p>
    {/if}
  </div>
  <input
    bind:this={input}
    type="file"
    accept="image/*"
    hidden
    onchange={(e) => {
      load(e.currentTarget.files?.[0]);
      e.currentTarget.value = '';
    }}
  />
</div>

<style>
  .photo {
    display: flex;
    gap: 12px;
    align-items: center;
    border-radius: 12px;
    padding: 4px;
  }
  .photo.over {
    outline: 2px dashed var(--accent);
  }
  .thumb {
    width: 64px;
    height: 64px;
    flex: none;
    border-radius: 12px;
    border: 1px solid var(--line);
    background-color: var(--field);
    overflow: hidden;
    display: grid;
    place-items: center;
    color: var(--muted);
    touch-action: none;
    cursor: grab;
  }
  .thumb canvas {
    width: 100%;
    height: 100%;
    display: block;
  }
  .thumb.round {
    border-radius: 50%;
  }
  .side {
    display: grid;
    gap: 6px;
    min-width: 0;
    flex: 1;
  }
  .btns {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
  .zoom {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    gap: 8px;
    margin: 0;
  }
</style>
