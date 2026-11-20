<script lang="ts">
  import { raffle, participants, SPIN_MS } from '../raffle.svelte';

  let { now }: { now: number } = $props();

  const spinning = $derived(raffle.draw.at > 0 && now < raffle.draw.at + SPIN_MS);
  const showWinner = $derived(!!raffle.draw.winner && !spinning && now - raffle.draw.at < 10 * 60_000);
  const count = $derived(participants().length);

  // nome “rolando”: troca rápido no começo e desacelera
  const spinName = $derived.by(() => {
    if (!spinning) return '';
    const pool = raffle.draw.pool.length ? raffle.draw.pool : [raffle.draw.winner];
    const t = (now - raffle.draw.at) / SPIN_MS;
    const step = Math.floor(Math.pow(t, 0.55) * 46);
    return pool[(step * 7) % pool.length];
  });

  const confetti = Array.from({ length: 40 }, (_, i) => ({
    left: (i * 37) % 100,
    delay: (i % 10) * 0.12,
    dur: 2.4 + (i % 5) * 0.35,
    color: ['#f5c85a', '#ff6b6b', '#7af0c8', '#7aa2ff', '#ffffff'][i % 5],
    rot: (i * 53) % 360,
  }));
</script>

<div class="board">
  <div class="title">{raffle.title}</div>
  {#if spinning}
    <div class="name spin">{spinName}</div>
    <div class="sub">Sorteando…</div>
  {:else if showWinner}
    <div class="sub top">E quem ganhou foi…</div>
    <div class="name win">{raffle.draw.winner}</div>
    <div class="confetti" aria-hidden="true">
      {#each confetti as c, i (i)}
        <i
          style:left={`${c.left}%`}
          style:animation-delay={`${c.delay}s`}
          style:animation-duration={`${c.dur}s`}
          style:background={c.color}
          style:rotate={`${c.rot}deg`}
        ></i>
      {/each}
    </div>
  {:else}
    <div class="name idle">{count} participante{count === 1 ? '' : 's'}</div>
    <div class="sub">Pronto para sortear</div>
  {/if}
</div>

<style>
  .board {
    position: relative;
    container-type: size;
    width: 100%;
    height: 100%;
    display: grid;
    place-content: center;
    text-align: center;
    gap: 3cqh;
    overflow: hidden;
    background: radial-gradient(circle at 30% 20%, #1c3a7a, #070c19 72%);
    color: #fff;
    font-family: Poppins, system-ui, sans-serif;
    padding: 4cqh 4cqw;
  }
  .title {
    position: absolute;
    top: 6cqh;
    left: 0;
    right: 0;
    font-size: 6cqh;
    font-weight: 700;
    color: #f5c85a;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .name {
    font-size: min(16cqh, 10cqw);
    font-weight: 800;
    line-height: 1.05;
    word-break: break-word;
  }
  .name.spin {
    opacity: 0.9;
    filter: blur(0.3px);
  }
  .name.win {
    color: #f5c85a;
    animation: pop 0.6s cubic-bezier(0.2, 1.6, 0.4, 1);
    text-shadow: 0 0 40px rgb(245 200 90 / 0.5);
  }
  .name.idle {
    font-size: min(10cqh, 7cqw);
    color: #c8d7f0;
  }
  .sub {
    font-size: 4.5cqh;
    color: #c8d7f0;
  }
  .sub.top {
    order: -1;
  }
  @keyframes pop {
    from {
      transform: scale(0.4);
      opacity: 0;
    }
  }
  .confetti {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  .confetti i {
    position: absolute;
    top: -5%;
    width: 1.4cqw;
    height: 2.4cqh;
    border-radius: 2px;
    animation: fall linear infinite;
  }
  @keyframes fall {
    to {
      transform: translateY(115cqh) rotate(540deg);
    }
  }
</style>
