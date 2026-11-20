<script lang="ts">
  import ToolPage from '../lib/components/ToolPage.svelte';
  import Icon from '../lib/components/Icon.svelte';
  import changelog from '../../CHANGELOG.md?raw';
  import { renderMarkdown, semverGt } from '../lib/markdown';
  import { isMobileUA, isTauri } from '../lib/platform';

  const version = __APP_VERSION__;
  const commit = __APP_COMMIT__;
  const repo = __APP_REPO__;
  const platform = isTauri ? (isMobileUA ? 'Android' : 'Desktop') : 'Web';
  const html = renderMarkdown(changelog.replace(/^# .*\n/, ''));

  let check = $state<{ state: 'idle' | 'busy' | 'new' | 'ok' | 'err'; latest?: string; url?: string }>({
    state: 'idle',
  });

  async function checkUpdate() {
    check = { state: 'busy' };
    try {
      const r = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
        headers: { Accept: 'application/vnd.github+json' },
      });
      if (!r.ok) throw new Error(String(r.status));
      const j = await r.json();
      const latest = String(j.tag_name ?? '').replace(/^v/, '');
      check = semverGt(latest, version) ? { state: 'new', latest, url: j.html_url } : { state: 'ok', latest };
    } catch {
      check = { state: 'err' };
    }
  }
</script>

<ToolPage
  title="Sobre e versões"
  lead="Ferramentas Live — feito para quem transmite cultos, estudos e programas ao vivo."
>
  <div class="panel stack">
    <div class="ver">
      <img src="./favicon.svg" alt="" width="56" height="56" />
      <div>
        <div class="v">Versão {version}</div>
        <div class="hint">{platform} · commit <code>{commit}</code></div>
      </div>
    </div>
    <div class="row">
      {#if platform !== 'Web'}
        <button class="btn" onclick={checkUpdate} disabled={check.state === 'busy'}>
          <Icon name="refresh" />Procurar atualização
        </button>
      {/if}
      <a class="btn" href={`https://github.com/${repo}/releases`} target="_blank" rel="noopener">
        <Icon name="github" />Todas as versões e downloads
      </a>
    </div>
    {#if check.state === 'new'}
      <p class="msg new">
        Versão {check.latest} disponível! <a href={check.url} target="_blank" rel="noopener">Baixar agora</a>
      </p>
    {:else if check.state === 'ok'}
      <p class="msg">Você já está na versão mais recente.</p>
    {:else if check.state === 'err'}
      <p class="msg">Não consegui verificar agora. Veja a página de versões.</p>
    {/if}
    {#if platform === 'Web'}<p class="hint">
        Na web você sempre recebe a versão mais nova ao abrir o app.
      </p>{/if}
  </div>

  <div class="panel">
    <h2>Novidades</h2>
    <div class="md">
      {@html html || '<p>Primeira versão.</p>'}
    </div>
  </div>
</ToolPage>

<style>
  .ver {
    display: flex;
    gap: 14px;
    align-items: center;
  }
  .v {
    font-size: 22px;
    font-weight: 700;
  }
  .msg {
    padding: 10px 12px;
    border-radius: 10px;
    background: var(--field);
  }
  .msg.new {
    background: color-mix(in srgb, var(--ok) 18%, transparent);
    font-weight: 600;
  }
  .md :global(h2) {
    font-size: 17px;
    text-transform: none;
    letter-spacing: 0;
    color: var(--ink);
    margin: 18px 0 6px;
  }
  .md :global(h3) {
    font-size: 13px;
    color: var(--gold);
    margin: 10px 0 4px;
  }
  .md :global(ul) {
    margin: 0;
    padding-left: 20px;
  }
  .md :global(li) {
    margin: 2px 0;
  }
  .md :global(a) {
    color: var(--muted);
  }
</style>
