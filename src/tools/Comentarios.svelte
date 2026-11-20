<script lang="ts">
  import ToolPage from '../lib/components/ToolPage.svelte';
  import CanvasStage from '../lib/components/CanvasStage.svelte';
  import StylePicker from '../lib/components/StylePicker.svelte';
  import Segmented from '../lib/components/Segmented.svelte';
  import PhotoInput from '../lib/components/PhotoInput.svelte';
  import Icon from '../lib/components/Icon.svelte';
  import { persisted } from '../lib/persist.svelte';
  import { brand, toast } from '../lib/stores.svelte';
  import { drawFrame, type Rect } from '../lib/canvas/frame';
  import { getFormat, getTheme, type Theme } from '../lib/canvas/themes';
  import {
    AVATAR_COLORS,
    alpha,
    drawAvatar,
    drawLines,
    fitText,
    font,
    pill,
    roundRect,
    type Crop,
    type Ctx,
  } from '../lib/canvas/draw';
  import { getImage, whenImage } from '../lib/canvas/assets.svelte';
  import { chunk, handle, parseComments, tidyText } from '../lib/parse';
  import { saveMany, stamp, uid } from '../lib/platform';

  type Source = '' | 'youtube' | 'instagram' | 'facebook' | 'whatsapp' | 'tiktok';
  interface Item {
    id: string;
    user: string;
    text: string;
    source: Source;
    photo: string | null;
    crop: Crop;
    color: string | null;
    done: boolean;
  }

  const SOURCES: Record<Exclude<Source, ''>, { label: string; color: string }> = {
    youtube: { label: 'YouTube', color: '#e8222e' },
    instagram: { label: 'Instagram', color: '#c13584' },
    facebook: { label: 'Facebook', color: '#1877f2' },
    whatsapp: { label: 'WhatsApp', color: '#1fa855' },
    tiktok: { label: 'TikTok', color: '#111111' },
  };

  const newItem = (user = '', text = '', source: Source = ''): Item => ({
    id: uid(),
    user,
    text,
    source,
    photo: null,
    crop: { zoom: 1, ox: 0, oy: 0 },
    color: null,
    done: false,
  });

  const s = persisted('comentarios', {
    perImage: 2,
    layout: 'full' as 'full' | 'overlay',
    format: '16x9',
    theme: brand.theme,
    subtitle: 'Comentários ao vivo',
    capitalize: true,
    defaultSource: '' as Source,
    page: 0,
    items: [
      newItem('exemplo1', 'Feliz sábado! Louvado seja Deus por esta lição.'),
      newItem('exemplo2', 'Que estudo abençoado, obrigado pelo ensino!'),
    ] as Item[],
  });

  let bulkOpen = $state(false);
  let bulkText = $state('');
  let exporting = $state(false);

  const n = $derived(s.layout === 'overlay' ? Math.min(s.perImage, 2) : s.perImage);
  const pages = $derived(chunk(s.items, n));
  const pageCount = $derived(Math.max(1, pages.length));
  $effect(() => {
    if (s.page > pageCount - 1) s.page = pageCount - 1;
    if (s.page < 0) s.page = 0;
  });
  const current = $derived(pages[s.page] ?? []);
  const fmt = $derived(getFormat(s.format));
  const theme = $derived(getTheme(s.theme, brand.accent));

  // ---------- desenho ----------
  function drawCard(
    ctx: Ctx,
    it: Item,
    r: Rect,
    u: number,
    t: Theme,
    opts: { overlay: boolean; count: number },
  ) {
    const { overlay, count } = opts;
    const radius = 34 * u;
    roundRect(ctx, r.x, r.y, r.w, r.h, radius);
    ctx.fillStyle = overlay ? (t.id === 'claro' ? 'rgba(255,255,255,0.96)' : 'rgba(9,15,33,0.9)') : t.card;
    ctx.fill();
    ctx.strokeStyle = overlay ? alpha(t.accent, 0.6) : t.cardLine;
    ctx.lineWidth = 2 * u;
    ctx.stroke();

    // aspas decorativas
    ctx.font = font(700, Math.min(r.h * 0.9, 260 * u));
    ctx.fillStyle = alpha(t.accent, 0.12);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText('”', r.x + r.w - 30 * u, r.y - 10 * u);

    const portrait = fmt.h > fmt.w;
    const baseAv = overlay ? 150 : count === 1 ? 240 : count === 2 ? 190 : 150;
    const AV = Math.min(r.h * 0.66, baseAv * u * (portrait ? 0.9 : 1));
    const padX = (overlay ? 36 : 50) * u;
    const cx = r.x + padX + AV / 2;
    const cy = r.y + r.h / 2;
    ctx.fillStyle = t.ring;
    ctx.beginPath();
    ctx.arc(cx, cy, AV / 2 + 8 * u, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = overlay ? '#0a1226' : '#0a1638';
    ctx.beginPath();
    ctx.arc(cx, cy, AV / 2 + 3 * u, 0, Math.PI * 2);
    ctx.fill();
    drawAvatar(ctx, cx, cy, AV, { img: getImage(it.photo), crop: it.crop, name: it.user, color: it.color });

    const tx = cx + AV / 2 + 50 * u;
    const maxW = r.x + r.w - padX - tx;
    const user = handle(it.user);
    const nameSize = (count === 3 && !overlay ? 28 : 32) * u;
    const nameH = user || it.source ? nameSize * 1.6 : 0;
    const padY = (count === 3 ? 26 : 40) * u;
    const body = tidyText(it.text, s.capitalize) || ' ';
    const maxFs = (overlay ? 46 : count === 1 ? 64 : 54) * u * (portrait ? 0.92 : 1);
    const fit = fitText(
      ctx,
      body,
      500,
      { w: maxW, h: r.h - padY * 2 - nameH },
      { max: maxFs, min: 24 * u, lh: 1.38 },
    );
    const block = nameH + fit.height;
    let y = r.y + (r.h - block) / 2;

    if (nameH) {
      let x = tx;
      if (user) {
        ctx.font = font(700, nameSize);
        let ns = nameSize;
        while (ns > 16 * u && ctx.measureText(user).width > maxW - (it.source ? 200 * u : 0)) {
          ns -= 1;
          ctx.font = font(700, ns);
        }
        ctx.fillStyle = t.accent;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(user, x, y + nameH * 0.4);
        x += ctx.measureText(user).width + 18 * u;
      }
      if (it.source) {
        const src = SOURCES[it.source];
        pill(ctx, src.label, x, y + nameH * 0.4, 18 * u, src.color, '#fff');
      }
      y += nameH;
    }
    drawLines(ctx, fit, tx, y, 500, t.ink);
  }

  function drawPage(ctx: Ctx, w: number, h: number, pageIdx: number) {
    const t = theme;
    const u = Math.min(w, h) / 1080;
    const list = pages[pageIdx] ?? [];
    const count = Math.max(1, list.length);

    if (s.layout === 'overlay') {
      ctx.clearRect(0, 0, w, h);
      const mx = (h > w ? 50 : 80) * u;
      const ch = (count === 1 ? 250 : 210) * u;
      const gap = 20 * u;
      let y = h - mx * 0.8 - ch * count - gap * (count - 1);
      for (const it of list) {
        drawCard(ctx, it, { x: mx, y, w: w - mx * 2, h: ch }, u, t, { overlay: true, count });
        y += ch + gap;
      }
      return;
    }

    const area = drawFrame(ctx, w, h, t, brand, { subtitle: s.subtitle });
    const gap = (count === 2 ? 34 : 24) * u;
    const portrait = h > w;
    // um só comentário fica centralizado e não estica até as bordas
    const maxH = count === 1 ? (portrait ? 760 : 600) * u : Infinity;
    const rh = Math.min(maxH, (area.h - gap * (count - 1)) / count);
    const total = rh * count + gap * (count - 1);
    let y = area.y + (area.h - total) / 2;
    if (!list.length) {
      ctx.fillStyle = t.soft;
      ctx.font = font(500, 36 * u);
      ctx.textAlign = 'center';
      ctx.fillText('Adicione um comentário →', w / 2, area.y + area.h / 2);
      return;
    }
    for (const it of list) {
      drawCard(ctx, it, { x: area.x, y, w: area.w, h: rh }, u, t, { overlay: false, count });
      y += rh + gap;
    }
  }

  // ---------- ações ----------
  function add() {
    s.items.push(newItem('', '', s.defaultSource));
    s.page = Math.floor((s.items.length - 1) / n);
    requestAnimationFrame(() => document.getElementById(`user-${s.items[s.items.length - 1].id}`)?.focus());
  }

  function importBulk() {
    const parsed = parseComments(bulkText);
    if (!parsed.length) return toast.show('Não encontrei comentários no texto colado.', 'warn');
    const start = s.items.length;
    // se a fila só tem os exemplos, substitui
    if (s.items.every((i) => i.user.startsWith('exemplo'))) s.items = [];
    s.items.push(...parsed.map((p) => newItem(p.user, p.text, s.defaultSource)));
    s.page = Math.floor((s.items.length > start ? start : 0) / n);
    bulkText = '';
    bulkOpen = false;
    toast.show(`${parsed.length} comentário(s) adicionados à fila.`, 'ok');
  }

  function remove(id: string) {
    s.items = s.items.filter((i) => i.id !== id);
  }

  function move(id: string, d: -1 | 1) {
    const i = s.items.findIndex((x) => x.id === id);
    const j = i + d;
    if (i < 0 || j < 0 || j >= s.items.length) return;
    const arr = [...s.items];
    [arr[i], arr[j]] = [arr[j], arr[i]];
    s.items = arr;
  }

  function clearAll() {
    if (!confirm('Apagar todos os comentários da fila?')) return;
    s.items = [newItem('', '', s.defaultSource)];
    s.page = 0;
  }

  function clearDone() {
    s.items = s.items.filter((i) => !i.done);
    if (!s.items.length) s.items = [newItem('', '', s.defaultSource)];
  }

  function markPageDone() {
    current.forEach((it) => (it.done = true));
  }

  async function renderPage(idx: number): Promise<Blob> {
    await Promise.all((pages[idx] ?? []).map((it) => whenImage(it.photo)));
    const c = document.createElement('canvas');
    c.width = fmt.w;
    c.height = fmt.h;
    drawPage(c.getContext('2d')!, fmt.w, fmt.h, idx);
    return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej()), 'image/png'));
  }

  async function exportAll() {
    if (exporting) return;
    exporting = true;
    try {
      const st = stamp();
      const files = [];
      for (let i = 0; i < pages.length; i++)
        files.push({
          blob: await renderPage(i),
          name: `comentarios-${st}-${String(i + 1).padStart(2, '0')}.png`,
        });
      const r = await saveMany(files);
      if (r !== 'cancelled') {
        s.items.forEach((it) => (it.done = true));
        toast.show(`${files.length} imagem(ns) salvas.`, 'ok');
      }
    } catch (e) {
      console.error(e);
      toast.show('Não consegui exportar todas. Tente baixar uma por vez.', 'warn');
    } finally {
      exporting = false;
    }
  }

  // atalhos: PageUp/PageDown trocam a página
  function onkey(e: KeyboardEvent) {
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (e.key === 'PageDown' || e.key === 'ArrowRight') s.page = Math.min(pageCount - 1, s.page + 1);
    if (e.key === 'PageUp' || e.key === 'ArrowLeft') s.page = Math.max(0, s.page - 1);
  }
</script>

<svelte:window onkeydown={onkey} />

<ToolPage
  title="Comentários"
  lead="Monte uma fila com os comentários do chat. Cada imagem mostra 1, 2 ou 3 deles — use as setas para passar e baixe uma por uma ou todas de uma vez."
>
  {#snippet preview()}
    <CanvasStage
      width={fmt.w}
      height={fmt.h}
      draw={(ctx, w, h) => drawPage(ctx, w, h, s.page)}
      filename="comentarios"
      transparent={s.layout === 'overlay'}
    >
      {#snippet actions()}
        {#if pages.length > 1}
          <button class="btn" onclick={exportAll} disabled={exporting}>
            <Icon name="download" />{exporting ? 'Gerando…' : `Baixar todas (${pages.length})`}
          </button>
        {/if}
      {/snippet}
      {#snippet below()}
        <div class="pager">
          <button
            class="btn icon-only"
            onclick={() => (s.page = Math.max(0, s.page - 1))}
            disabled={s.page === 0}
            aria-label="Imagem anterior"
          >
            <Icon name="left" />
          </button>
          <span class="pg"><b>Imagem {s.page + 1}</b> de {pageCount}</span>
          <button
            class="btn icon-only"
            onclick={() => (s.page = Math.min(pageCount - 1, s.page + 1))}
            disabled={s.page >= pageCount - 1}
            aria-label="Próxima imagem"
          >
            <Icon name="right" />
          </button>
          <span class="spacer"></span>
          <button
            class="btn small ghost"
            onclick={markPageDone}
            title="Marca os comentários desta imagem como já exibidos"
          >
            <Icon name="check" size={16} />Já exibida
          </button>
        </div>
      {/snippet}
    </CanvasStage>
  {/snippet}

  <div class="panel">
    <h2>Layout</h2>
    <div class="stack">
      <div class="grid2">
        <div>
          <span class="label">Por imagem</span>
          <Segmented
            label="Comentários por imagem"
            options={[
              { value: 1, label: '1' },
              { value: 2, label: '2' },
              { value: 3, label: '3', title: s.layout === 'overlay' ? 'No overlay o máximo é 2' : '' },
            ]}
            bind:value={s.perImage}
          />
        </div>
        <div>
          <span class="label">Estilo</span>
          <Segmented
            label="Estilo"
            options={[
              { value: 'full', label: 'Tela cheia' },
              {
                value: 'overlay',
                label: 'Overlay',
                title: 'Fundo transparente para usar por cima da câmera no OBS',
              },
            ]}
            bind:value={s.layout}
          />
        </div>
      </div>
      {#if s.layout === 'full'}
        <div>
          <label for="c-sub">Faixa do topo</label>
          <input id="c-sub" type="text" bind:value={s.subtitle} maxlength="40" />
          <div class="row chips">
            {#each ['Comentários ao vivo', 'Pergunta ao vivo', 'Testemunho', 'Pedido de oração'] as c (c)}
              <button class="btn small" onclick={() => (s.subtitle = c)}>{c}</button>
            {/each}
          </div>
        </div>
      {/if}
      <label class="check">
        <input type="checkbox" bind:checked={s.capitalize} /> Primeira letra em maiúscula
      </label>
    </div>
  </div>

  {#each current as it (it.id)}
    <section class="panel item" class:done={it.done}>
      <h2>
        <span>Comentário {s.items.indexOf(it) + 1}{it.done ? ' · exibido' : ''}</span>
        <button
          class="btn small ghost icon-only"
          onclick={() => remove(it.id)}
          aria-label="Remover comentário"
        >
          <Icon name="trash" size={16} />
        </button>
      </h2>
      <div class="stack">
        <div>
          <label for={`user-${it.id}`}>Nome ou @usuário</label>
          <input id={`user-${it.id}`} type="text" bind:value={it.user} maxlength="60" autocomplete="off" />
        </div>
        <div>
          <label for={`text-${it.id}`}>Comentário</label>
          <textarea id={`text-${it.id}`} bind:value={it.text} maxlength="500" rows="3"></textarea>
        </div>
        <div>
          <span class="label">Origem</span>
          <div class="row">
            <button class="btn small" aria-pressed={!it.source} onclick={() => (it.source = '')}>
              Nenhuma
            </button>
            {#each Object.entries(SOURCES) as [k, v] (k)}
              <button
                class="btn small src"
                style:--c={v.color}
                aria-pressed={it.source === k}
                onclick={() => (it.source = k as Source)}
              >
                {v.label}
              </button>
            {/each}
          </div>
        </div>
        <PhotoInput bind:src={it.photo} bind:crop={it.crop} label="Foto" maxSide={480} />
        {#if !it.photo}
          <div class="swatches" role="group" aria-label="Cor do avatar">
            {#each AVATAR_COLORS as c (c)}
              <button
                style:background={c}
                aria-pressed={it.color === c}
                aria-label={`Cor ${c}`}
                onclick={() => (it.color = it.color === c ? null : c)}
              ></button>
            {/each}
          </div>
        {/if}
      </div>
    </section>
  {/each}

  <div class="row">
    <button class="btn primary" onclick={add}><Icon name="plus" />Comentário</button>
    <button class="btn" onclick={() => (bulkOpen = !bulkOpen)}><Icon name="paste" />Colar vários</button>
  </div>

  {#if bulkOpen}
    <div class="panel stack">
      <h2>Colar do chat</h2>
      <p class="hint">
        Um por linha, no formato <b>nome: comentário</b>. Também entendo horário no começo e nome numa linha
        com o comentário na linha de baixo.
      </p>
      <textarea
        bind:value={bulkText}
        rows="7"
        placeholder={'maria: Amém!\n19:42 João: Boa noite de Porto Velho'}></textarea>
      <div class="row">
        <span class="label" style="margin:0">Origem padrão</span>
        <select bind:value={s.defaultSource} style="width:auto">
          <option value="">Nenhuma</option>
          {#each Object.entries(SOURCES) as [k, v] (k)}<option value={k}>{v.label}</option>{/each}
        </select>
        <span class="spacer"></span>
        <button class="btn primary" onclick={importBulk}>Adicionar à fila</button>
      </div>
    </div>
  {/if}

  <div class="panel">
    <h2>
      <span>Fila · {s.items.length}</span>
      <span class="row">
        {#if s.items.some((i) => i.done)}<button class="btn small ghost" onclick={clearDone}>
            Tirar exibidos
          </button>{/if}
        <button class="btn small ghost danger" onclick={clearAll}>Limpar</button>
      </span>
    </h2>
    <ol class="queue">
      {#each s.items as it, i (it.id)}
        {#if i % n === 0}<li class="sep">Imagem {i / n + 1}</li>{/if}
        <li class:cur={Math.floor(i / n) === s.page} class:done={it.done}>
          <button class="q-main" onclick={() => (s.page = Math.floor(i / n))}>
            <b>{handle(it.user) || 'Sem nome'}</b>
            <span>{it.text || '—'}</span>
          </button>
          <button
            class="btn small ghost icon-only"
            onclick={() => move(it.id, -1)}
            disabled={i === 0}
            aria-label="Subir"
          >
            <Icon name="up" size={16} />
          </button>
          <button
            class="btn small ghost icon-only"
            onclick={() => move(it.id, 1)}
            disabled={i === s.items.length - 1}
            aria-label="Descer"
          >
            <Icon name="down" size={16} />
          </button>
        </li>
      {/each}
    </ol>
  </div>

  <StylePicker bind:theme={s.theme} bind:format={s.format} />
</ToolPage>

<style>
  .pager {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }
  .pg {
    font-size: 14px;
    color: var(--muted);
  }
  .pg b {
    color: var(--ink);
  }
  .chips {
    margin-top: 8px;
    gap: 6px;
  }
  .item.done {
    opacity: 0.75;
  }
  .src[aria-pressed='true'] {
    background: var(--c);
    color: #fff;
    border-color: var(--c);
  }
  .btn[aria-pressed='true']:not(.src) {
    border-color: var(--accent);
    box-shadow: 0 0 0 1px var(--accent) inset;
  }
  .swatches {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
  .swatches button {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    border: 2px solid transparent;
    padding: 0;
  }
  .swatches button[aria-pressed='true'] {
    border-color: var(--ink);
  }
  .queue {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 4px;
    max-height: 340px;
    overflow: auto;
  }
  .queue li {
    display: flex;
    align-items: center;
    gap: 2px;
    border-radius: 9px;
    padding-right: 4px;
  }
  .queue li.cur {
    background: color-mix(in srgb, var(--accent) 12%, transparent);
  }
  .queue li.done .q-main {
    opacity: 0.55;
    text-decoration: line-through;
  }
  .queue .sep {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--muted);
    padding: 8px 8px 0;
  }
  .q-main {
    flex: 1;
    min-width: 0;
    display: grid;
    text-align: left;
    background: none;
    border: 0;
    color: var(--ink);
    padding: 6px 8px;
  }
  .q-main b {
    font-size: 13px;
    font-weight: 600;
  }
  .q-main span {
    font-size: 13px;
    color: var(--muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
