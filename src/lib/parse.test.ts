import { describe, expect, it } from 'vitest';
import {
  chunk,
  fillTemplate,
  fmtChapter,
  fmtDuration,
  handle,
  hhmmToMinutes,
  minutesToHhmm,
  parseComments,
  randomInt,
  tidyText,
  uniqueNames,
} from './parse';

describe('parseComments', () => {
  it('lê “nome: comentário”', () => {
    expect(parseComments('@maria: Amém!\nJoão Silva: Boa noite a todos')).toEqual([
      { user: 'maria', text: 'Amém!' },
      { user: 'João Silva', text: 'Boa noite a todos' },
    ]);
  });

  it('ignora horário no início e aceita traço', () => {
    expect(parseComments('19:32 ana - assistindo de Porto Velho\n7:45 PM Pedro: oi')).toEqual([
      { user: 'ana', text: 'assistindo de Porto Velho' },
      { user: 'Pedro', text: 'oi' },
    ]);
  });

  it('junta linha de continuação ao comentário anterior', () => {
    expect(parseComments('ana: primeira parte\ncontinua aqui\nbia: outro')).toEqual([
      { user: 'ana', text: 'primeira parte continua aqui' },
      { user: 'bia', text: 'outro' },
    ]);
  });

  it('entende linhas alternadas nome/comentário', () => {
    expect(parseComments('Maria\nQue bênção!\nJosé\nGlória a Deus')).toEqual([
      { user: 'Maria', text: 'Que bênção!' },
      { user: 'José', text: 'Glória a Deus' },
    ]);
  });

  it('sem nomes vira só texto', () => {
    expect(parseComments('Linda mensagem hoje.\nAmém.\nObrigado!')).toHaveLength(3);
    expect(parseComments('   \n  ')).toEqual([]);
  });
});

describe('texto', () => {
  it('tidyText capitaliza e limpa espaços', () => {
    expect(tidyText('  olá   mundo ')).toBe('Olá mundo');
    expect(tidyText('olá', false)).toBe('olá');
  });
  it('handle', () => {
    expect(handle('maria')).toBe('@maria');
    expect(handle('@maria')).toBe('@maria');
    expect(handle('Maria Souza')).toBe('Maria Souza');
    expect(handle('  ')).toBe('');
  });
  it('chunk', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });
  it('fillTemplate remove variáveis vazias e separadores soltos', () => {
    expect(fillTemplate('{a} | {b}', { a: 'Lição 8', b: '' })).toBe('Lição 8');
    expect(fillTemplate('Olá {nome}!\n\n\n\nFim', { nome: 'Ana' })).toBe('Olá Ana!\n\nFim');
  });
});

describe('nomes do sorteio', () => {
  it('remove duplicados ignorando acentos, @ e o comentário', () => {
    expect(uniqueNames('José: amém\n@jose\nAna, Bia;ana\n')).toEqual(['José', 'Ana', 'Bia']);
  });
  it('mantém duplicados quando pedido', () => {
    expect(uniqueNames('a\na', false)).toEqual(['a', 'a']);
  });
  it('randomInt fica no intervalo', () => {
    for (let i = 0; i < 500; i++) {
      const r = randomInt(7);
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThan(7);
    }
  });
});

describe('tempo', () => {
  it('fmtDuration', () => {
    expect(fmtDuration(65)).toBe('01:05');
    expect(fmtDuration(3725)).toBe('1:02:05');
    expect(fmtDuration(-5)).toBe('-00:05');
    expect(fmtDuration(5, true)).toBe('0:00:05');
  });
  it('fmtChapter', () => {
    expect(fmtChapter(0)).toBe('0:00');
    expect(fmtChapter(245)).toBe('4:05');
    expect(fmtChapter(3723)).toBe('1:02:03');
  });
  it('hh:mm', () => {
    expect(hhmmToMinutes('19:30')).toBe(1170);
    expect(hhmmToMinutes('x')).toBeNull();
    expect(minutesToHhmm(1170 + 75)).toBe('20:45');
    expect(minutesToHhmm(1440 + 5)).toBe('00:05');
  });
});
