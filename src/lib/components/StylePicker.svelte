<script lang="ts">
  import { FORMATS, THEMES } from '../canvas/themes';
  import Segmented from './Segmented.svelte';

  let {
    theme = $bindable(),
    format = $bindable(),
    formats = FORMATS.map((f) => f.id),
    allowTransparent = false,
  }: { theme: string; format?: string; formats?: string[]; allowTransparent?: boolean } = $props();

  const themes = $derived(THEMES.filter((t) => allowTransparent || !t.transparent));
  const fmtOptions = $derived(
    FORMATS.filter((f) => formats.includes(f.id)).map((f) => ({ value: f.id, label: f.name, title: f.hint })),
  );
</script>

<div class="panel">
  <h2>Visual</h2>
  <div class="themes" role="group" aria-label="Tema">
    {#each themes as t (t.id)}
      <button
        type="button"
        class="theme"
        aria-pressed={theme === t.id}
        onclick={() => (theme = t.id)}
        style:--a={t.swatch[0]}
        style:--b={t.swatch[1]}
      >
        <span class="sw" class:tr={t.transparent}></span>
        {t.name}
      </button>
    {/each}
  </div>
  {#if format !== undefined && fmtOptions.length > 1}
    <div class="fmt">
      <span class="label">Formato</span>
      <Segmented options={fmtOptions} bind:value={format} label="Formato da imagem" />
    </div>
  {/if}
</div>

<style>
  .themes {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .theme {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border: 1px solid var(--line);
    background: var(--field);
    color: var(--ink);
    border-radius: 999px;
    padding: 5px 12px 5px 5px;
    font-size: 13px;
  }
  .theme[aria-pressed='true'] {
    border-color: var(--accent);
    box-shadow: 0 0 0 1px var(--accent) inset;
    font-weight: 600;
  }
  .sw {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--a) 55%, var(--b) 55%);
    border: 1px solid rgb(255 255 255 / 0.25);
  }
  .sw.tr {
    background:
      linear-gradient(135deg, transparent 55%, var(--b) 55%),
      repeating-conic-gradient(#999 0 25%, #ddd 0 50%) 0 0 / 8px 8px;
  }
  .fmt {
    margin-top: 14px;
    display: grid;
    gap: 6px;
  }
</style>
