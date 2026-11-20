<script lang="ts">
  import { prompter as p } from '../prompter.svelte';

  let { compact = false }: { compact?: boolean } = $props();

  let box: HTMLDivElement;
  let content: HTMLDivElement;
  let pos = $state(0);
  let playing = $state(false);
  let count = $state(0);
  let maxPos = $state(1);
  let h = $state(600);
  let raf = 0;
  let last = 0;

  const paragraphs = $derived(
    p.text
      .split('\n')
      .map((l) => (l.startsWith('#') ? { head: true, t: l.replace(/^#+\s*/, '') } : { head: false, t: l })),
  );
  const fontPx = $derived((p.fontSize / 100) * h);
  const pxPerSec = $derived(p.speed * fontPx * 0.12);
  const remaining = $derived(pxPerSec ? Math.max(0, (maxPos - pos) / pxPerSec) : 0);

  function measure() {
    if (!box || !content) return;
    h = box.clientHeight;
    maxPos = Math.max(1, content.scrollHeight - h * 0.4);
  }

  $effect(() => {
    void paragraphs;
    void p.fontSize;
    void p.lineHeight;
    void p.margin;
    queueMicrotask(measure);
  });

  $effect(() => {
    const ro = new ResizeObserver(measure);
    ro.observe(box);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  });

  function frame(t: number) {
    const dt = last ? Math.min(0.1, (t - last) / 1000) : 0;
    last = t;
    pos = Math.min(maxPos, pos + pxPerSec * dt);
    if (pos >= maxPos) {
      playing = false;
      return;
    }
    raf = requestAnimationFrame(frame);
  }

  export function play() {
    if (playing || count) return;
    if (pos >= maxPos) pos = 0;
    const go = () => {
      playing = true;
      last = 0;
      raf = requestAnimationFrame(frame);
    };
    if (p.countdown && pos === 0) {
      count = 3;
      const tick = () => {
        count--;
        if (count > 0) setTimeout(tick, 700);
        else go();
      };
      setTimeout(tick, 700);
    } else go();
  }
  export function pause() {
    playing = false;
    count = 0;
    cancelAnimationFrame(raf);
  }
  export function toggle() {
    if (playing || count) pause();
    else play();
  }
  export function restart() {
    pause();
    pos = 0;
  }
  export function nudge(lines: number) {
    pos = Math.max(0, Math.min(maxPos, pos + lines * fontPx * p.lineHeight));
  }
  export function speed(d: number) {
    p.speed = Math.max(1, Math.min(20, Math.round((p.speed + d) * 10) / 10));
  }
  export function isPlaying() {
    return playing;
  }

  function wheel(e: WheelEvent) {
    e.preventDefault();
    pos = Math.max(0, Math.min(maxPos, pos + e.deltaY));
  }

  // arrastar com o dedo para ajustar a posição
  let touch: { y: number; pos: number; moved: boolean } | null = null;
  function down(e: PointerEvent) {
    touch = { y: e.clientY, pos, moved: false };
  }
  function move(e: PointerEvent) {
    if (!touch) return;
    const dy = touch.y - e.clientY;
    if (Math.abs(dy) > 6) touch.moved = true;
    if (touch.moved) pos = Math.max(0, Math.min(maxPos, touch.pos + dy));
  }
  function up() {
    if (touch && !touch.moved) toggle();
    touch = null;
  }

  const mm = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="prompter {p.theme}"
  class:compact
  bind:this={box}
  onwheel={wheel}
  onpointerdown={down}
  onpointermove={move}
  onpointerup={up}
  onpointercancel={() => (touch = null)}
>
  <div class="flip" style:transform={`scale(${p.mirror ? -1 : 1}, ${p.flipV ? -1 : 1})`}>
    <div
      class="content"
      bind:this={content}
      style:transform={`translate3d(0, ${-pos}px, 0)`}
      style:font-size={`${fontPx}px`}
      style:line-height={p.lineHeight}
      style:padding-inline={`${p.margin}%`}
      style:text-align={p.align}
    >
      <div style:height={`${h * 0.4}px`}></div>
      {#each paragraphs as para, i (i)}
        {#if para.head}<h3>{para.t}</h3>{:else if para.t.trim()}<p>{para.t}</p>{:else}<div
            class="gap"
          ></div>{/if}
      {/each}
      <div class="end">• fim •</div>
      <div style:height={`${h * 0.6}px`}></div>
    </div>
  </div>
  {#if p.guide}<div class="guide" aria-hidden="true"></div>{/if}
  {#if count}<div class="count">{count}</div>{/if}
  <div class="status">
    <span class="prog"><span style:width={`${(pos / maxPos) * 100}%`}></span></span>
    <span>{playing ? '▶' : '❚❚'} {p.speed.toFixed(1)}× · falta {mm(remaining)}</span>
  </div>
</div>

<style>
  .prompter {
    position: relative;
    overflow: hidden;
    width: 100%;
    height: 100%;
    background: #000;
    color: #fff;
    user-select: none;
    touch-action: none;
    cursor: pointer;
    font-family: Poppins, system-ui, sans-serif;
  }
  .prompter.claro {
    background: #fff;
    color: #111;
  }
  .flip {
    width: 100%;
    height: 100%;
  }
  .content {
    will-change: transform;
    font-weight: 500;
  }
  .content p {
    margin: 0 0 0.35em;
  }
  .content h3 {
    font-size: 0.75em;
    color: #f5c85a;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin: 0.6em 0 0.3em;
    font-weight: 700;
  }
  .claro .content h3 {
    color: #a86a0c;
  }
  .gap {
    height: 0.8em;
  }
  .end {
    text-align: center;
    opacity: 0.4;
    font-size: 0.6em;
    margin-top: 1em;
  }
  .guide {
    position: absolute;
    left: 0;
    right: 0;
    top: 40%;
    height: 0;
    border-top: 2px solid rgb(245 200 90 / 0.65);
    pointer-events: none;
  }
  .guide::before,
  .guide::after {
    content: '';
    position: absolute;
    top: -9px;
    border: 8px solid transparent;
  }
  .guide::before {
    left: 0;
    border-left-color: #f5c85a;
  }
  .guide::after {
    right: 0;
    border-right-color: #f5c85a;
  }
  .count {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    font-size: 30vmin;
    font-weight: 800;
    background: rgb(0 0 0 / 0.55);
    color: #f5c85a;
  }
  .status {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 6px 12px;
    font-size: 13px;
    background: linear-gradient(transparent, rgb(0 0 0 / 0.6));
    color: #fff;
    pointer-events: none;
  }
  .prog {
    flex: 1;
    height: 4px;
    background: rgb(255 255 255 / 0.2);
    border-radius: 9px;
    overflow: hidden;
  }
  .prog span {
    display: block;
    height: 100%;
    background: #f5c85a;
  }
</style>
