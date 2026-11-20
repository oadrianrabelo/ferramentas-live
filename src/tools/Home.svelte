<script lang="ts">
  import Icon from '../lib/components/Icon.svelte';
  import { GROUPS, TOOLS } from './registry';
  import { brand } from '../lib/stores.svelte';
</script>

<section class="hero">
  <h1>Tudo para a sua live, num lugar só.</h1>
  <p class="lead">
    Gere as imagens dos comentários, tarjas e avisos, controle o tempo, role o texto e publique — funciona
    offline, no celular e no computador.
  </p>
  {#if !brand.place}
    <a class="tip" href="#/identidade">
      <Icon name="sparkles" size={18} />
      <span>
        <b>Primeiro passo:</b> configure o nome do programa, a cidade e o logo em <u>Identidade</u>.
      </span>
    </a>
  {/if}
</section>

{#each GROUPS as g (g)}
  <h2 class="gh">{g}</h2>
  <div class="cards">
    {#each TOOLS.filter((t) => t.group === g) as t (t.id)}
      <a class="card" href={`#/${t.id}`}>
        <span class="ic"><Icon name={t.icon} size={22} /></span>
        <span class="txt">
          <b>{t.name}</b>
          <small>{t.desc}</small>
        </span>
      </a>
    {/each}
  </div>
{/each}

<style>
  .hero {
    margin-bottom: 8px;
    display: grid;
    gap: 10px;
  }
  .tip {
    display: flex;
    gap: 10px;
    align-items: center;
    padding: 12px 14px;
    border-radius: 12px;
    background: color-mix(in srgb, var(--gold) 14%, var(--surface));
    border: 1px solid color-mix(in srgb, var(--gold) 40%, var(--line));
    color: var(--ink);
    text-decoration: none;
    max-width: 640px;
    font-size: 14px;
  }
  .tip :global(.icon) {
    color: var(--gold);
  }
  .gh {
    margin: 26px 0 10px;
  }
  .cards {
    display: grid;
    gap: 10px;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  }
  .card {
    display: flex;
    gap: 14px;
    align-items: flex-start;
    padding: 14px;
    border-radius: var(--radius);
    background: var(--surface);
    border: 1px solid var(--line);
    color: var(--ink);
    text-decoration: none;
    box-shadow: var(--shadow);
    transition:
      border-color 0.15s,
      transform 0.15s;
  }
  .card:hover {
    border-color: var(--accent);
    transform: translateY(-1px);
  }
  .ic {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    display: grid;
    place-items: center;
    flex: none;
    background: color-mix(in srgb, var(--gold) 16%, transparent);
    color: var(--gold);
  }
  .txt {
    display: grid;
    gap: 2px;
  }
  .txt b {
    font-weight: 600;
  }
  .txt small {
    color: var(--muted);
    font-size: 13px;
    line-height: 1.4;
  }
</style>
