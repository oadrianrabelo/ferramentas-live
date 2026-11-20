import { persisted } from './persist.svelte';
import { fmtChapter, hhmmToMinutes, minutesToHhmm } from './parse';
import { uid } from './platform';

export interface Segment {
  id: string;
  title: string;
  minutes: number;
  who: string;
  notes: string;
}

const seg = (title: string, minutes: number, who = ''): Segment => ({
  id: uid(),
  title,
  minutes,
  who,
  notes: '',
});

export const rundown = persisted(
  'roteiro',
  {
    plannedStart: '09:00',
    items: [
      seg('Abertura e boas-vindas', 3),
      seg('Louvor', 8),
      seg('Oração', 3),
      seg('Informativo missionário', 5),
      seg('Estudo da lição', 40),
      seg('Comentários e perguntas', 6),
      seg('Apelo e encerramento', 5),
    ] as Segment[],
    startedAt: 0,
    endedAt: 0,
    index: -1,
    /** segundos desde o início em que cada momento começou */
    marks: [] as number[],
  },
  { sync: true },
);

export const totalPlanned = () => rundown.items.reduce((a, s) => a + (Number(s.minutes) || 0), 0);

/** Horário previsto de início de cada momento (pelo plano). */
export function plannedTimes(): string[] {
  let t = hhmmToMinutes(rundown.plannedStart) ?? 0;
  return rundown.items.map((s) => {
    const r = minutesToHhmm(t);
    t += Number(s.minutes) || 0;
    return r;
  });
}

export function isLive() {
  return rundown.startedAt > 0 && !rundown.endedAt && rundown.index >= 0;
}

export function startLive(now = Date.now()) {
  rundown.startedAt = now;
  rundown.endedAt = 0;
  rundown.index = 0;
  rundown.marks = [0];
}

export function goTo(i: number, now = Date.now()) {
  if (!rundown.startedAt) startLive(now);
  if (i < 0 || i >= rundown.items.length) return;
  const sec = Math.round((now - rundown.startedAt) / 1000);
  const marks = rundown.marks.slice(0, i);
  while (marks.length < i) marks.push(sec);
  marks[i] = sec;
  rundown.marks = marks;
  rundown.index = i;
}

export function next(now = Date.now()) {
  if (rundown.index >= rundown.items.length - 1) return endLive(now);
  goTo(rundown.index + 1, now);
}

export function prev(now = Date.now()) {
  if (rundown.index > 0) {
    rundown.marks = rundown.marks.slice(0, rundown.index);
    rundown.index -= 1;
  }
  void now;
}

export function endLive(now = Date.now()) {
  rundown.endedAt = now;
}

export function resetLive() {
  rundown.startedAt = 0;
  rundown.endedAt = 0;
  rundown.index = -1;
  rundown.marks = [];
}

export interface LiveView {
  elapsed: number;
  segElapsed: number;
  segRemaining: number;
  segProgress: number;
  /** positivo = atrasado em relação ao plano (s) */
  delay: number;
  forecastEnd: string;
}

export function liveView(now: number): LiveView | null {
  if (!rundown.startedAt || rundown.index < 0) return null;
  const end = rundown.endedAt || now;
  const elapsed = (end - rundown.startedAt) / 1000;
  const cur = rundown.items[rundown.index];
  const segStart = rundown.marks[rundown.index] ?? 0;
  const segElapsed = elapsed - segStart;
  const segPlan = (Number(cur?.minutes) || 0) * 60;
  const segRemaining = segPlan - segElapsed;
  const planBefore = rundown.items
    .slice(0, rundown.index)
    .reduce((a, s) => a + (Number(s.minutes) || 0) * 60, 0);
  const delay = segStart - planBefore + Math.max(0, -segRemaining);
  const rest = rundown.items.slice(rundown.index + 1).reduce((a, s) => a + (Number(s.minutes) || 0) * 60, 0);
  const endTs = end + (Math.max(0, segRemaining) + (rundown.endedAt ? 0 : rest)) * 1000;
  const d = new Date(rundown.endedAt || endTs);
  return {
    elapsed,
    segElapsed,
    segRemaining,
    segProgress: segPlan ? Math.min(1, segElapsed / segPlan) : 0,
    delay,
    forecastEnd: minutesToHhmm(d.getHours() * 60 + d.getMinutes()),
  };
}

/** Capítulos para a descrição do YouTube: usa os tempos reais se a live aconteceu, senão o plano. */
export function chapters(): string {
  const real = rundown.marks.length > 0;
  let acc = 0;
  const lines = rundown.items.map((s, i) => {
    let t: number;
    if (real) t = rundown.marks[i] ?? -1;
    else {
      t = acc;
      acc += (Number(s.minutes) || 0) * 60;
    }
    return t >= 0 ? `${fmtChapter(t)} ${s.title}` : '';
  });
  return lines.filter(Boolean).join('\n');
}
