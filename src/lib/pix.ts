/**
 * PIX “copia e cola” estático (BR Code / EMV-QRCPS), conforme o Manual do BR Code do Banco Central.
 */

function tlv(id: string, value: string): string {
  return id + String(value.length).padStart(2, '0') + value;
}

/** CRC16/CCITT-FALSE (poly 0x1021, init 0xFFFF). */
export function crc16(payload: string): string {
  let crc = 0xffff;
  const bytes = new TextEncoder().encode(payload);
  for (const b of bytes) {
    crc ^= b << 8;
    for (let i = 0; i < 8; i++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/** Remove acentos e caracteres fora do padrão aceito pelos bancos. */
export function pixText(s: string, max: number): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9 .,\-/@*]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

export type PixKeyKind = 'cpf' | 'cnpj' | 'telefone' | 'email' | 'aleatoria' | 'desconhecida';

export function detectKey(raw: string): { key: string; kind: PixKeyKind } {
  const k = raw.trim();
  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(k)) return { key: k.toLowerCase(), kind: 'email' };
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(k))
    return { key: k.toLowerCase(), kind: 'aleatoria' };
  const digits = k.replace(/\D/g, '');
  if (/^\+/.test(k) || /^\(?\d{2}\)?\s?9?\d{4}-?\d{4}$/.test(k)) {
    const d = digits.startsWith('55') && digits.length >= 12 ? digits : '55' + digits;
    return { key: '+' + d, kind: 'telefone' };
  }
  if (digits.length === 11 && /^[\d.\-\s]+$/.test(k)) return { key: digits, kind: 'cpf' };
  if (digits.length === 14 && /^[\d./\-\s]+$/.test(k)) return { key: digits, kind: 'cnpj' };
  return { key: k, kind: 'desconhecida' };
}

export interface PixInput {
  key: string;
  name: string;
  city: string;
  amount?: number | null;
  txid?: string;
  message?: string;
}

export function buildPix(p: PixInput): string {
  const { key } = detectKey(p.key);
  const msg = pixText(p.message ?? '', 40);
  const gui = tlv('00', 'br.gov.bcb.pix') + tlv('01', key) + (msg ? tlv('02', msg) : '');
  const txid = (p.txid ?? '').replace(/[^A-Za-z0-9]/g, '').slice(0, 25) || '***';
  let payload =
    tlv('00', '01') +
    tlv('26', gui) +
    tlv('52', '0000') +
    tlv('53', '986') +
    (p.amount && p.amount > 0 ? tlv('54', p.amount.toFixed(2)) : '') +
    tlv('58', 'BR') +
    tlv('59', pixText(p.name, 25) || 'RECEBEDOR') +
    tlv('60', pixText(p.city, 15) || 'BRASIL') +
    tlv('62', tlv('05', txid));
  payload += '6304';
  return payload + crc16(payload);
}
