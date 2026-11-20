/** Ponte entre web (navegador/PWA) e app nativo (Tauri: desktop e Android). */

export const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
export const isMobileUA =
  typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

export type SaveResult = 'saved' | 'downloaded' | 'shared' | 'cancelled';

function anchorDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

function extOf(name: string) {
  return name.split('.').pop()?.toLowerCase() ?? 'png';
}

/** Salva um arquivo: diálogo nativo no app, download no navegador. */
export async function saveBlob(blob: Blob, filename: string): Promise<SaveResult> {
  if (isTauri) {
    try {
      const [{ save }, { writeFile }] = await Promise.all([
        import('@tauri-apps/plugin-dialog'),
        import('@tauri-apps/plugin-fs'),
      ]);
      const ext = extOf(filename);
      const path = await save({
        defaultPath: filename,
        filters: [{ name: ext.toUpperCase(), extensions: [ext] }],
      });
      if (!path) return 'cancelled';
      await writeFile(path, new Uint8Array(await blob.arrayBuffer()));
      return 'saved';
    } catch (e) {
      console.warn('Salvamento nativo falhou, usando download:', e);
    }
  }
  anchorDownload(blob, filename);
  return 'downloaded';
}

/** Salva vários arquivos. No desktop nativo pede uma pasta só uma vez. */
export async function saveMany(files: { blob: Blob; name: string }[]): Promise<SaveResult> {
  if (isTauri && !isMobileUA) {
    try {
      const [{ open }, { writeFile }, { join }] = await Promise.all([
        import('@tauri-apps/plugin-dialog'),
        import('@tauri-apps/plugin-fs'),
        import('@tauri-apps/api/path'),
      ]);
      const dir = await open({ directory: true, title: 'Escolha a pasta para salvar as imagens' });
      if (!dir || Array.isArray(dir)) return 'cancelled';
      for (const f of files)
        await writeFile(await join(dir, f.name), new Uint8Array(await f.blob.arrayBuffer()));
      return 'saved';
    } catch (e) {
      console.warn('Pasta nativa falhou:', e);
    }
  }
  if (isTauri) {
    for (const f of files) if ((await saveBlob(f.blob, f.name)) === 'cancelled') return 'cancelled';
    return 'saved';
  }
  for (const f of files) {
    anchorDownload(f.blob, f.name);
    await new Promise((r) => setTimeout(r, 350));
  }
  return 'downloaded';
}

export function canShareFiles(): boolean {
  try {
    const f = new File([new Blob()], 'x.png', { type: 'image/png' });
    return !isTauri && !!navigator.canShare?.({ files: [f] });
  } catch {
    return false;
  }
}

export async function shareBlob(blob: Blob, filename: string, title?: string): Promise<SaveResult> {
  const file = new File([blob], filename, { type: blob.type });
  try {
    await navigator.share({ files: [file], title });
    return 'shared';
  } catch (e) {
    if ((e as DOMException)?.name === 'AbortError') return 'cancelled';
    throw e;
  }
}

export async function copyBlob(blob: Blob): Promise<boolean> {
  try {
    await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
    return true;
  } catch {
    return false;
  }
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}

/**
 * Abre uma “tela de exibição” (cronômetro, teleprompter, roteiro) em outra janela,
 * para arrastar para o segundo monitor ou capturar no OBS.
 * No celular abre na própria tela.
 */
export async function openDisplay(route: string, title: string): Promise<void> {
  const hash = `#/tela/${route}`;
  if (isTauri && !isMobileUA) {
    try {
      const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow');
      const label = `tela-${route}`;
      const existing = await WebviewWindow.getByLabel(label);
      if (existing) {
        await existing.setFocus();
        return;
      }
      new WebviewWindow(label, { url: `index.html${hash}`, title, width: 1280, height: 720 });
      return;
    } catch (e) {
      console.warn(e);
    }
  }
  if (!isTauri && !isMobileUA) {
    const w = window.open(hash, `tela-${route}`, 'popup,width=1280,height=720');
    if (w) return;
  }
  location.hash = hash;
}

export async function toggleFullscreen(el?: HTMLElement) {
  if (isTauri && !isMobileUA) {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      const win = getCurrentWindow();
      await win.setFullscreen(!(await win.isFullscreen()));
      return;
    } catch {
      /* segue para a API do navegador */
    }
  }
  if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
  else await (el ?? document.documentElement).requestFullscreen?.().catch(() => {});
}

/** Mantém a tela acesa (teleprompter/cronômetro). */
export async function keepAwake(): Promise<() => void> {
  try {
    const lock = await navigator.wakeLock?.request('screen');
    return () => void lock?.release().catch(() => {});
  } catch {
    return () => {};
  }
}

export function stamp(d = new Date()): string {
  const p = (x: number) => String(x).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

export function slug(s: string): string {
  return (
    s
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) || 'imagem'
  );
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}
