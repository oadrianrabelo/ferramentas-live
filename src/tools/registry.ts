import type { Component } from 'svelte';

export interface ToolDef {
  id: string;
  name: string;
  desc: string;
  icon: string;
  group: 'Imagens' | 'Ao vivo' | 'Publicar' | 'App';
  load: () => Promise<{ default: Component }>;
}

export const TOOLS: ToolDef[] = [
  {
    id: 'comentarios',
    name: 'Comentários',
    desc: 'Cartões com os comentários do chat, em fila, para TV, stories ou overlay.',
    icon: 'message',
    group: 'Imagens',
    load: () => import('./Comentarios.svelte'),
  },
  {
    id: 'tarja',
    name: 'Tarja de nome',
    desc: 'Lower third transparente com nome e função de quem fala.',
    icon: 'tag',
    group: 'Imagens',
    load: () => import('./Tarja.svelte'),
  },
  {
    id: 'versiculo',
    name: 'Versículo',
    desc: 'Texto bíblico ou citação em destaque, com referência.',
    icon: 'book',
    group: 'Imagens',
    load: () => import('./Versiculo.svelte'),
  },
  {
    id: 'aviso',
    name: 'Aviso',
    desc: 'Comunicados com data, horário, local e QR code opcional.',
    icon: 'megaphone',
    group: 'Imagens',
    load: () => import('./Aviso.svelte'),
  },
  {
    id: 'enquete',
    name: 'Enquete',
    desc: 'Conte votos do chat ao vivo e mostre o resultado em barras.',
    icon: 'chart',
    group: 'Imagens',
    load: () => import('./Enquete.svelte'),
  },
  {
    id: 'miniatura',
    name: 'Miniatura',
    desc: 'Thumbnail 1280×720 para o YouTube com título grande e foto.',
    icon: 'image',
    group: 'Imagens',
    load: () => import('./Miniatura.svelte'),
  },
  {
    id: 'pix',
    name: 'PIX e QR Code',
    desc: 'Gera o PIX copia-e-cola e a tela de oferta com QR code.',
    icon: 'pix',
    group: 'Imagens',
    load: () => import('./Pix.svelte'),
  },
  {
    id: 'cronometro',
    name: 'Cronômetro',
    desc: 'Contagem para o início, tempo de fala com alertas e relógio — em tela cheia.',
    icon: 'timer',
    group: 'Ao vivo',
    load: () => import('./Cronometro.svelte'),
  },
  {
    id: 'teleprompter',
    name: 'Teleprompter',
    desc: 'Texto rolando na velocidade certa, com espelho e controle pelo teclado.',
    icon: 'scroll',
    group: 'Ao vivo',
    load: () => import('./Teleprompter.svelte'),
  },
  {
    id: 'roteiro',
    name: 'Roteiro',
    desc: 'Momentos da live com tempos, quem conduz e quanto falta. Gera capítulos.',
    icon: 'list',
    group: 'Ao vivo',
    load: () => import('./Roteiro.svelte'),
  },
  {
    id: 'sorteio',
    name: 'Sorteio',
    desc: 'Cole os nomes do chat e sorteie com animação na tela.',
    icon: 'dice',
    group: 'Ao vivo',
    load: () => import('./Sorteio.svelte'),
  },
  {
    id: 'checklist',
    name: 'Checklist',
    desc: 'Tudo o que precisa estar pronto antes de apertar “transmitir”.',
    icon: 'check',
    group: 'Ao vivo',
    load: () => import('./Checklist.svelte'),
  },
  {
    id: 'publicacao',
    name: 'Kit de publicação',
    desc: 'Título, descrição, capítulos e hashtags prontos para copiar.',
    icon: 'send',
    group: 'Publicar',
    load: () => import('./Publicacao.svelte'),
  },
  {
    id: 'identidade',
    name: 'Identidade',
    desc: 'Nome do programa, local, logo, rodapé e tema usados em todas as imagens.',
    icon: 'palette',
    group: 'App',
    load: () => import('./Identidade.svelte'),
  },
  {
    id: 'sobre',
    name: 'Sobre e versões',
    desc: 'Versão instalada, novidades e atualizações.',
    icon: 'info',
    group: 'App',
    load: () => import('./Sobre.svelte'),
  },
];

export const DISPLAYS: Record<string, { name: string; load: () => Promise<{ default: Component }> }> = {
  cronometro: { name: 'Cronômetro', load: () => import('./displays/TimerScreen.svelte') },
  teleprompter: { name: 'Teleprompter', load: () => import('./displays/PrompterScreen.svelte') },
  roteiro: { name: 'Roteiro', load: () => import('./displays/RundownScreen.svelte') },
  sorteio: { name: 'Sorteio', load: () => import('./displays/RaffleScreen.svelte') },
};

export const GROUPS = ['Imagens', 'Ao vivo', 'Publicar', 'App'] as const;
