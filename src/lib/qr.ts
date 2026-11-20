import qrcode from 'qrcode-generator';

export interface QrMatrix {
  size: number;
  dark: (r: number, c: number) => boolean;
}

/** Gera a matriz do QR (UTF-8, correção M). */
export function makeQr(data: string, level: 'L' | 'M' | 'Q' | 'H' = 'M'): QrMatrix | null {
  if (!data) return null;
  try {
    const qr = qrcode(0, level);
    const bytes = new TextEncoder().encode(data);
    qr.addData(String.fromCharCode(...bytes), 'Byte');
    qr.make();
    const size = qr.getModuleCount();
    return { size, dark: (r, c) => qr.isDark(r, c) };
  } catch {
    return null;
  }
}

/** Desenha o QR com fundo branco e margem (zona de silêncio) dentro do quadrado. */
export function drawQr(
  ctx: CanvasRenderingContext2D,
  m: QrMatrix,
  x: number,
  y: number,
  side: number,
  fg = '#0b1226',
  bg = '#ffffff',
  radius = 0,
) {
  const quiet = 3;
  const cell = side / (m.size + quiet * 2);
  ctx.fillStyle = bg;
  if (radius) {
    ctx.beginPath();
    ctx.roundRect(x, y, side, side, radius);
    ctx.fill();
  } else ctx.fillRect(x, y, side, side);
  ctx.fillStyle = fg;
  for (let r = 0; r < m.size; r++)
    for (let c = 0; c < m.size; c++)
      if (m.dark(r, c))
        ctx.fillRect(
          x + (c + quiet) * cell,
          y + (r + quiet) * cell,
          Math.ceil(cell + 0.5),
          Math.ceil(cell + 0.5),
        );
}
