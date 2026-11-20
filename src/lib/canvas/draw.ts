/** Utilitários de desenho 2D compartilhados por todas as ferramentas de imagem. */

export type Ctx = CanvasRenderingContext2D;

export const FONT = 'Poppins, "Helvetica Neue", Arial, sans-serif';

export function font(weight: number, size: number): string {
  return `${weight} ${Math.round(size)}px ${FONT}`;
}

export function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Quebra o texto em linhas que cabem em `maxWidth`. Respeita quebras de linha manuais. */
export function wrapLines(ctx: Ctx, text: string, f: string, maxWidth: number): string[] {
  ctx.font = f;
  const out: string[] = [];
  for (const para of text.split('\n')) {
    const words = para.split(/\s+/).filter(Boolean);
    if (!words.length) {
      out.push('');
      continue;
    }
    let cur = '';
    for (const w of words) {
      const t = cur ? cur + ' ' + w : w;
      if (!cur || ctx.measureText(t).width <= maxWidth) cur = t;
      else {
        out.push(cur);
        cur = w;
      }
      // palavra maior que a linha inteira: quebra no meio
      while (ctx.measureText(cur).width > maxWidth && cur.length > 1) {
        let cut = cur.length - 1;
        while (cut > 1 && ctx.measureText(cur.slice(0, cut) + '-').width > maxWidth) cut--;
        out.push(cur.slice(0, cut) + '-');
        cur = cur.slice(cut);
      }
    }
    out.push(cur);
  }
  // remove linhas vazias do fim
  while (out.length > 1 && out[out.length - 1] === '') out.pop();
  return out;
}

export interface FitResult {
  lines: string[];
  size: number;
  lineHeight: number;
  height: number;
}

/** Encontra o maior tamanho de fonte (entre min e max) em que o texto cabe na caixa. */
export function fitText(
  ctx: Ctx,
  text: string,
  weight: number,
  box: { w: number; h: number },
  opts: { max: number; min: number; lh?: number; maxLines?: number },
): FitResult {
  const lh = opts.lh ?? 1.35;
  let size = opts.max;
  for (;;) {
    const lines = wrapLines(ctx, text, font(weight, size), box.w);
    const lineHeight = size * lh;
    const height = lines.length * lineHeight;
    const linesOk = !opts.maxLines || lines.length <= opts.maxLines;
    if ((height <= box.h && linesOk) || size <= opts.min) {
      return { lines, size, lineHeight, height };
    }
    size = Math.max(opts.min, size - Math.max(1, size * 0.04));
  }
}

/** Escreve as linhas a partir do topo `y`. Retorna o y final. */
export function drawLines(
  ctx: Ctx,
  fit: FitResult,
  x: number,
  y: number,
  weight: number,
  color: string,
  align: CanvasTextAlign = 'left',
): number {
  ctx.font = font(weight, fit.size);
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  fit.lines.forEach((ln, i) => ctx.fillText(ln, x, y + fit.lineHeight * (i + 0.5)));
  return y + fit.height;
}

export function text(
  ctx: Ctx,
  str: string,
  x: number,
  y: number,
  size: number,
  weight: number,
  color: string,
  align: CanvasTextAlign = 'left',
  maxWidth?: number,
) {
  let s = size;
  ctx.font = font(weight, s);
  if (maxWidth) {
    while (s > 10 && ctx.measureText(str).width > maxWidth) {
      s -= 1;
      ctx.font = font(weight, s);
    }
  }
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
  return s;
}

export function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export const AVATAR_COLORS = [
  '#d81b60',
  '#8e24aa',
  '#5c6bc0',
  '#0097a7',
  '#43a047',
  '#ef6c00',
  '#f4511e',
  '#8d6e63',
  '#546e7a',
];

export interface Crop {
  zoom: number;
  ox: number;
  oy: number;
}

/** Desenha a imagem recortada em "cover" dentro do retângulo, com zoom e deslocamento (-100..100). */
export function drawCover(
  ctx: Ctx,
  img: CanvasImageSource & { naturalWidth?: number; naturalHeight?: number; width: number; height: number },
  x: number,
  y: number,
  w: number,
  h: number,
  crop: Crop = { zoom: 1, ox: 0, oy: 0 },
) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const target = w / h;
  let sw = iw,
    sh = iw / target;
  if (sh > ih) {
    sh = ih;
    sw = ih * target;
  }
  sw /= crop.zoom;
  sh /= crop.zoom;
  const mx = iw - sw,
    my = ih - sh;
  const sx = mx / 2 + (crop.ox / 100) * (mx / 2);
  const sy = my / 2 + (crop.oy / 100) * (my / 2);
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

export function initials(name: string): string {
  const clean = name.replace(/^@/, '').trim();
  if (!clean) return '?';
  const parts = clean.split(/[\s._-]+/).filter(Boolean);
  const a = parts[0]?.[0] ?? '?';
  const b = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (a + b).toUpperCase();
}

/** Avatar redondo: foto (se houver) ou iniciais sobre cor estável derivada do nome. */
export function drawAvatar(
  ctx: Ctx,
  cx: number,
  cy: number,
  d: number,
  opts: { img?: HTMLImageElement | null; crop?: Crop; name: string; color?: string | null },
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, d / 2, 0, Math.PI * 2);
  ctx.clip();
  if (opts.img) {
    drawCover(ctx, opts.img, cx - d / 2, cy - d / 2, d, d, opts.crop);
  } else {
    const key = opts.name.replace(/^@/, '').toLowerCase();
    ctx.fillStyle = opts.color || AVATAR_COLORS[hash(key) % AVATAR_COLORS.length];
    ctx.fillRect(cx - d / 2, cy - d / 2, d, d);
    const ini = initials(opts.name);
    ctx.fillStyle = '#fff';
    ctx.font = font(600, d * (ini.length > 1 ? 0.4 : 0.5));
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ini, cx, cy + d * 0.03);
  }
  ctx.restore();
}

export function line(ctx: Ctx, x1: number, y1: number, x2: number, y2: number, color: string, width = 2) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

/** Converte #rrggbb + alfa em rgba(). */
export function alpha(hex: string, a: number): string {
  const h = hex.replace('#', '');
  const n = parseInt(
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h.slice(0, 6),
    16,
  );
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/** Pílula de texto (ex.: “YouTube”, “LIÇÃO 8”). Retorna a largura. */
export function pill(
  ctx: Ctx,
  label: string,
  x: number,
  y: number,
  size: number,
  bg: string,
  fg: string,
  align: 'left' | 'center' | 'right' = 'left',
): number {
  ctx.font = font(700, size);
  const padX = size * 0.7;
  const w = ctx.measureText(label).width + padX * 2;
  const h = size * 1.8;
  const left = align === 'left' ? x : align === 'center' ? x - w / 2 : x - w;
  roundRect(ctx, left, y - h / 2, w, h, h / 2);
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.fillStyle = fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, left + w / 2, y + size * 0.04);
  return w;
}
