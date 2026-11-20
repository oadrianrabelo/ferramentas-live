<script lang="ts">
  import ToolPage from '../lib/components/ToolPage.svelte';
  import CanvasStage from '../lib/components/CanvasStage.svelte';
  import Segmented from '../lib/components/Segmented.svelte';
  import Icon from '../lib/components/Icon.svelte';
  import { persisted } from '../lib/persist.svelte';
  import { brand } from '../lib/stores.svelte';
  import { font, roundRect, type Ctx } from '../lib/canvas/draw';
  import { brandLogo } from '../lib/canvas/frame';
  import { getTheme, THEMES } from '../lib/canvas/themes';
  import { uid } from '../lib/platform';

  interface Person {
    id: string;
    name: string;
    role: string;
  }

  const s = persisted('tarja', {
    name: 'Pr. Nome Sobrenome',
    role: 'Professor da Escola Sabatina',
    style: 'barra' as 'barra' | 'pilula' | 'minimal',
    position: 'left' as 'left' | 'center' | 'right',
    height: 'baixo' as 'baixo' | 'medio',
    theme: 'sabatina',
    showLogo: true,
    people: [] as Person[],
  });

  const theme = $derived(getTheme(s.theme, brand.accent));
  const W = 1920,
    H = 1080;

  function draw(ctx: Ctx) {
    ctx.clearRect(0, 0, W, H);
    const t = theme;
    const nameFs = 58;
    const roleFs = 34;
    ctx.font = font(700, nameFs);
    const nw = ctx.measureText(s.name || ' ').width;
    ctx.font = font(500, roleFs);
    const rw = s.role ? ctx.measureText(s.role).width : 0;
    const logo = s.showLogo ? brandLogo(brand) : null;
    const logoW = logo ? (logo.naturalWidth * 96) / logo.naturalHeight + 30 : 0;
    const padX = 44;
    const textW = Math.min(1300, Math.max(nw, rw));
    const boxW = textW + padX * 2 + logoW + (s.style === 'barra' ? 18 : 0);
    const boxH = s.role ? 170 : 116;
    const baseY = s.height === 'baixo' ? H - 110 - boxH : H - 260 - boxH;
    const x = s.position === 'left' ? 110 : s.position === 'right' ? W - 110 - boxW : (W - boxW) / 2;
    const y = baseY;
    const dark = t.id !== 'claro';
    const bg = dark ? 'rgba(8,14,32,0.92)' : 'rgba(255,255,255,0.96)';

    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 8;
    if (s.style === 'pilula') {
      roundRect(ctx, x, y, boxW, boxH, boxH / 2);
    } else if (s.style === 'barra') {
      roundRect(ctx, x, y, boxW, boxH, 14);
    } else {
      ctx.beginPath();
      ctx.rect(x, y, boxW, boxH);
    }
    if (s.style !== 'minimal') {
      const g = ctx.createLinearGradient(x, y, x + boxW, y);
      g.addColorStop(0, bg);
      g.addColorStop(1, dark ? 'rgba(20,32,70,0.9)' : 'rgba(240,236,226,0.96)');
      ctx.fillStyle = g;
      ctx.fill();
    }
    ctx.restore();

    let tx = x + padX + (s.style === 'barra' ? 18 : 0);
    if (s.style === 'barra') {
      ctx.fillStyle = t.accent;
      roundRect(ctx, x, y, 16, boxH, 8);
      ctx.fill();
    }
    if (s.style === 'pilula') tx = x + padX + 20;
    if (logo) {
      const lh = 96;
      const lw = (logo.naturalWidth * lh) / logo.naturalHeight;
      ctx.drawImage(logo, tx, y + (boxH - lh) / 2, lw, lh);
      tx += lw + 30;
    }
    const ink = s.style === 'minimal' ? '#ffffff' : dark ? '#ffffff' : t.ink;
    if (s.style === 'minimal') {
      ctx.shadowColor = 'rgba(0,0,0,0.75)';
      ctx.shadowBlur = 14;
    }
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = font(700, nameFs);
    ctx.fillStyle = ink;
    const nameY = s.role ? y + boxH * 0.38 : y + boxH / 2;
    ctx.fillText(s.name, tx, nameY, textW);
    if (s.role) {
      ctx.font = font(500, roleFs);
      ctx.fillStyle = t.accent;
      ctx.fillText(s.role, tx, y + boxH * 0.72, textW);
    }
    if (s.style === 'minimal') {
      ctx.shadowBlur = 0;
      ctx.fillStyle = t.accent;
      ctx.fillRect(tx, y + boxH + 4, Math.min(textW, 220), 6);
    }
    ctx.shadowColor = 'transparent';
  }

  function savePerson() {
    if (!s.name.trim()) return;
    const ex = s.people.find((p) => p.name === s.name);
    if (ex) ex.role = s.role;
    else s.people.push({ id: uid(), name: s.name, role: s.role });
  }
</script>

<ToolPage
  title="Tarja de nome"
  lead="A imagem sai com fundo transparente (PNG 1920×1080). No OBS, adicione como “Imagem” por cima da câmera."
>
  {#snippet preview()}
    <CanvasStage width={W} height={H} {draw} filename="tarja" transparent />
  {/snippet}

  <div class="panel stack">
    <h2>Quem está falando</h2>
    <div>
      <label for="t-name">Nome</label>
      <input id="t-name" type="text" bind:value={s.name} maxlength="60" />
    </div>
    <div>
      <label for="t-role">Função (opcional)</label>
      <input id="t-role" type="text" bind:value={s.role} maxlength="80" />
    </div>
    <div class="row">
      <button class="btn small" onclick={savePerson}><Icon name="plus" size={16} />Salvar na lista</button>
    </div>
    {#if s.people.length}
      <div class="people">
        {#each s.people as p (p.id)}
          <span class="person">
            <button
              class="btn small"
              onclick={() => {
                s.name = p.name;
                s.role = p.role;
              }}
            >
              {p.name}
            </button>
            <button
              class="btn small ghost icon-only"
              aria-label={`Tirar ${p.name} da lista`}
              onclick={() => (s.people = s.people.filter((x) => x.id !== p.id))}
            >
              <Icon name="x" size={14} />
            </button>
          </span>
        {/each}
      </div>
    {/if}
  </div>

  <div class="panel stack">
    <h2>Aparência</h2>
    <div>
      <span class="label">Estilo</span>
      <Segmented
        label="Estilo"
        options={[
          { value: 'barra', label: 'Barra' },
          { value: 'pilula', label: 'Pílula' },
          { value: 'minimal', label: 'Só texto' },
        ]}
        bind:value={s.style}
      />
    </div>
    <div class="grid2">
      <div>
        <span class="label">Posição</span>
        <Segmented
          label="Posição"
          options={[
            { value: 'left', label: 'Esq.' },
            { value: 'center', label: 'Centro' },
            { value: 'right', label: 'Dir.' },
          ]}
          bind:value={s.position}
        />
      </div>
      <div>
        <span class="label">Altura</span>
        <Segmented
          label="Altura"
          options={[
            { value: 'baixo', label: 'Baixo' },
            { value: 'medio', label: 'Mais alto' },
          ]}
          bind:value={s.height}
        />
      </div>
    </div>
    <div>
      <label for="t-theme">Cor de destaque</label>
      <select id="t-theme" bind:value={s.theme}>
        {#each THEMES.filter((t) => !t.transparent) as t (t.id)}<option value={t.id}>{t.name}</option>{/each}
      </select>
    </div>
    <label class="check"><input type="checkbox" bind:checked={s.showLogo} /> Mostrar logo</label>
  </div>
</ToolPage>

<style>
  .people {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .person {
    display: inline-flex;
    align-items: center;
  }
</style>
