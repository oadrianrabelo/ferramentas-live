import { persisted } from './persist.svelte';

export const prompter = persisted(
  'teleprompter',
  {
    text: '# Abertura\nBoa noite! Sejam muito bem-vindos à nossa transmissão.\nDeixe nos comentários de onde você está assistindo.\n\n# Mensagem\nCole aqui o seu roteiro. Linhas que começam com # viram títulos destacados.',
    fontSize: 8,
    speed: 5,
    lineHeight: 1.45,
    margin: 10,
    mirror: false,
    flipV: false,
    align: 'left' as 'left' | 'center',
    guide: true,
    countdown: true,
    theme: 'escuro' as 'escuro' | 'claro',
  },
  { sync: true },
);
