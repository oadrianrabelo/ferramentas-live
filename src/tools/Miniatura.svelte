<script lang="ts">
  import ToolPage from '../lib/components/ToolPage.svelte';
  import CanvasStage from '../lib/components/CanvasStage.svelte';
  import PhotoInput from '../lib/components/PhotoInput.svelte';
  import Segmented from '../lib/components/Segmented.svelte';
  import { persisted } from '../lib/persist.svelte';
  import { brand } from '../lib/stores.svelte';
  import { brandLogo } from '../lib/canvas/frame';
  import { getTheme, THEMES } from '../lib/canvas/themes';
  import { drawCover, drawLines, fitText, pill, text, type Crop, type Ctx } from '../lib/canvas/draw';
  import { getImage } from '../lib/canvas/assets.svelte';
  import { slug } from '../lib/platform';

  const W = 1280,
    H = 720;

  const s = persisted('miniatura', {
    badge: 'LIÇÃO 8',
    title: 'O poder da oração',
    subtitle: 'Escola Sabatina ao vivo',
    date: '',
    bg: null as string | null,
    bgCrop: { zoom: 1, ox: 0, oy: 0 } as Crop,
    person: null as string | null,
    personCrop: { zoom: 1, ox: 0, oy: -40 } as Crop,
    layout: 'left' as 'left' | 'center',
    upper: true,
    theme: brand.theme,
    live: true,
  });

  const theme = $derived(getTheme(s.theme, brand.accent));

  function draw(ctx: Ctx) {
    const t = theme;
    ctx.clearRect(0, 0, W, H);
    t.background(ctx, W, H);
    const bg = getImage(s.bg);
    if (bg) {
      drawCover(ctx, bg, 0, 0, W, H, s.bgCrop);
      const g = ctx.createLinearGradient(0, 0, W, 0);
      g.addColorStop(0, 'rgba(5,10,25,0.92)');
      g.addColorStop(s.layout === 'left' ? 0.62 : 0.5, 'rgba(5,10,25,0.55)');
      g.addColorStop(1, s.layout === 'left' ? 'rgba(5,10,25,0.1)' : 'rgba(5,10,25,0.92)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }
    const person = getImage(s.person);
    let textW = s.layout === 'left' ? W * 0.62 : W * 0.84;
    if (person && s.layout === 'left') {
      const pw = W * 0.42;
      ctx.save();
      const g = ctx.createLinearGradient(W - pw, 0, W - pw + 140, 0);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,1)');
      ctx.beginPath();
      ctx.rect(W - pw, 0, pw, H);
      ctx.clip();
      drawCover(ctx, person, W - pw, 0, pw, H, s.personCrop);
      ctx.restore();
      textW = W * 0.56;
    }
    const x = s.layout === 'left' ? 64 : W / 2;
    const align = s.layout === 'left' ? 'left' : 'center';
    let y = 70;
    const logo = brandLogo(brand);
    if (logo) {
      const lh = 84;
      const lw = (logo.naturalWidth * lh) / logo.naturalHeight;
      ctx.drawImage(logo, s.layout === 'left' ? x : x - lw / 2, y - 20, lw, lh);
      y += 100;
    }
    if (s.live) {
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = 10;
      pill(ctx, '● AO VIVO', W - 40, 64, 26, '#e5252b', '#fff', 'right');
      ctx.restore();
    }
    const title = s.upper ? s.title.toLocaleUpperCase('pt-BR') : s.title;
    const fit = fitText(
      ctx,
      title || ' ',
      800,
      { w: textW, h: 330 },
      { max: 120, min: 54, lh: 1.04, maxLines: 4 },
    );
    const badgeH = s.badge ? 70 : 0;
    const subH = s.subtitle ? 64 : 0;
    const total = badgeH + fit.height + subH;
    y = Math.max(y, (H - total) / 2 + 30);
    if (s.badge) {
      pill(
        ctx,
        s.badge,
        x,
        y + 20,
        30,
        t.accent,
        t.id === 'claro' ? '#fff' : '#111',
        align === 'left' ? 'left' : 'center',
      );
      y += badgeH;
    }
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 4;
    y = drawLines(ctx, fit, x, y, 800, bg ? '#ffffff' : t.ink, align);
    ctx.restore();
    if (s.subtitle) text(ctx, s.subtitle, x, y + 40, 36, 600, t.accent, align, textW);
    if (s.date)
      text(ctx, s.date, s.layout === 'left' ? x : W / 2, H - 46, 28, 500, bg ? '#e6ebf5' : t.soft, align);
  }
</script>

<ToolPage
  title="Miniatura"
  lead="Thumbnail 1280×720 para o YouTube. Use letras grandes: a maioria vê a miniatura pequena, no celular."
>
  {#snippet preview()}
    <CanvasStage width={W} height={H} {draw} filename={`miniatura-${slug(s.title)}`} />
  {/snippet}

  <div class="panel stack">
    <h2>Textos</h2>
    <div class="grid2">
      <div>
        <label for="m-b">Selo</label><input id="m-b" type="text" bind:value={s.badge} maxlength="24" />
      </div>
      <div>
        <label for="m-d">Data (rodapé)</label><input
          id="m-d"
          type="text"
          bind:value={s.date}
          maxlength="30"
          placeholder="23 de novembro"
        />
      </div>
    </div>
    <div>
      <label for="m-t">Título</label><textarea id="m-t" bind:value={s.title} rows="2" maxlength="80"
      ></textarea>
    </div>
    <div>
      <label for="m-s">Subtítulo</label><input id="m-s" type="text" bind:value={s.subtitle} maxlength="50" />
    </div>
    <label class="check"><input type="checkbox" bind:checked={s.upper} /> Título em MAIÚSCULAS</label>
    <label class="check"><input type="checkbox" bind:checked={s.live} /> Selo “AO VIVO”</label>
  </div>
  <div class="panel stack">
    <h2>Imagens</h2>
    <span class="label">Fundo (opcional)</span>
    <PhotoInput bind:src={s.bg} bind:crop={s.bgCrop} label="Fundo" round={false} maxSide={1600} />
    <span class="label">Pessoa à direita (opcional)</span>
    <PhotoInput bind:src={s.person} bind:crop={s.personCrop} label="Foto" round={false} maxSide={1000} />
  </div>
  <div class="panel stack">
    <h2>Visual</h2>
    <Segmented
      label="Alinhamento"
      options={[
        { value: 'left', label: 'Texto à esquerda' },
        { value: 'center', label: 'Centralizado' },
      ]}
      bind:value={s.layout}
    />
    <select bind:value={s.theme} aria-label="Tema">
      {#each THEMES.filter((t) => !t.transparent) as t (t.id)}<option value={t.id}>{t.name}</option>{/each}
    </select>
  </div>
</ToolPage>
