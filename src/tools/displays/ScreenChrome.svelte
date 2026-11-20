<script lang="ts">
  import type { Snippet } from 'svelte';
  import Icon from '../../lib/components/Icon.svelte';
  import { keepAwake, toggleFullscreen } from '../../lib/platform';

  let { back, children, tools }: { back: string; children: Snippet; tools?: Snippet } = $props();

  let idle = $state(false);
  let timer: ReturnType<typeof setTimeout>;
  function wake() {
    idle = false;
    clearTimeout(timer);
    timer = setTimeout(() => (idle = true), 2500);
  }

  $effect(() => {
    wake();
    let release = () => {};
    keepAwake().then((r) => (release = r));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') toggleFullscreen();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      release();
      clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
    };
  });

  function close() {
    // janela própria: fecha; senão volta para a ferramenta
    if (window.opener) window.close();
    else location.hash = `#/${back}`;
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="screen" class:idle onpointermove={wake} onpointerdown={wake}>
  {@render children()}
  <div class="chrome">
    {@render tools?.()}
    <button class="cbtn" onclick={() => toggleFullscreen()} aria-label="Tela cheia">
      <Icon name="expand" />
    </button>
    <button class="cbtn" onclick={close} aria-label="Fechar"><Icon name="x" /></button>
  </div>
</div>

<style>
  .screen {
    position: fixed;
    inset: 0;
    background: #000;
    color: #fff;
  }
  .screen.idle {
    cursor: none;
  }
  .chrome {
    position: absolute;
    top: calc(10px + env(safe-area-inset-top));
    left: 10px;
    display: flex;
    gap: 6px;
    transition: opacity 0.3s;
    z-index: 10;
  }
  .idle .chrome {
    opacity: 0;
    pointer-events: none;
  }
  .chrome :global(.cbtn) {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    border: 1px solid rgb(255 255 255 / 0.2);
    background: rgb(0 0 0 / 0.55);
    color: #fff;
    display: grid;
    place-items: center;
    backdrop-filter: blur(6px);
  }
</style>
