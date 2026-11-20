/** Funções puras (testadas em parse.test.ts). */

export interface ParsedComment {
  user: string;
  text: string;
}

const TIME = /^\[?\d{1,2}:\d{2}(?::\d{2})?(?:\s?[AaPp]\.?[Mm]\.?)?\]?\s+/;
const COLON = /^@?([^:：\n]{1,40}?)\s*[:：]\s+(.+)$/;
const DASH = /^@?(\S[^\n]{0,38}?)\s+[-–—]\s+(.+)$/;

function cleanUser(u: string) {
  return u.trim().replace(/^@+/, '');
}

/**
 * Converte texto colado do chat em comentários.
 * Aceita “nome: comentário”, “nome - comentário”, horário no início (“12:03 nome: …”)
 * ou linhas alternadas (nome numa linha, comentário na outra).
 */
export function parseComments(raw: string): ParsedComment[] {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim().replace(TIME, ''))
    .filter(Boolean);
  if (!lines.length) return [];

  const withSep = lines.map((l) => l.match(COLON) ?? l.match(DASH));
  const sepCount = withSep.filter(Boolean).length;
  if (sepCount >= Math.ceil(lines.length / 2)) {
    const out: ParsedComment[] = [];
    lines.forEach((l, i) => {
      const m = withSep[i];
      if (m) out.push({ user: cleanUser(m[1]), text: m[2].trim() });
      else if (out.length)
        out[out.length - 1].text += ' ' + l; // continuação da linha anterior
      else out.push({ user: '', text: l });
    });
    return out;
  }

  const looksLikeName = (s: string) => s.length <= 40 && !/[.!?…]$/.test(s) && s.split(/\s+/).length <= 5;
  if (lines.length % 2 === 0 && lines.every((l, i) => i % 2 === 1 || looksLikeName(l))) {
    const out: ParsedComment[] = [];
    for (let i = 0; i < lines.length; i += 2) out.push({ user: cleanUser(lines[i]), text: lines[i + 1] });
    return out;
  }

  return lines.map((l) => ({ user: '', text: l }));
}

/** Primeira letra maiúscula, espaços normalizados. */
export function tidyText(s: string, capitalize = true): string {
  const t = s
    .replace(/[ \t]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .trim();
  return capitalize && t ? t.charAt(0).toUpperCase() + t.slice(1) : t;
}

export function handle(user: string): string {
  const u = user.trim();
  if (!u) return '';
  return u.startsWith('@') || /\s/.test(u) ? u : '@' + u;
}

export function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

/** Lista de nomes única (sem diferenciar maiúsculas/acentos), mantendo a ordem. */
export function uniqueNames(raw: string, dedupe = true): string[] {
  const names = raw
    .split(/[\n,;]+/)
    .map((s) =>
      s
        .trim()
        .replace(TIME, '')
        .replace(/[:：].*$/, '')
        .trim(),
    )
    .filter(Boolean);
  if (!dedupe) return names;
  const seen = new Set<string>();
  return names.filter((n) => {
    const k = n.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/^@/, '').toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/** Sorteio justo usando crypto quando disponível. */
export function randomInt(max: number): number {
  if (max <= 0) return 0;
  const c = globalThis.crypto;
  if (c?.getRandomValues) {
    const lim = Math.floor(0x1_0000_0000 / max) * max;
    const buf = new Uint32Array(1);
    do c.getRandomValues(buf);
    while (buf[0] >= lim);
    return buf[0] % max;
  }
  return Math.floor(Math.random() * max);
}

/** 3725 → "1:02:05"; 65 → "01:05". Negativos ganham “-”. */
export function fmtDuration(totalSeconds: number, alwaysHours = false): string {
  const neg = totalSeconds < 0;
  let s = Math.abs(Math.trunc(totalSeconds));
  const h = Math.floor(s / 3600);
  s -= h * 3600;
  const m = Math.floor(s / 60);
  s -= m * 60;
  const p = (x: number) => String(x).padStart(2, '0');
  const body = h || alwaysHours ? `${h}:${p(m)}:${p(s)}` : `${p(m)}:${p(s)}`;
  return (neg ? '-' : '') + body;
}

/** Marca de capítulo do YouTube: 0:00, 4:05, 1:02:03. */
export function fmtChapter(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const p = (x: number) => String(x).padStart(2, '0');
  return h ? `${h}:${p(m)}:${p(sec)}` : `${m}:${p(sec)}`;
}

/** Substitui {chave} pelos valores; chaves vazias somem junto com espaços duplicados. */
export function fillTemplate(tpl: string, vars: Record<string, string>): string {
  return tpl
    .replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? '')
    .split('\n')
    .map((l) =>
      l
        .replace(/[ \t]{2,}/g, ' ')
        .replace(/\s+([|•·-])\s*$/, '')
        .trimEnd(),
    )
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** "19:30" → minutos desde 00:00. */
export function hhmmToMinutes(v: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(v.trim());
  if (!m) return null;
  return +m[1] * 60 + +m[2];
}

export function minutesToHhmm(min: number): string {
  const t = ((Math.round(min) % 1440) + 1440) % 1440;
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
}
