<script lang="ts">
  import ToolPage from '../lib/components/ToolPage.svelte';
  import Icon from '../lib/components/Icon.svelte';
  import { persisted } from '../lib/persist.svelte';
  import { uid } from '../lib/platform';

  interface Item {
    id: string;
    text: string;
    done: boolean;
  }
  interface Group {
    id: string;
    name: string;
    items: Item[];
  }

  const g = (name: string, items: string[]): Group => ({
    id: uid(),
    name,
    items: items.map((text) => ({ id: uid(), text, done: false })),
  });

  const DEFAULTS = (): Group[] => [
    g('Uma hora antes', [
      'Título, descrição e miniatura da live publicados',
      'Link da live enviado nos grupos',
      'Roteiro revisado com quem vai participar',
      'Baterias carregadas (câmera, microfones, celular)',
    ]),
    g('Equipamento', [
      'Internet testada (upload acima de 5 Mbps)',
      'Câmera enquadrada e com foco',
      'Microfones ligados e com nível bom',
      'Áudio da mesa chegando no computador',
      'Notificações do computador e do celular silenciadas',
    ]),
    g('No OBS / app de transmissão', [
      'Cenas prontas: abertura, câmera, tela, encerramento',
      'Imagens de comentários e avisos na pasta certa',
      'Chave de transmissão correta',
      'Gravação local ligada (cópia de segurança)',
    ]),
    g('Começou', [
      'Conferir a live pelo celular (áudio e imagem)',
      'Fixar comentário com o PIX / links',
      'Cronômetro do pregador pronto',
    ]),
  ];

  const s = persisted('checklist', { groups: DEFAULTS() });
  let editing = $state(false);

  const all = $derived(s.groups.flatMap((x) => x.items));
  const done = $derived(all.filter((i) => i.done).length);
  const pct = $derived(all.length ? Math.round((done / all.length) * 100) : 0);

  function resetChecks() {
    s.groups.forEach((x) => x.items.forEach((i) => (i.done = false)));
  }
  function restoreDefaults() {
    if (confirm('Voltar para a lista padrão? Suas alterações serão perdidas.')) s.groups = DEFAULTS();
  }
</script>

<ToolPage
  title="Checklist"
  lead="Marque tudo antes de entrar no ar. A lista fica salva; use “Recomeçar” a cada live."
  wide
>
  <div class="panel progress">
    <div class="pct" class:full={pct === 100}>{pct}%</div>
    <div class="info">
      <b>{pct === 100 ? 'Tudo pronto. Boa live!' : `${done} de ${all.length} itens prontos`}</b>
      <div class="bar"><span style:width={`${pct}%`}></span></div>
    </div>
    <div class="row">
      <button class="btn" onclick={resetChecks}><Icon name="reset" />Recomeçar</button>
      <button class="btn" aria-pressed={editing} onclick={() => (editing = !editing)}>
        <Icon name="settings" />{editing ? 'Concluir' : 'Editar lista'}
      </button>
    </div>
  </div>

  <div class="groups">
    {#each s.groups as grp (grp.id)}
      <section class="panel">
        <h2>
          {#if editing}
            <input type="text" bind:value={grp.name} aria-label="Nome do grupo" />
            <button
              class="btn small ghost icon-only"
              aria-label="Apagar grupo"
              onclick={() => (s.groups = s.groups.filter((x) => x.id !== grp.id))}
            >
              <Icon name="trash" size={16} />
            </button>
          {:else}
            <span>{grp.name}</span>
            <span class="hint">{grp.items.filter((i) => i.done).length}/{grp.items.length}</span>
          {/if}
        </h2>
        <ul>
          {#each grp.items as it (it.id)}
            <li class:done={it.done}>
              {#if editing}
                <input type="text" bind:value={it.text} aria-label="Item" />
                <button
                  class="btn small ghost icon-only"
                  aria-label="Apagar item"
                  onclick={() => (grp.items = grp.items.filter((x) => x.id !== it.id))}
                >
                  <Icon name="x" size={16} />
                </button>
              {:else}
                <label class="check">
                  <input type="checkbox" bind:checked={it.done} /> <span>{it.text}</span>
                </label>
              {/if}
            </li>
          {/each}
        </ul>
        {#if editing}
          <button
            class="btn small"
            onclick={() => grp.items.push({ id: uid(), text: 'Novo item', done: false })}
          >
            <Icon name="plus" size={16} />Item
          </button>
        {/if}
      </section>
    {/each}
  </div>
  {#if editing}
    <div class="row">
      <button class="btn" onclick={() => s.groups.push(g('Novo grupo', ['Novo item']))}>
        <Icon name="plus" />Grupo
      </button>
      <button class="btn ghost danger" onclick={restoreDefaults}>Restaurar lista padrão</button>
    </div>
  {/if}
</ToolPage>

<style>
  .progress {
    display: flex;
    gap: 18px;
    align-items: center;
    flex-wrap: wrap;
  }
  .pct {
    font-size: 40px;
    font-weight: 800;
    color: var(--gold);
    font-variant-numeric: tabular-nums;
    min-width: 92px;
  }
  .pct.full {
    color: var(--ok);
  }
  .info {
    flex: 1 1 220px;
    display: grid;
    gap: 8px;
  }
  .bar {
    height: 10px;
    border-radius: 99px;
    background: var(--field);
    overflow: hidden;
  }
  .bar span {
    display: block;
    height: 100%;
    background: var(--gold);
    transition: width 0.3s;
  }
  .groups {
    display: grid;
    gap: 14px;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 340px), 1fr));
  }
  ul {
    list-style: none;
    padding: 0;
    margin: 0 0 8px;
    display: grid;
    gap: 2px;
  }
  li {
    display: flex;
    gap: 6px;
    align-items: center;
  }
  li .check {
    padding: 7px 4px;
    width: 100%;
    align-items: flex-start;
  }
  li .check input {
    margin-top: 2px;
  }
  li.done span {
    color: var(--muted);
    text-decoration: line-through;
  }
  h2 input {
    text-transform: none;
    letter-spacing: 0;
    font-size: 14px;
  }
  .btn[aria-pressed='true'] {
    border-color: var(--accent);
  }
</style>
