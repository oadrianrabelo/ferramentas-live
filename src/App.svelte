<script lang="ts">
  import Icon from './lib/components/Icon.svelte';
  import Toasts from './lib/components/Toasts.svelte';
  import Home from './tools/Home.svelte';
  import { DISPLAYS, GROUPS, TOOLS } from './tools/registry';
  import { prefs } from './lib/stores.svelte';

  function parse() {
    const h = location.hash.replace(/^#\/?/, '');
    const [a, b] = h.split('/');
    return a === 'tela' ? { display: b ?? '', tool: '' } : { display: '', tool: a ?? '' };
  }
  let route = $state(parse());
  $effect(() => {
    const on = () => {
      route = parse();
      document.querySelector('main')?.scrollTo?.(0, 0);
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  });

  const tool = $derived(TOOLS.find((t) => t.id === route.tool));
  const display = $derived(DISPLAYS[route.display]);

  $effect(() => {
    if (tool) prefs.lastTool = tool.id;
    document.title = display
      ? `${display.name} · Ferramentas Live`
      : tool
        ? `${tool.name} · Ferramentas Live`
        : 'Ferramentas Live';
  });

  $effect(() => {
    const a = prefs.appearance;
    if (a === 'system') delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = a;
  });

  function cycleAppearance() {
    prefs.appearance =
      prefs.appearance === 'system' ? 'dark' : prefs.appearance === 'dark' ? 'light' : 'system';
  }
</script>

{#if display}
  {#await display.load() then m}
    <m.default />
  {/await}
{:else}
  <div class="shell">
    <aside class="sidebar" aria-label="Ferramentas">
      <a class="brand" href="#/">
        <img src="./favicon.svg" alt="" width="34" height="34" />
        <span>Ferramentas <b>Live</b></span>
      </a>
      <nav>
        {#each GROUPS as g (g)}
          <div class="group">{g}</div>
          {#each TOOLS.filter((t) => t.group === g) as t (t.id)}
            <a href={`#/${t.id}`} aria-current={route.tool === t.id ? 'page' : undefined}>
              <Icon name={t.icon} size={18} />{t.name}
            </a>
          {/each}
        {/each}
      </nav>
      <div class="side-foot">
        <button class="btn small ghost" onclick={cycleAppearance} title="Alternar aparência">
          <Icon
            name={prefs.appearance === 'light' ? 'sun' : prefs.appearance === 'dark' ? 'moon' : 'palette'}
            size={16}
          />
          {prefs.appearance === 'system' ? 'Automático' : prefs.appearance === 'dark' ? 'Escuro' : 'Claro'}
        </button>
        <a class="ver" href="#/sobre">v{__APP_VERSION__}</a>
      </div>
    </aside>

    <div class="content">
      <header class="topbar">
        {#if tool}
          <a class="btn ghost icon-only" href="#/" aria-label="Voltar ao início"><Icon name="left" /></a>
          <span class="tb-title">{tool.name}</span>
        {:else}
          <span class="brand mini">
            <img src="./favicon.svg" alt="" width="28" height="28" />Ferramentas <b>Live</b>
          </span>
        {/if}
        <span class="spacer"></span>
        <button class="btn ghost icon-only" onclick={cycleAppearance} aria-label="Alternar aparência">
          <Icon
            name={prefs.appearance === 'light' ? 'sun' : prefs.appearance === 'dark' ? 'moon' : 'palette'}
          />
        </button>
      </header>
      <main>
        {#if tool}
          {#key tool.id}
            {#await tool.load()}
              <p class="hint">Carregando…</p>
            {:then m}
              <m.default />
            {:catch}
              <p class="hint">Não consegui abrir esta ferramenta. Recarregue a página.</p>
            {/await}
          {/key}
        {:else}
          <Home />
        {/if}
      </main>
    </div>
  </div>
{/if}
<Toasts />

<style>
  .shell {
    min-height: 100dvh;
  }
  .sidebar {
    display: none;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--ink);
    text-decoration: none;
    font-weight: 500;
    font-size: 17px;
  }
  .brand b {
    color: var(--gold);
    font-weight: 700;
  }
  .brand.mini {
    font-size: 16px;
    gap: 8px;
  }
  .topbar {
    position: sticky;
    top: 0;
    z-index: 20;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: calc(env(safe-area-inset-top) + 8px) max(12px, env(safe-area-inset-right)) 8px
      max(12px, env(safe-area-inset-left));
    background: color-mix(in srgb, var(--bg) 88%, transparent);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--line);
  }
  .tb-title {
    font-weight: 600;
    font-size: 17px;
  }
  main {
    padding: 20px max(16px, env(safe-area-inset-right)) calc(48px + env(safe-area-inset-bottom))
      max(16px, env(safe-area-inset-left));
    max-width: 1500px;
  }

  @media (min-width: 900px) {
    .shell {
      display: grid;
      grid-template-columns: var(--sidebar) minmax(0, 1fr);
    }
    .sidebar {
      display: flex;
      flex-direction: column;
      gap: 14px;
      position: sticky;
      top: 0;
      height: 100dvh;
      padding: 18px 12px;
      border-right: 1px solid var(--line);
      background: var(--surface-2);
      overflow-y: auto;
    }
    .sidebar .brand {
      padding: 4px 8px 6px;
    }
    nav {
      display: grid;
      gap: 2px;
    }
    .group {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--muted);
      padding: 12px 10px 4px;
      font-weight: 600;
    }
    nav a {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 10px;
      border-radius: 9px;
      color: var(--ink);
      text-decoration: none;
      font-size: 14px;
    }
    nav a:hover {
      background: var(--field);
    }
    nav a[aria-current='page'] {
      background: color-mix(in srgb, var(--accent) 16%, transparent);
      color: var(--ink);
      font-weight: 600;
    }
    nav a[aria-current='page'] :global(.icon) {
      color: var(--gold);
    }
    .side-foot {
      margin-top: auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 4px;
    }
    .ver {
      font-size: 12px;
      color: var(--muted);
      text-decoration: none;
    }
    .topbar {
      display: none;
    }
    main {
      padding: 28px 32px 64px;
    }
  }
</style>
