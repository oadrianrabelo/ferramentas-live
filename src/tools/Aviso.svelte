<script lang="ts">
  import ToolPage from '../lib/components/ToolPage.svelte';
  import CanvasStage from '../lib/components/CanvasStage.svelte';
  import StylePicker from '../lib/components/StylePicker.svelte';
  import { persisted } from '../lib/persist.svelte';
  import { brand } from '../lib/stores.svelte';
  import { drawFrame } from '../lib/canvas/frame';
  import { getFormat, getTheme } from '../lib/canvas/themes';
  import { drawLines, fitText, roundRect, text, type Ctx } from '../lib/canvas/draw';
  import { drawQr, makeQr } from '../lib/qr';
  import { slug } from '../lib/platform';

  const s = persisted('aviso', {
    kicker: 'Aviso',
    title: 'Culto Jovem neste sábado',
    body: 'Traga um amigo! Teremos louvor especial e uma mensagem para toda a família.',
    date: 'Sábado, 23/11',
    time: '19h30',
    place: 'Templo central',
    link: '',
    linkLabel: 'Aponte a câmera',
    theme: brand.theme,
    format: '16x9',
  });

  const fmt = $derived(getFormat(s.format));
  const theme = $derived(getTheme(s.theme, brand.accent));
  const qr = $derived(makeQr(s.link.trim()));

  function draw(ctx: Ctx, w: number, h: number) {
    const t = theme;
    const u = Math.min(w, h) / 1080;
    const portrait = h > w;
    const area = drawFrame(ctx, w, h, t, brand, { subtitle: s.kicker });

    const qrSide = qr ? (portrait ? 360 : 330) * u : 0;
    const colW = qr && !portrait ? area.w - qrSide - 80 * u : area.w;
    const infos = [
      ['DATA', s.date],
      ['HORÁRIO', s.time],
      ['LOCAL', s.place],
    ].filter(([, v]) => v.trim());

    const infoH = infos.length ? 120 * u : 0;
    const qrBlock = qr && portrait ? qrSide + 90 * u : 0;
    const titleFit = fitText(
      ctx,
      s.title.trim() || ' ',
      800,
      { w: colW, h: area.h * 0.42 },
      {
        max: (portrait ? 96 : 92) * u,
        min: 40 * u,
        lh: 1.12,
        maxLines: 3,
      },
    );
    const bodyFit = s.body.trim()
      ? fitText(
          ctx,
          s.body.trim(),
          400,
          { w: colW, h: area.h - titleFit.height - infoH - qrBlock - 120 * u },
          {
            max: 44 * u,
            min: 24 * u,
            lh: 1.42,
          },
        )
      : null;
    const total =
      titleFit.height + (bodyFit ? bodyFit.height + 36 * u : 0) + (infoH ? infoH + 40 * u : 0) + qrBlock;
    let y = area.y + Math.max(0, (area.h - total) / 2);
    const x = area.x;

    y = drawLines(ctx, titleFit, x, y, 800, t.ink);
    if (bodyFit) y = drawLines(ctx, bodyFit, x, y + 36 * u, 400, t.soft);
    if (infoH) {
      y += 40 * u;
      const gap = 18 * u;
      const cw = (colW - gap * (infos.length - 1)) / infos.length;
      infos.forEach(([k, v], i) => {
        const cx = x + i * (cw + gap);
        roundRect(ctx, cx, y, cw, infoH, 22 * u);
        ctx.fillStyle = t.card;
        ctx.fill();
        ctx.strokeStyle = t.cardLine;
        ctx.lineWidth = 2 * u;
        ctx.stroke();
        text(ctx, k, cx + 26 * u, y + 38 * u, 20 * u, 700, t.accent, 'left', cw - 40 * u);
        text(ctx, v, cx + 26 * u, y + 80 * u, 34 * u, 600, t.ink, 'left', cw - 40 * u);
      });
      y += infoH;
    }
    if (qr) {
      const qx = portrait ? (w - qrSide) / 2 : area.x + area.w - qrSide;
      const qy = portrait ? y + 50 * u : area.y + (area.h - qrSide - 60 * u) / 2;
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 30 * u;
      drawQr(ctx, qr, qx, qy, qrSide, '#0b1226', '#ffffff', 24 * u);
      ctx.restore();
      if (s.linkLabel)
        text(
          ctx,
          s.linkLabel,
          qx + qrSide / 2,
          qy + qrSide + 36 * u,
          26 * u,
          600,
          t.accent,
          'center',
          qrSide + 80 * u,
        );
    }
  }
</script>

<ToolPage title="Aviso" lead="Comunicados para mostrar antes, durante ou depois da live.">
  {#snippet preview()}
    <CanvasStage width={fmt.w} height={fmt.h} {draw} filename={`aviso-${slug(s.title)}`} />
  {/snippet}

  <div class="panel stack">
    <h2>Conteúdo</h2>
    <div>
      <label for="a-k">Faixa do topo</label>
      <input id="a-k" type="text" bind:value={s.kicker} maxlength="40" />
    </div>
    <div>
      <label for="a-t">Título</label>
      <input id="a-t" type="text" bind:value={s.title} maxlength="90" />
    </div>
    <div>
      <label for="a-b">Texto (opcional)</label>
      <textarea id="a-b" bind:value={s.body} rows="3" maxlength="400"></textarea>
    </div>
    <div class="grid2">
      <div>
        <label for="a-d">Data</label><input id="a-d" type="text" bind:value={s.date} maxlength="30" />
      </div>
      <div>
        <label for="a-h">Horário</label><input id="a-h" type="text" bind:value={s.time} maxlength="20" />
      </div>
      <div>
        <label for="a-l">Local</label><input id="a-l" type="text" bind:value={s.place} maxlength="40" />
      </div>
    </div>
  </div>
  <div class="panel stack">
    <h2>QR code (opcional)</h2>
    <div>
      <label for="a-q">Link ou texto</label>
      <input id="a-q" type="url" bind:value={s.link} placeholder="https://…" />
    </div>
    <div>
      <label for="a-ql">Legenda do QR</label>
      <input id="a-ql" type="text" bind:value={s.linkLabel} maxlength="40" />
    </div>
  </div>
  <StylePicker bind:theme={s.theme} bind:format={s.format} />
</ToolPage>
