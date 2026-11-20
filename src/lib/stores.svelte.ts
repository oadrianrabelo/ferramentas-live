import { persisted } from './persist.svelte';
import type { Brand } from './canvas/frame';

export const brand = persisted<Brand>('brand', {
  title: 'ESCOLA SABATINA',
  place: '',
  footer: 'Participe enviando suas perguntas no chat!',
  handle: '',
  logo: 'iasd',
  customLogo: null,
  theme: 'sabatina',
  accent: null,
});

export const prefs = persisted('prefs', {
  appearance: 'system' as 'system' | 'dark' | 'light',
  lastTool: '',
  seenVersion: '',
});

/** Mensagens rápidas no rodapé da tela. */
class Toasts {
  list = $state<{ id: number; text: string; kind: 'ok' | 'warn' | 'info' }[]>([]);
  #n = 0;
  show(text: string, kind: 'ok' | 'warn' | 'info' = 'info', ms = 3200) {
    const id = ++this.#n;
    this.list.push({ id, text, kind });
    setTimeout(() => (this.list = this.list.filter((t) => t.id !== id)), ms);
  }
}
export const toast = new Toasts();
