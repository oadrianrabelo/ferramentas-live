/**
 * Estado reativo salvo no armazenamento local.
 * Com `sync: true`, outras janelas do app (telas de exibição) recebem as mudanças na hora.
 */
export function persisted<T extends object>(key: string, initial: T, opts: { sync?: boolean } = {}): T {
  const fullKey = `fl:${key}`;
  let data: T = structuredClone(initial);
  try {
    const raw = localStorage.getItem(fullKey);
    if (raw) data = { ...data, ...JSON.parse(raw) };
  } catch {
    /* armazenamento indisponível: segue só em memória */
  }
  const state = $state(data);
  let last = JSON.stringify(state);
  let timer: ReturnType<typeof setTimeout> | undefined;
  const delay = opts.sync ? 30 : 300;

  $effect.root(() => {
    $effect(() => {
      const snap = JSON.stringify(state);
      if (snap === last) return;
      clearTimeout(timer);
      timer = setTimeout(() => {
        last = snap;
        try {
          localStorage.setItem(fullKey, snap);
        } catch (e) {
          console.warn('Não consegui salvar', key, e);
        }
      }, delay);
    });
  });

  if (opts.sync && typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key !== fullKey || !e.newValue || e.newValue === last) return;
      try {
        last = e.newValue;
        Object.assign(state, JSON.parse(e.newValue));
      } catch {
        /* ignora */
      }
    });
  }
  return state;
}
