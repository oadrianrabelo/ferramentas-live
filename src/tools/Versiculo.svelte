<script lang="ts">
  import ToolPage from '../lib/components/ToolPage.svelte';
  import CanvasStage from '../lib/components/CanvasStage.svelte';
  import StylePicker from '../lib/components/StylePicker.svelte';
  import { persisted } from '../lib/persist.svelte';
  import { brand } from '../lib/stores.svelte';
  import { drawFrame } from '../lib/canvas/frame';
  import { getFormat, getTheme } from '../lib/canvas/themes';
  import { alpha, drawLines, fitText, line, text, type Ctx } from '../lib/canvas/draw';
  import { slug } from '../lib/platform';

  const s = persisted('versiculo', {
    kicker: 'Verso para memorizar',
    text: 'Lâmpada para os meus pés é a tua palavra, e luz para o meu caminho.',
    reference: 'Salmos 119:105',
    version: 'ARA',
    theme: brand.theme,
    format: '16x9',
    quotes: true,
  });

  const fmt = $derived(getFormat(s.format));
  const theme = $derived(getTheme(s.theme, brand.accent));

  function draw(ctx: Ctx, w: number, h: number) {
    const t = theme;
    const u = Math.min(w, h) / 1080;
    const area = drawFrame(ctx, w, h, t, brand, { subtitle: s.kicker });
    const portrait = h > w;
    const padX = (portrait ? 30 : 120) * u;
    const box = { w: area.w - padX * 2, h: area.h * 0.72 };
    const body = s.quotes ? `“${s.text.trim()}”` : s.text.trim();
    const fit = fitText(ctx, body, 600, box, { max: (portrait ? 84 : 78) * u, min: 30 * u, lh: 1.32 });
    const refH = s.reference ? 110 * u : 0;
    const total = fit.height + refH;
    const y0 = area.y + (area.h - total) / 2;
    drawLines(ctx, fit, w / 2, y0, 600, t.ink, 'center');
    if (s.reference) {
      const ry = y0 + fit.height + 60 * u;
      line(ctx, w / 2 - 60 * u, ry - 22 * u, w / 2 + 60 * u, ry - 22 * u, alpha(t.accent, 0.8), 3 * u);
      const ref = s.version ? `${s.reference}  ·  ${s.version}` : s.reference;
      text(ctx, ref, w / 2, ry + 26 * u, 40 * u, 600, t.accent, 'center', area.w);
    }
  }
</script>

<ToolPage title="Versículo" lead="Destaque um texto bíblico, a frase do dia ou uma citação.">
  {#snippet preview()}
    <CanvasStage width={fmt.w} height={fmt.h} {draw} filename={`versiculo-${slug(s.reference)}`} />
  {/snippet}

  <div class="panel stack">
    <h2>Texto</h2>
    <div>
      <label for="v-k">Faixa do topo</label>
      <input id="v-k" type="text" bind:value={s.kicker} maxlength="40" />
      <div class="row chips">
        {#each ['Verso para memorizar', 'Texto-chave', 'Leitura bíblica', 'Reflexão'] as c (c)}
          <button class="btn small" onclick={() => (s.kicker = c)}>{c}</button>
        {/each}
      </div>
    </div>
    <div>
      <label for="v-t">Texto</label>
      <textarea id="v-t" bind:value={s.text} rows="5" maxlength="700"></textarea>
    </div>
    <div class="grid2">
      <div>
        <label for="v-r">Referência</label>
        <input id="v-r" type="text" bind:value={s.reference} maxlength="40" placeholder="João 3:16" />
      </div>
      <div>
        <label for="v-v">Versão</label>
        <input id="v-v" type="text" bind:value={s.version} maxlength="12" list="versoes" />
        <datalist id="versoes">
          {#each ['ARA', 'ARC', 'NVI', 'NAA', 'NVT', 'ACF', 'NTLH', 'KJA'] as v (v)}<option value={v}
            ></option>{/each}
        </datalist>
      </div>
    </div>
    <label class="check"><input type="checkbox" bind:checked={s.quotes} /> Colocar aspas</label>
  </div>
  <StylePicker bind:theme={s.theme} bind:format={s.format} />
</ToolPage>

<style>
  .chips {
    margin-top: 8px;
    gap: 6px;
  }
</style>
