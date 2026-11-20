import { persisted } from './persist.svelte';
import { hhmmToMinutes } from './parse';

export type TimerMode = 'countdown' | 'target' | 'stopwatch' | 'clock';

/** Estado salvo e sincronizado entre a janela principal e a tela de exibição. */
export const timer = persisted(
  'timer',
  {
    mode: 'countdown' as TimerMode,
    duration: 10 * 60,
    target: '19:30',
    running: false,
    startedAt: 0,
    elapsedBefore: 0,
    label: 'A live começa em',
    warn: 120,
    danger: 30,
    overtime: true,
    endText: 'Tempo esgotado',
    beep: true,
    theme: 'sabatina',
    showLogo: true,
  },
  { sync: true },
);

export function elapsedMs(now: number): number {
  return timer.elapsedBefore + (timer.running ? now - timer.startedAt : 0);
}

function targetDate(now: number): number {
  const min = hhmmToMinutes(timer.target) ?? 0;
  const d = new Date(now);
  d.setHours(Math.floor(min / 60), min % 60, 0, 0);
  // se o horário já passou há mais de 6 h, entende que é amanhã
  if (d.getTime() < now - 6 * 3600_000) d.setDate(d.getDate() + 1);
  return d.getTime();
}

export interface TimerView {
  /** segundos a mostrar (pode ser negativo no tempo extra) */
  seconds: number;
  /** 0..1 do tempo consumido (contagens) */
  progress: number;
  status: 'idle' | 'ok' | 'warn' | 'danger' | 'over';
  clock?: string;
}

export function view(now: number): TimerView {
  const t = timer;
  if (t.mode === 'clock') {
    const d = new Date(now);
    const p = (x: number) => String(x).padStart(2, '0');
    return {
      seconds: 0,
      progress: 0,
      status: 'ok',
      clock: `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`,
    };
  }
  if (t.mode === 'stopwatch') {
    const s = Math.floor(elapsedMs(now) / 1000);
    return { seconds: s, progress: 0, status: t.running || s ? 'ok' : 'idle' };
  }
  const total = t.mode === 'countdown' ? t.duration : 0;
  const remaining = t.mode === 'countdown' ? total - elapsedMs(now) / 1000 : (targetDate(now) - now) / 1000;
  const sec = remaining >= 0 ? Math.ceil(remaining) : -Math.floor(-remaining);
  const status: TimerView['status'] =
    t.mode === 'countdown' && !t.running && t.elapsedBefore === 0
      ? 'idle'
      : remaining <= 0
        ? 'over'
        : remaining <= t.danger
          ? 'danger'
          : remaining <= t.warn
            ? 'warn'
            : 'ok';
  const progress = total ? Math.min(1, Math.max(0, 1 - remaining / total)) : 0;
  return { seconds: t.overtime || sec > 0 ? sec : 0, progress, status };
}

export function start(now = Date.now()) {
  if (timer.running) return;
  timer.startedAt = now;
  timer.running = true;
}
export function pause(now = Date.now()) {
  if (!timer.running) return;
  timer.elapsedBefore += now - timer.startedAt;
  timer.running = false;
}
export function toggle() {
  if (timer.running) pause();
  else start();
}
export function reset() {
  timer.running = false;
  timer.elapsedBefore = 0;
  timer.startedAt = 0;
}
/** Soma (ou tira) minutos do tempo restante. */
export function addMinutes(m: number) {
  if (timer.mode === 'countdown') timer.duration = Math.max(10, timer.duration + m * 60);
  else if (timer.mode === 'target') {
    const min = (hhmmToMinutes(timer.target) ?? 0) + m;
    const t = ((min % 1440) + 1440) % 1440;
    timer.target = `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
  }
}

/** Relógio reativo que avança a cada ~200 ms enquanto houver alguém olhando. */
export function createNow(interval = 200) {
  let now = $state(Date.now());
  $effect(() => {
    const id = setInterval(() => (now = Date.now()), interval);
    return () => clearInterval(id);
  });
  return {
    get value() {
      return now;
    },
  };
}

let audio: AudioContext | null = null;
export function beep(times = 3) {
  try {
    audio ??= new AudioContext();
    const ctx = audio;
    for (let i = 0; i < times; i++) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = 880;
      o.type = 'sine';
      const t0 = ctx.currentTime + i * 0.35;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.4, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.25);
      o.connect(g).connect(ctx.destination);
      o.start(t0);
      o.stop(t0 + 0.3);
    }
  } catch {
    /* sem áudio */
  }
}
