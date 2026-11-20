/**
 * Carregamento de imagens e fontes para o canvas.
 * `tick` é reativo: qualquer desenho que chame `getImage` ou `fontsReady`
 * é refeito sozinho quando a imagem/fonte termina de carregar.
 */
let tick = $state(0);
const cache = new Map<string, HTMLImageElement>();

export function getImage(src: string | null | undefined): HTMLImageElement | null {
  void tick;
  if (!src) return null;
  let img = cache.get(src);
  if (!img) {
    img = new Image();
    img.decoding = 'async';
    img.onload = () => tick++;
    img.onerror = () => tick++;
    img.src = src;
    cache.set(src, img);
    if (cache.size > 120) {
      const first = cache.keys().next().value;
      if (first) cache.delete(first);
    }
  }
  return img.complete && img.naturalWidth ? img : null;
}

/** Espera uma imagem carregar (para exportar em lote sem prévia na tela). */
export function whenImage(src: string | null | undefined): Promise<void> {
  if (!src) return Promise.resolve();
  const img = cache.get(src) ?? (getImage(src), cache.get(src)!);
  if (img.complete) return Promise.resolve();
  return new Promise((res) => {
    img.addEventListener('load', () => res(), { once: true });
    img.addEventListener('error', () => res(), { once: true });
  });
}

let fontsLoaded = $state(false);
export function fontsReady(): boolean {
  return fontsLoaded;
}

export async function loadFonts() {
  if (typeof document === 'undefined' || !document.fonts) return;
  const weights = [400, 500, 600, 700, 800];
  await Promise.allSettled(weights.map((w) => document.fonts.load(`${w} 40px Poppins`, 'ÁáçãõÉé@#')));
  fontsLoaded = true;
  tick++;
}

/**
 * Lê um arquivo de imagem e devolve um data URL reduzido (mantém a proporção).
 * Fotos de celular viram ~30–80 KB, o que cabe tranquilo no armazenamento local.
 */
export async function fileToDataUrl(file: Blob, maxSide = 640, type = 'image/jpeg'): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => rej(new Error('Não consegui abrir essa imagem.'));
      i.src = url;
    });
    const s = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * s));
    const h = Math.max(1, Math.round(img.naturalHeight * s));
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, w, h);
    return c.toDataURL(type, 0.86);
  } finally {
    URL.revokeObjectURL(url);
  }
}
