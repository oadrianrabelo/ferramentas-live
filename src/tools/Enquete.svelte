<script lang="ts">
  import ToolPage from '../lib/components/ToolPage.svelte';
  import CanvasStage from '../lib/components/CanvasStage.svelte';
  import StylePicker from '../lib/components/StylePicker.svelte';
  import Icon from '../lib/components/Icon.svelte';
  import { persisted } from '../lib/persist.svelte';
  import { brand } from '../lib/stores.svelte';
  import { drawFrame } from '../lib/canvas/frame';
  import { getFormat, getTheme } from '../lib/canvas/themes';
  import { alpha, drawLines, fitText, roundRect, text, type Ctx } from '../lib/canvas/draw';
  import { uid } from '../lib/platform';

  interface Opt {
    id: string;
    label: string;
    votes: number;
  }

  const s = persisted('enquete', {
    question: 'Qual parte da lição mais tocou você hoje?',
    options: [
      { id: uid(), label: 'Domingo', votes: 12 },
      { id: uid(), label: 'Segunda', votes: 7 },
      { id: uid(), label: 'Terça', votes: 4 },
    ] as Opt[],
    showVotes: true,
    highlight: true,
    theme: brand.theme,
    format: '16x9',
  });

  const fmt = $derived(getFormat(s.format));
  const theme = $derived(getTheme(s.theme, brand.accent));
  const total = $derived(s.options.reduce((a, o) => a + o.votes, 0));
  const max = $derived(Math.max(0, ...s.options.map((o) => o.votes)));

  function draw(ctx: Ctx, w: number, h: number) {
    const t = theme;
    const u = Math.min(w, h) / 1080;
    const area = drawFrame(ctx, w, h, t, brand, { subtitle: 'Enquete ao vivo' });
    const qFit = fitText(
      ctx,
      s.question || ' ',
      700,
      { w: area.w, h: 170 * u },
      { max: 58 * u, min: 30 * u, lh: 1.2 },
    );
    let y = drawLines(ctx, qFit, area.x, area.y + 10 * u, 700, t.ink);
    y += 34 * u;
    const opts = s.options.filter((o) => o.label.trim());
    const n = Math.max(1, opts.length);
    const gap = 18 * u;
    const rowH = Math.min(120 * u, (area.y + area.h - y - gap * (n - 1)) / n);
    opts.forEach((o) => {
      const pct = total ? o.votes / total : 0;
      const win = s.highlight && total > 0 && o.votes === max;
      roundRect(ctx, area.x, y, area.w, rowH, rowH * 0.28);
      ctx.fillStyle = t.card;
      ctx.fill();
      if (pct > 0) {
        ctx.save();
        roundRect(ctx, area.x, y, area.w, rowH, rowH * 0.28);
        ctx.clip();
        ctx.fillStyle = win ? alpha(t.accent, 0.85) : alpha(t.accent, 0.32);
        ctx.fillRect(area.x, y, area.w * pct, rowH);
        ctx.restore();
      }
      const ink = win ? (t.id === 'claro' ? '#fff' : '#111') : t.ink;
      const fs = Math.min(42 * u, rowH * 0.4);
      const right = s.showVotes ? `${Math.round(pct * 100)}%  ·  ${o.votes}` : `${Math.round(pct * 100)}%`;
      text(
        ctx,
        o.label,
        area.x + 34 * u,
        y + rowH / 2,
        fs,
        600,
        pct > 0.35 ? ink : t.ink,
        'left',
        area.w * 0.62,
      );
      text(ctx, right, area.x + area.w - 34 * u, y + rowH / 2, fs, 700, pct > 0.88 ? ink : t.ink, 'right');
      y += rowH + gap;
    });
    if (total)
      text(
        ctx,
        `${total} voto${total === 1 ? '' : 's'}`,
        area.x + area.w,
        area.y - 6 * u,
        24 * u,
        500,
        t.soft,
        'right',
      );
  }

  function add() {
    s.options.push({ id: uid(), label: `Opção ${s.options.length + 1}`, votes: 0 });
  }

  function onkey(e: KeyboardEvent) {
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    const i = Number(e.key) - 1;
    if (i >= 0 && i < s.options.length) {
      e.preventDefault();
      s.options[i].votes += e.shiftKey || e.altKey ? -1 : 1;
      if (s.options[i].votes < 0) s.options[i].votes = 0;
    }
  }
</script>

<svelte:window onkeydown={onkey} />

<ToolPage
  title="Enquete"
  lead="Faça a pergunta no chat e conte os votos aqui. Atalho: teclas 1–9 somam um voto (Shift + número tira)."
>
  {#snippet preview()}
    <CanvasStage width={fmt.w} height={fmt.h} {draw} filename="enquete" />
  {/snippet}

  <div class="panel stack">
    <h2>Pergunta</h2>
    <textarea bind:value={s.question} rows="2" maxlength="160" aria-label="Pergunta"></textarea>
  </div>

  <div class="panel stack">
    <h2>
      <span>Opções · {total} votos</span>
      <button class="btn small ghost" onclick={() => s.options.forEach((o) => (o.votes = 0))}>
        <Icon name="reset" size={16} />Zerar
      </button>
    </h2>
    {#each s.options as o, i (o.id)}
      <div class="opt">
        <kbd>{i + 1}</kbd>
        <input type="text" bind:value={o.label} maxlength="50" aria-label={`Opção ${i + 1}`} />
        <button
          class="btn icon-only"
          onclick={() => (o.votes = Math.max(0, o.votes - 1))}
          aria-label="Tirar voto"
        >
          <Icon name="minus" />
        </button>
        <input class="votes" type="number" min="0" bind:value={o.votes} aria-label="Votos" />
        <button class="btn primary icon-only" onclick={() => o.votes++} aria-label="Somar voto">
          <Icon name="plus" />
        </button>
        <button
          class="btn ghost icon-only"
          onclick={() => (s.options = s.options.filter((x) => x.id !== o.id))}
          aria-label="Remover opção"
        >
          <Icon name="trash" size={16} />
        </button>
      </div>
    {/each}
    {#if s.options.length < 8}
      <button class="btn" onclick={add}><Icon name="plus" />Opção</button>
    {/if}
    <label class="check"><input type="checkbox" bind:checked={s.showVotes} /> Mostrar número de votos</label>
    <label class="check"><input type="checkbox" bind:checked={s.highlight} /> Destacar a mais votada</label>
  </div>
  <StylePicker bind:theme={s.theme} bind:format={s.format} />
</ToolPage>

<style>
  .opt {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) 40px 64px 40px 40px;
    gap: 6px;
    align-items: center;
  }
  .votes {
    text-align: center;
    padding: 9px 4px;
  }
  @media (max-width: 420px) {
    .opt {
      grid-template-columns: auto minmax(0, 1fr) 40px 52px 40px;
    }
    .opt > :last-child {
      display: none;
    }
  }
</style>
