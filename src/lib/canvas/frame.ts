import { getImage } from './assets.svelte';
import { alpha, line, text, type Ctx } from './draw';
import type { Theme } from './themes';
import logoIasd from '../../assets/logo-iasd.png';

export interface Brand {
  title: string;
  place: string;
  footer: string;
  handle: string;
  logo: 'iasd' | 'custom' | 'none';
  customLogo: string | null;
  theme: string;
  accent: string | null;
}

export interface FrameOpts {
  subtitle?: string;
  header?: boolean;
  footer?: boolean;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function brandLogo(brand: Brand): HTMLImageElement | null {
  if (brand.logo === 'none') return null;
  return getImage(brand.logo === 'custom' ? brand.customLogo : logoIasd);
}

/**
 * Desenha fundo, cabeçalho e rodapé da marca e devolve a área livre para o conteúdo.
 * Tudo é proporcional a `u` (1 = 1080 px no lado menor).
 */
export function drawFrame(
  ctx: Ctx,
  w: number,
  h: number,
  theme: Theme,
  brand: Brand,
  o: FrameOpts = {},
): Rect {
  const u = Math.min(w, h) / 1080;
  const portrait = h > w;
  const mx = (portrait ? 70 : 110) * u;
  ctx.clearRect(0, 0, w, h);
  theme.background(ctx, w, h);

  let top = mx * 0.6;
  let bottom = h - mx * 0.6;

  if (o.header !== false) {
    const logo = brandLogo(brand);
    const lh = (portrait ? 104 : 118) * u;
    let lw = 0;
    if (logo) {
      lw = (logo.naturalWidth * lh) / logo.naturalHeight;
      ctx.drawImage(logo, w - mx - lw, (portrait ? 90 : 50) * u, lw, lh);
    }
    const textMax = w - mx * 2 - (lw ? lw + 30 * u : 0);
    const y0 = (portrait ? 110 : 98) * u;
    if (brand.title.trim()) text(ctx, brand.title, mx, y0, 40 * u, 700, theme.accent, 'left', textMax);
    const sub = [o.subtitle, brand.place].filter((x) => x && x.trim()).join('  •  ');
    if (sub) text(ctx, sub, mx, y0 + 52 * u, 28 * u, 500, theme.soft, 'left', textMax);
    const ly = (portrait ? 230 : 190) * u;
    line(ctx, mx, ly, w - mx, ly, alpha(theme.accent, 0.47), 2 * u);
    top = ly + 32 * u;
  }

  if (o.footer !== false) {
    const fy = h - (portrait ? 190 : 150) * u;
    line(ctx, mx, fy, w - mx, fy, alpha(theme.accent, 0.47), 2 * u);
    const parts = [brand.footer, brand.handle].filter((x) => x && x.trim());
    if (parts.length)
      text(ctx, parts.join('   ·   '), w / 2, fy + 60 * u, 30 * u, 500, theme.soft, 'center', w - mx * 2);
    bottom = fy - 32 * u;
  }

  return { x: mx, y: top, w: w - mx * 2, h: bottom - top };
}
