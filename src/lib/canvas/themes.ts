import { alpha, type Ctx } from './draw';

export interface Theme {
  id: string;
  name: string;
  /** cores usadas na prévia do seletor */
  swatch: [string, string];
  ink: string;
  soft: string;
  accent: string;
  card: string;
  cardLine: string;
  ring: string;
  transparent?: boolean;
  background(ctx: Ctx, w: number, h: number): void;
}

function glow(ctx: Ctx, x: number, y: number, r: number, color: string) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, color.replace(/[\d.]+\)$/, '0)'));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

function linear(ctx: Ctx, w: number, h: number, a: string, b: string) {
  const g = ctx.createLinearGradient(0, 0, w * 0.35, h);
  g.addColorStop(0, a);
  g.addColorStop(1, b);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function darkTheme(
  id: string,
  name: string,
  a: string,
  b: string,
  accent: string,
  glows: [string, string],
  soft = '#c8d7f0',
): Theme {
  return {
    id,
    name,
    swatch: [b, accent],
    ink: '#ffffff',
    soft,
    accent,
    card: 'rgba(255,255,255,0.085)',
    cardLine: alpha(accent, 0.3),
    ring: accent,
    background(ctx, w, h) {
      linear(ctx, w, h, a, b);
      const m = Math.max(w, h);
      ctx.globalCompositeOperation = 'lighter';
      glow(ctx, w * 0.15, h * 0.18, m * 0.42, glows[0]);
      glow(ctx, w * 0.98, h * 1.02, m * 0.36, glows[1]);
      ctx.globalCompositeOperation = 'source-over';
    },
  };
}

export const THEMES: Theme[] = [
  darkTheme('sabatina', 'Sabatina', '#0a1638', '#163a78', '#f5c85a', [
    'rgba(40,90,190,0.40)',
    'rgba(90,60,10,0.40)',
  ]),
  darkTheme(
    'noite',
    'Noite',
    '#07070d',
    '#1a1030',
    '#c9a7ff',
    ['rgba(120,60,200,0.35)', 'rgba(200,40,120,0.25)'],
    '#d9cdf3',
  ),
  darkTheme(
    'aurora',
    'Aurora',
    '#041a24',
    '#10345a',
    '#7af0c8',
    ['rgba(30,160,140,0.35)', 'rgba(70,90,220,0.35)'],
    '#c6ecf0',
  ),
  darkTheme(
    'vinho',
    'Vinho',
    '#1e0610',
    '#4f1029',
    '#f3c77b',
    ['rgba(170,40,80,0.35)', 'rgba(140,90,20,0.35)'],
    '#f0d3dc',
  ),
  darkTheme(
    'floresta',
    'Floresta',
    '#04170f',
    '#0d3d2b',
    '#e9d48a',
    ['rgba(40,140,90,0.35)', 'rgba(120,110,30,0.3)'],
    '#cfe8da',
  ),
  darkTheme(
    'grafite',
    'Grafite',
    '#0d0f12',
    '#23272e',
    '#ff6b4a',
    ['rgba(255,255,255,0.08)', 'rgba(255,90,60,0.22)'],
    '#d7dbe2',
  ),
  {
    id: 'claro',
    name: 'Claro',
    swatch: ['#f6f3ec', '#b4781a'],
    ink: '#18203a',
    soft: '#4b5675',
    accent: '#a86a0c',
    card: 'rgba(255,255,255,0.92)',
    cardLine: 'rgba(24,32,58,0.12)',
    ring: '#a86a0c',
    background(ctx, w, h) {
      linear(ctx, w, h, '#fbf8f2', '#ece5d6');
      const m = Math.max(w, h);
      glow(ctx, w * 0.1, h * 0.1, m * 0.4, 'rgba(255,214,140,0.45)');
      glow(ctx, w, h, m * 0.4, 'rgba(120,150,220,0.25)');
    },
  },
  {
    id: 'transparente',
    name: 'Transparente',
    swatch: ['#888888', '#f5c85a'],
    ink: '#ffffff',
    soft: '#e2e8f5',
    accent: '#f5c85a',
    card: 'rgba(10,18,40,0.88)',
    cardLine: 'rgba(245,200,90,0.45)',
    ring: '#f5c85a',
    transparent: true,
    background() {},
  },
];

export function getTheme(id: string, accentOverride?: string | null): Theme {
  const t = THEMES.find((x) => x.id === id) ?? THEMES[0];
  if (!accentOverride) return t;
  return { ...t, accent: accentOverride, ring: accentOverride, cardLine: alpha(accentOverride, 0.3) };
}

export interface Format {
  id: string;
  name: string;
  hint: string;
  w: number;
  h: number;
}

export const FORMATS: Format[] = [
  { id: '16x9', name: '16:9', hint: 'TV, YouTube, OBS', w: 1920, h: 1080 },
  { id: '9x16', name: '9:16', hint: 'Stories, Reels, Status', w: 1080, h: 1920 },
  { id: '1x1', name: '1:1', hint: 'Feed quadrado', w: 1080, h: 1080 },
  { id: '4x5', name: '4:5', hint: 'Feed retrato', w: 1080, h: 1350 },
];

export function getFormat(id: string): Format {
  return FORMATS.find((f) => f.id === id) ?? FORMATS[0];
}
