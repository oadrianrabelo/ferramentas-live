import { persisted } from './persist.svelte';
import { randomInt, uniqueNames } from './parse';

export const SPIN_MS = 3800;

export const raffle = persisted(
  'sorteio',
  {
    title: 'Sorteio',
    raw: '',
    dedupe: true,
    removeWinner: true,
    winners: [] as { name: string; at: number }[],
    draw: { at: 0, winner: '', pool: [] as string[] },
  },
  { sync: true },
);

export function participants(): string[] {
  const names = uniqueNames(raffle.raw, raffle.dedupe);
  if (!raffle.removeWinner) return names;
  const won = new Set(raffle.winners.map((w) => w.name));
  return names.filter((n) => !won.has(n));
}

export function drawWinner(): string | null {
  const pool = participants();
  if (!pool.length) return null;
  const winner = pool[randomInt(pool.length)];
  // guarda uma amostra para a animação nas outras janelas
  const sample = pool.length > 60 ? Array.from({ length: 60 }, () => pool[randomInt(pool.length)]) : pool;
  raffle.draw = { at: Date.now(), winner, pool: sample };
  setTimeout(() => {
    if (raffle.draw.winner === winner) raffle.winners.unshift({ name: winner, at: Date.now() });
  }, SPIN_MS);
  return winner;
}
