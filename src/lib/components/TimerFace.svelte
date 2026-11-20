<script lang="ts">
  import { timer, view, type TimerView } from '../timer.svelte';
  import { fmtDuration } from '../parse';
  import { getTheme } from '../canvas/themes';
  import { brand } from '../stores.svelte';
  import logoIasd from '../../assets/logo-iasd.png';

  let { now, compact = false }: { now: number; compact?: boolean } = $props();

  const v: TimerView = $derived(view(now));
  const theme = $derived(getTheme(timer.theme, brand.accent));
  const digits = $derived(v.clock ?? fmtDuration(v.seconds));
  const label = $derived(timer.mode === 'clock' ? 'Agora' : timer.label);
  const showEnd = $derived(v.status === 'over' && !timer.overtime);
  const logo = $derived(
    !timer.showLogo || brand.logo === 'none' ? null : brand.logo === 'custom' ? brand.customLogo : logoIasd,
  );
  const color = $derived(
    v.status === 'over'
      ? '#ff4d4f'
      : v.status === 'danger'
        ? '#ff6b4a'
        : v.status === 'warn'
          ? '#ffc53d'
          : theme.ink,
  );

  let bgEl: HTMLCanvasElement | undefined = $state();
  $effect(() => {
    if (!bgEl) return;
    const ctx = bgEl.getContext('2d')!;
    theme.background(ctx, bgEl.width, bgEl.height);
  });
</script>

<div
  class="face"
  class:compact
  class:blink={v.status === 'over'}
  style:--ink={theme.ink}
  style:--soft={theme.soft}
  style:--accent={theme.accent}
>
  <canvas bind:this={bgEl} width="480" height="270" class="bg" aria-hidden="true"></canvas>
  {#if logo}<img class="logo" src={logo} alt="" />{/if}
  {#if label}<div class="label">{label}</div>{/if}
  <div class="digits" class:end={showEnd} style:color aria-live="off">{showEnd ? timer.endText : digits}</div>
  {#if timer.mode === 'countdown'}
    <div class="bar"><span style:width={`${v.progress * 100}%`} style:background={color}></span></div>
  {/if}
</div>

<style>
  .face {
    position: relative;
    container-type: size;
    width: 100%;
    height: 100%;
    display: grid;
    place-content: center;
    justify-items: center;
    gap: 2cqh;
    overflow: hidden;
    color: var(--ink);
    font-family: Poppins, system-ui, sans-serif;
    text-align: center;
    padding: 4cqh 4cqw;
  }
  .bg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
  }
  .face > :not(.bg) {
    position: relative;
    z-index: 1;
  }
  .logo {
    position: absolute !important;
    top: 4cqh;
    right: 3cqw;
    height: 11cqh;
  }
  .label {
    font-size: min(7cqh, 5cqw);
    font-weight: 600;
    color: var(--accent);
    letter-spacing: 0.02em;
  }
  .digits {
    font-size: min(36cqh, 21cqw);
    line-height: 1;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.02em;
    transition: color 0.3s;
    white-space: nowrap;
  }
  .digits.end {
    font-size: min(16cqh, 9cqw);
    white-space: normal;
  }
  .bar {
    width: min(70cqw, 1200px);
    height: max(6px, 1.6cqh);
    border-radius: 999px;
    background: rgb(255 255 255 / 0.14);
    overflow: hidden;
  }
  .bar span {
    display: block;
    height: 100%;
    border-radius: inherit;
    transition: width 0.25s linear;
  }
  .blink .digits {
    animation: blink 1s steps(2, start) infinite;
  }
  @keyframes blink {
    50% {
      opacity: 0.35;
    }
  }
</style>
