<script lang="ts">
  import ToolPage from '../lib/components/ToolPage.svelte';
  import CanvasStage from '../lib/components/CanvasStage.svelte';
  import PhotoInput from '../lib/components/PhotoInput.svelte';
  import Segmented from '../lib/components/Segmented.svelte';
  import StylePicker from '../lib/components/StylePicker.svelte';
  import Icon from '../lib/components/Icon.svelte';
  import { brand, prefs, toast } from '../lib/stores.svelte';
  import { drawFrame } from '../lib/canvas/frame';
  import { getTheme } from '../lib/canvas/themes';
  import { text, type Ctx } from '../lib/canvas/draw';
  import { saveBlob, stamp } from '../lib/platform';

  const theme = $derived(getTheme(brand.theme, brand.accent));

  function draw(ctx: Ctx, w: number, h: number) {
    const area = drawFrame(ctx, w, h, theme, brand, { subtitle: 'Faixa do topo' });
    text(ctx, 'Conteúdo da imagem', w / 2, area.y + area.h / 2, 54, 600, theme.soft, 'center');
  }

  function exportBackup() {
    const data: Record<string, unknown> = {
      app: 'ferramentas-live',
      version: __APP_VERSION__,
      at: new Date().toISOString(),
    };
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)!;
      if (k.startsWith('fl:')) data[k] = JSON.parse(localStorage.getItem(k)!);
    }
    saveBlob(
      new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
      `ferramentas-live-backup-${stamp()}.json`,
    );
  }

  let fileIn: HTMLInputElement;
  async function importBackup(file?: File) {
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (data.app !== 'ferramentas-live') throw new Error();
      for (const [k, v] of Object.entries(data))
        if (k.startsWith('fl:')) localStorage.setItem(k, JSON.stringify(v));
      toast.show('Backup restaurado. Recarregando…', 'ok');
      setTimeout(() => location.reload(), 900);
    } catch {
      toast.show('Esse arquivo não é um backup válido.', 'warn');
    }
  }

  function wipe() {
    if (!confirm('Apagar todos os dados salvos neste aparelho (filas, roteiros, textos, configurações)?'))
      return;
    Object.keys(localStorage)
      .filter((k) => k.startsWith('fl:'))
      .forEach((k) => localStorage.removeItem(k));
    location.reload();
  }
</script>

<ToolPage
  title="Identidade"
  lead="Isto aparece no cabeçalho e no rodapé de todas as imagens. Configure uma vez."
>
  {#snippet preview()}
    <CanvasStage width={1920} height={1080} {draw} filename="identidade" />
  {/snippet}

  <div class="panel stack">
    <h2>Cabeçalho e rodapé</h2>
    <div>
      <label for="b-t">Nome do programa</label><input
        id="b-t"
        type="text"
        bind:value={brand.title}
        maxlength="40"
      />
    </div>
    <div>
      <label for="b-p">Cidade / igreja</label><input
        id="b-p"
        type="text"
        bind:value={brand.place}
        maxlength="40"
        placeholder="Ex.: Porto Velho (RO)"
      />
    </div>
    <div>
      <label for="b-f">Frase do rodapé</label><input
        id="b-f"
        type="text"
        bind:value={brand.footer}
        maxlength="80"
      />
    </div>
    <div>
      <label for="b-h">Canal ou @ (opcional)</label><input
        id="b-h"
        type="text"
        bind:value={brand.handle}
        maxlength="40"
        placeholder="youtube.com/@seucanal"
      />
    </div>
  </div>

  <div class="panel stack">
    <h2>Logo</h2>
    <Segmented
      label="Logo"
      options={[
        { value: 'iasd', label: 'Símbolo IASD' },
        { value: 'custom', label: 'Meu logo' },
        { value: 'none', label: 'Sem logo' },
      ]}
      bind:value={brand.logo}
    />
    {#if brand.logo === 'custom'}
      <PhotoInput bind:src={brand.customLogo} label="Enviar logo" round={false} png maxSide={512} />
      <p class="hint">Use PNG com fundo transparente para ficar melhor.</p>
    {/if}
  </div>

  <StylePicker bind:theme={brand.theme} />
  <div class="panel stack">
    <h2>Cor de destaque</h2>
    <div class="row">
      <input
        type="color"
        value={brand.accent ?? theme.accent}
        oninput={(e) => (brand.accent = e.currentTarget.value)}
        aria-label="Cor de destaque"
      />
      <span class="hint">
        {brand.accent ? 'Cor personalizada em todas as imagens' : 'Usando a cor do tema'}
      </span>
      {#if brand.accent}<button class="btn small" onclick={() => (brand.accent = null)}>
          Usar a do tema
        </button>{/if}
    </div>
  </div>

  <div class="panel stack">
    <h2>Aparência do app</h2>
    <Segmented
      label="Aparência do app"
      options={[
        { value: 'system', label: 'Automática' },
        { value: 'dark', label: 'Escura' },
        { value: 'light', label: 'Clara' },
      ]}
      bind:value={prefs.appearance}
    />
  </div>

  <div class="panel stack">
    <h2>Seus dados</h2>
    <p class="hint">
      Tudo fica salvo só neste aparelho. Faça um backup para levar para outro computador ou celular.
    </p>
    <div class="row">
      <button class="btn" onclick={exportBackup}><Icon name="download" />Fazer backup</button>
      <button class="btn" onclick={() => fileIn.click()}><Icon name="upload" />Restaurar backup</button>
      <button class="btn ghost danger" onclick={wipe}><Icon name="trash" />Apagar tudo</button>
    </div>
    <input
      bind:this={fileIn}
      type="file"
      accept="application/json,.json"
      hidden
      onchange={(e) => importBackup(e.currentTarget.files?.[0])}
    />
  </div>
</ToolPage>
