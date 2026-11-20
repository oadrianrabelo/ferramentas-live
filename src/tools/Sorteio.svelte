<script lang="ts">
  import ToolPage from '../lib/components/ToolPage.svelte';
  import RaffleBoard from '../lib/components/RaffleBoard.svelte';
  import Icon from '../lib/components/Icon.svelte';
  import { drawWinner, participants, raffle, SPIN_MS } from '../lib/raffle.svelte';
  import { createNow } from '../lib/timer.svelte';
  import { openDisplay, toggleFullscreen, copyText } from '../lib/platform';
  import { toast } from '../lib/stores.svelte';

  const now = createNow(50);
  const list = $derived(participants());
  const spinning = $derived(raffle.draw.at > 0 && now.value < raffle.draw.at + SPIN_MS);
  let screen: HTMLDivElement;

  function go() {
    if (spinning) return;
    if (!drawWinner()) toast.show('Cole os nomes dos participantes primeiro.', 'warn');
  }

  function onkey(e: KeyboardEvent) {
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (e.code === 'Space' || e.key === 'Enter') {
      e.preventDefault();
      go();
    }
  }
</script>

<svelte:window onkeydown={onkey} />

<ToolPage
  title="Sorteio"
  lead="Cole os nomes (do chat, de uma planilha, separados por linha ou vírgula) e sorteie com animação."
>
  {#snippet preview()}
    <div class="stage">
      <div class="screen" bind:this={screen}><RaffleBoard now={now.value} /></div>
      <div class="row-actions">
        <button class="btn primary big" onclick={go} disabled={spinning}><Icon name="dice" />Sortear</button>
        <button class="btn" onclick={() => toggleFullscreen(screen)}><Icon name="expand" />Tela cheia</button>
        <button class="btn" onclick={() => openDisplay('sorteio', 'Sorteio')}>
          <Icon name="external" />Outra janela
        </button>
      </div>
      <p class="hint">
        O sorteio usa o gerador criptográfico do aparelho: cada participante tem exatamente a mesma chance.
      </p>
    </div>
  {/snippet}

  <div class="panel stack">
    <h2><span>Participantes · {list.length}</span></h2>
    <div>
      <label for="s-t">Título na tela</label><input
        id="s-t"
        type="text"
        bind:value={raffle.title}
        maxlength="40"
      />
    </div>
    <textarea
      bind:value={raffle.raw}
      rows="9"
      placeholder={'Maria\nJoão\n@pedro'}
      aria-label="Nomes dos participantes"></textarea>
    <label class="check">
      <input type="checkbox" bind:checked={raffle.dedupe} /> Ignorar nomes repetidos
    </label>
    <label class="check">
      <input type="checkbox" bind:checked={raffle.removeWinner} /> Quem já ganhou não participa de novo
    </label>
  </div>

  {#if raffle.winners.length}
    <div class="panel stack">
      <h2>
        <span>Ganhadores</span>
        <span class="row">
          <button
            class="btn small ghost"
            onclick={async () =>
              (await copyText(raffle.winners.map((w) => w.name).join('\n'))) &&
              toast.show('Lista copiada.', 'ok')}
          >
            <Icon name="copy" size={16} />Copiar
          </button>
          <button
            class="btn small ghost danger"
            onclick={() => {
              raffle.winners = [];
              raffle.draw = { at: 0, winner: '', pool: [] };
            }}
          >
            Limpar
          </button>
        </span>
      </h2>
      <ol class="winners">
        {#each raffle.winners as w (w.at)}
          <li>
            <b>{w.name}</b>
            <span class="hint">
              {new Date(w.at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </li>
        {/each}
      </ol>
    </div>
  {/if}
</ToolPage>

<style>
  .stage {
    display: grid;
    gap: 12px;
  }
  .screen {
    aspect-ratio: 16 / 9;
    border-radius: var(--radius);
    overflow: hidden;
    border: 1px solid var(--line);
  }
  .winners {
    margin: 0;
    padding-left: 22px;
    display: grid;
    gap: 4px;
  }
</style>
