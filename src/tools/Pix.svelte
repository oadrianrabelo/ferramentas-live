<script lang="ts">
  import ToolPage from '../lib/components/ToolPage.svelte';
  import CanvasStage from '../lib/components/CanvasStage.svelte';
  import StylePicker from '../lib/components/StylePicker.svelte';
  import Segmented from '../lib/components/Segmented.svelte';
  import Icon from '../lib/components/Icon.svelte';
  import { persisted } from '../lib/persist.svelte';
  import { brand, toast } from '../lib/stores.svelte';
  import { drawFrame } from '../lib/canvas/frame';
  import { getFormat, getTheme } from '../lib/canvas/themes';
  import { drawLines, fitText, text, type Ctx } from '../lib/canvas/draw';
  import { buildPix, detectKey } from '../lib/pix';
  import { drawQr, makeQr } from '../lib/qr';
  import { copyText } from '../lib/platform';

  const s = persisted('pix', {
    mode: 'pix' as 'pix' | 'link',
    key: '',
    name: '',
    city: '',
    amount: '',
    message: '',
    showKey: true,
    title: 'Devolva o dízimo e oferte',
    caption: 'Aponte a câmera do celular ou use o PIX copia e cola',
    link: '',
    theme: brand.theme,
    format: '16x9',
  });

  const KIND: Record<string, string> = {
    cpf: 'CPF',
    cnpj: 'CNPJ',
    telefone: 'Telefone',
    email: 'E-mail',
    aleatoria: 'Chave aleatória',
    desconhecida: 'Tipo não reconhecido',
  };

  const amount = $derived(Number(String(s.amount).replace(/\./g, '').replace(',', '.')) || null);
  const keyInfo = $derived(detectKey(s.key));
  const payload = $derived(
    s.mode === 'pix'
      ? s.key.trim()
        ? buildPix({ key: s.key, name: s.name, city: s.city, amount, message: s.message })
        : ''
      : s.link.trim(),
  );
  const qr = $derived(makeQr(payload));
  const fmt = $derived(getFormat(s.format));
  const theme = $derived(getTheme(s.theme, brand.accent));

  function draw(ctx: Ctx, w: number, h: number) {
    const t = theme;
    const u = Math.min(w, h) / 1080;
    const portrait = h > w;
    const area = drawFrame(ctx, w, h, t, brand, { subtitle: s.mode === 'pix' ? 'PIX' : 'Acesse' });
    const side = Math.min(portrait ? area.w * 0.78 : area.h * 0.92, 640 * u);
    let qx: number, qy: number, tx: number, tw: number, align: CanvasTextAlign;
    if (portrait) {
      qx = (w - side) / 2;
      qy = area.y + area.h - side - 20 * u;
      tx = w / 2;
      tw = area.w;
      align = 'center';
    } else {
      qx = area.x + area.w - side;
      qy = area.y + (area.h - side) / 2;
      tx = area.x;
      tw = area.w - side - 90 * u;
      align = 'left';
    }
    if (qr) {
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.35)';
      ctx.shadowBlur = 40 * u;
      drawQr(ctx, qr, qx, qy, side, '#0b1226', '#ffffff', 28 * u);
      ctx.restore();
    } else {
      ctx.strokeStyle = t.cardLine;
      ctx.setLineDash([12 * u, 10 * u]);
      ctx.lineWidth = 3 * u;
      ctx.strokeRect(qx, qy, side, side);
      ctx.setLineDash([]);
      text(
        ctx,
        s.mode === 'pix' ? 'Preencha a chave PIX' : 'Preencha o link',
        qx + side / 2,
        qy + side / 2,
        30 * u,
        500,
        t.soft,
        'center',
        side - 40 * u,
      );
    }
    const textH = portrait ? qy - area.y - 40 * u : area.h;
    const titleFit = fitText(
      ctx,
      s.title || ' ',
      800,
      { w: tw, h: textH * 0.5 },
      { max: 82 * u, min: 36 * u, lh: 1.12 },
    );
    const lines: [string, string][] = [];
    if (s.mode === 'pix' && s.showKey && s.key.trim()) lines.push(['Chave PIX', s.key.trim()]);
    if (s.mode === 'pix' && s.name.trim()) lines.push(['Favorecido', s.name.trim()]);
    if (s.mode === 'pix' && amount)
      lines.push(['Valor', amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })]);
    if (s.mode === 'link' && s.link.trim()) lines.push(['Link', s.link.replace(/^https?:\/\//, '')]);
    const capFit = s.caption
      ? fitText(ctx, s.caption, 400, { w: tw, h: 120 * u }, { max: 32 * u, min: 22 * u, lh: 1.35 })
      : null;
    const total = titleFit.height + (capFit ? capFit.height + 24 * u : 0) + lines.length * 96 * u + 30 * u;
    let y = portrait ? area.y + Math.max(0, (textH - total) / 2) : area.y + (area.h - total) / 2;
    y = drawLines(ctx, titleFit, tx, y, 800, t.ink, align);
    if (capFit) y = drawLines(ctx, capFit, tx, y + 24 * u, 400, t.soft, align);
    y += 30 * u;
    for (const [k, v] of lines) {
      text(ctx, k.toUpperCase(), tx, y + 20 * u, 20 * u, 700, t.accent, align, tw);
      text(ctx, v, tx, y + 58 * u, 38 * u, 600, t.ink, align, tw);
      y += 96 * u;
    }
  }

  async function copyPayload() {
    if (!payload) return;
    if (await copyText(payload)) toast.show('Código copiado!', 'ok');
  }
</script>

<ToolPage
  title="PIX e QR Code"
  lead="Gera o PIX copia-e-cola (padrão do Banco Central) e a tela com QR code para a oferta. Funciona sem internet."
>
  {#snippet preview()}
    <CanvasStage width={fmt.w} height={fmt.h} {draw} filename={s.mode === 'pix' ? 'pix' : 'qrcode'} />
  {/snippet}

  <div class="panel stack">
    <Segmented
      label="Tipo"
      options={[
        { value: 'pix', label: 'PIX' },
        { value: 'link', label: 'Link / texto' },
      ]}
      bind:value={s.mode}
    />
    {#if s.mode === 'pix'}
      <div>
        <label for="p-key">Chave PIX</label>
        <input
          id="p-key"
          type="text"
          bind:value={s.key}
          placeholder="CPF, CNPJ, e-mail, telefone ou aleatória"
        />
        {#if s.key.trim()}<p class="hint">Reconhecida como: <b>{KIND[keyInfo.kind]}</b></p>{/if}
      </div>
      <div class="grid2">
        <div>
          <label for="p-name">Nome do favorecido</label>
          <input id="p-name" type="text" bind:value={s.name} maxlength="25" />
        </div>
        <div>
          <label for="p-city">Cidade</label>
          <input id="p-city" type="text" bind:value={s.city} maxlength="15" />
        </div>
        <div>
          <label for="p-amt">Valor (opcional)</label>
          <input
            id="p-amt"
            type="text"
            inputmode="decimal"
            bind:value={s.amount}
            placeholder="deixe vazio = livre"
          />
        </div>
        <div>
          <label for="p-msg">Mensagem (opcional)</label>
          <input id="p-msg" type="text" bind:value={s.message} maxlength="40" placeholder="Oferta" />
        </div>
      </div>
      <label class="check">
        <input type="checkbox" bind:checked={s.showKey} /> Mostrar a chave na imagem
      </label>
    {:else}
      <div>
        <label for="p-link">Link ou texto</label>
        <input id="p-link" type="url" bind:value={s.link} placeholder="https://…" />
      </div>
    {/if}
  </div>

  {#if payload && s.mode === 'pix'}
    <div class="panel stack">
      <h2>PIX copia e cola</h2>
      <code class="code">{payload}</code>
      <div class="row">
        <button class="btn primary" onclick={copyPayload}><Icon name="copy" />Copiar código</button>
        <span class="hint">Cole no chat da live para quem está no celular.</span>
      </div>
    </div>
  {/if}

  <div class="panel stack">
    <h2>Textos da imagem</h2>
    <div>
      <label for="p-t">Título</label><input id="p-t" type="text" bind:value={s.title} maxlength="60" />
    </div>
    <div>
      <label for="p-c">Legenda</label><input id="p-c" type="text" bind:value={s.caption} maxlength="90" />
    </div>
  </div>
  <StylePicker bind:theme={s.theme} bind:format={s.format} />
</ToolPage>

<style>
  .code {
    display: block;
    font:
      13px/1.5 ui-monospace,
      SFMono-Regular,
      Menlo,
      Consolas,
      monospace;
    word-break: break-all;
    background: var(--field);
    border: 1px solid var(--line);
    border-radius: 9px;
    padding: 10px 12px;
    user-select: all;
  }
</style>
