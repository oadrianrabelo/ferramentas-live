<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    title,
    lead,
    preview,
    children,
    wide = false,
  }: { title: string; lead?: string; preview?: Snippet; children: Snippet; wide?: boolean } = $props();
</script>

<header class="tool-head">
  <h1>{title}</h1>
  {#if lead}<p class="lead">{lead}</p>{/if}
</header>

{#if preview}
  <div class="tool-layout">
    <section class="preview-col" aria-label="Prévia">{@render preview()}</section>
    <div class="controls">{@render children()}</div>
  </div>
{:else}
  <div class="tool-single" class:wide>{@render children()}</div>
{/if}

<style>
  .tool-head {
    margin-bottom: 18px;
  }
  .tool-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 20px;
  }
  .preview-col {
    min-width: 0;
  }
  .controls {
    display: grid;
    gap: 14px;
    align-content: start;
    min-width: 0;
  }
  .tool-single {
    display: grid;
    gap: 14px;
    max-width: 860px;
  }
  .tool-single.wide {
    max-width: none;
  }
  @media (min-width: 1100px) {
    .tool-layout {
      grid-template-columns: minmax(0, 1fr) minmax(340px, 440px);
      gap: 28px;
    }
    .preview-col {
      position: sticky;
      top: 16px;
      align-self: start;
    }
  }
</style>
