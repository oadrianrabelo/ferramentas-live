<script lang="ts">
  import ToolPage from '../lib/components/ToolPage.svelte';
  import Icon from '../lib/components/Icon.svelte';
  import { persisted } from '../lib/persist.svelte';
  import { brand, toast } from '../lib/stores.svelte';
  import { fillTemplate } from '../lib/parse';
  import { chapters } from '../lib/rundown.svelte';
  import { copyText } from '../lib/platform';

  const today = new Date();
  const s = persisted('publicacao', {
    programa: brand.title ? brand.title.charAt(0) + brand.title.slice(1).toLowerCase() : 'Escola Sabatina',
    tema: 'O poder da oração',
    numero: '8',
    apresentador: '',
    data: today.toLocaleDateString('pt-BR'),
    links: '',
    hashtags: '#EscolaSabatina #AoVivo #Bíblia',
    tituloTpl: '{programa} | Lição {numero}: {tema} | {data}',
    descTpl:
      'Ao vivo: {programa} — Lição {numero}: {tema}.\nCom {apresentador}.\n\nDeixe seu comentário: lemos ao vivo!\n\n{links}\n\nMomentos:\n{capitulos}\n\n{hashtags}',
    useChapters: true,
  });

  const vars = $derived({
    programa: s.programa,
    tema: s.tema,
    numero: s.numero,
    apresentador: s.apresentador,
    data: s.data,
    local: brand.place,
    canal: brand.handle,
    links: s.links,
    hashtags: s.hashtags,
    capitulos: s.useChapters ? chapters() : '',
  });
  const title = $derived(fillTemplate(s.tituloTpl, vars).replace(/\s*\|\s*$/, ''));
  const desc = $derived(
    fillTemplate(s.descTpl, vars).replace(/(^|\n)(Com|Momentos:)\s*\.?\n(?=\n|$)/g, '$1'),
  );
  const tags = $derived(
    [
      s.programa,
      s.tema,
      brand.place,
      'ao vivo',
      'live',
      ...s.hashtags.split(/\s+/).map((h) => h.replace('#', '')),
    ]
      .map((t) => t.trim())
      .filter(Boolean)
      .join(', '),
  );

  async function copy(t: string, what: string) {
    if (await copyText(t)) toast.show(`${what} copiado!`, 'ok');
  }
</script>

<ToolPage
  title="Kit de publicação"
  lead="Preencha uma vez e copie título, descrição (com capítulos do Roteiro) e tags para o YouTube ou Facebook."
  wide
>
  <div class="cols">
    <div class="stack">
      <div class="panel stack">
        <h2>Informações</h2>
        <div class="grid2">
          <div><label for="pb-p">Programa</label><input id="pb-p" type="text" bind:value={s.programa} /></div>
          <div>
            <label for="pb-n">Número / episódio</label><input id="pb-n" type="text" bind:value={s.numero} />
          </div>
        </div>
        <div><label for="pb-t">Tema</label><input id="pb-t" type="text" bind:value={s.tema} /></div>
        <div class="grid2">
          <div>
            <label for="pb-a">Apresentador(es)</label><input
              id="pb-a"
              type="text"
              bind:value={s.apresentador}
            />
          </div>
          <div><label for="pb-d">Data</label><input id="pb-d" type="text" bind:value={s.data} /></div>
        </div>
        <div>
          <label for="pb-l">Links (um por linha)</label><textarea
            id="pb-l"
            bind:value={s.links}
            rows="3"
            placeholder={'Site: https://…\nPIX: chave@exemplo.com'}></textarea>
        </div>
        <div><label for="pb-h">Hashtags</label><input id="pb-h" type="text" bind:value={s.hashtags} /></div>
        <label class="check">
          <input type="checkbox" bind:checked={s.useChapters} /> Incluir capítulos do Roteiro
        </label>
      </div>
      <details class="panel">
        <summary>Modelos (avançado)</summary>
        <div class="stack">
          <p class="hint">
            Variáveis: {'{programa} {tema} {numero} {apresentador} {data} {local} {canal} {links} {hashtags} {capitulos}'}
          </p>
          <div>
            <label for="pb-tt">Modelo do título</label><input
              id="pb-tt"
              type="text"
              bind:value={s.tituloTpl}
            />
          </div>
          <div>
            <label for="pb-dt">Modelo da descrição</label><textarea id="pb-dt" bind:value={s.descTpl} rows="8"
            ></textarea>
          </div>
        </div>
      </details>
    </div>

    <div class="stack">
      <div class="panel stack out">
        <h2>
          <span>Título</span>
          <button class="btn small" onclick={() => copy(title, 'Título')}>
            <Icon name="copy" size={16} />Copiar
          </button>
        </h2>
        <p class="result title">{title}</p>
        <div class="counter" class:over={title.length > 100}>{title.length}/100</div>
      </div>
      <div class="panel stack out">
        <h2>
          <span>Descrição</span>
          <button class="btn small" onclick={() => copy(desc, 'Descrição')}>
            <Icon name="copy" size={16} />Copiar
          </button>
        </h2>
        <pre class="result">{desc}</pre>
        <div class="counter" class:over={desc.length > 5000}>{desc.length}/5000</div>
      </div>
      <div class="panel stack out">
        <h2>
          <span>Tags</span>
          <button class="btn small" onclick={() => copy(tags, 'Tags')}>
            <Icon name="copy" size={16} />Copiar
          </button>
        </h2>
        <p class="result">{tags}</p>
        <div class="counter" class:over={tags.length > 500}>{tags.length}/500</div>
      </div>
    </div>
  </div>
</ToolPage>

<style>
  .cols {
    display: grid;
    gap: 16px;
  }
  @media (min-width: 1000px) {
    .cols {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      align-items: start;
    }
  }
  .result {
    background: var(--field);
    border: 1px solid var(--line);
    border-radius: 9px;
    padding: 10px 12px;
    white-space: pre-wrap;
    word-break: break-word;
    margin: 0;
    font: inherit;
    font-size: 14px;
    max-height: 420px;
    overflow: auto;
  }
  .result.title {
    font-weight: 600;
    font-size: 16px;
  }
</style>
