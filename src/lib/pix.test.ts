import { describe, expect, it } from 'vitest';
import { buildPix, crc16, detectKey, pixText } from './pix';

describe('PIX', () => {
  it('CRC16/CCITT-FALSE confere com o valor de referência', () => {
    expect(crc16('123456789')).toBe('29B1');
  });

  it('gera o payload do exemplo do manual do BR Code', () => {
    // Exemplo oficial do Manual do BR Code (BCB), chave aleatória, sem valor.
    const code = buildPix({
      key: '123e4567-e12b-12d1-a456-426655440000',
      name: 'Fulano de Tal',
      city: 'BRASILIA',
    });
    expect(code).toBe(
      '00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***63041D3D',
    );
  });

  it('inclui valor com duas casas e termina com CRC válido', () => {
    const code = buildPix({
      key: 'igreja@exemplo.com',
      name: 'Igreja Ação',
      city: 'Guajará-Mirim',
      amount: 10,
    });
    expect(code).toContain('540510.00');
    expect(code).toContain('5911Igreja Acao');
    const body = code.slice(0, -4);
    expect(code.slice(-4)).toBe(crc16(body));
  });

  it('detecta tipos de chave', () => {
    expect(detectKey('123.456.789-09').kind).toBe('cpf');
    expect(detectKey('12.345.678/0001-90').kind).toBe('cnpj');
    expect(detectKey('(69) 99999-1234')).toEqual({ key: '+5569999991234', kind: 'telefone' });
    expect(detectKey('A@B.COM')).toEqual({ key: 'a@b.com', kind: 'email' });
  });

  it('limpa acentos e corta no limite', () => {
    expect(pixText('São João da Boa Vista', 15)).toBe('Sao Joao da Boa');
  });
});
