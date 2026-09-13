import { randomBytes } from 'node:crypto';

const ORDER_NUMBER_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const DEFAULT_ENTROPY_LENGTH = 8;
const DEFAULT_PREFIX = 'ZH';

function normalizeDateInput(input: Date | number | string | undefined) {
  if (input instanceof Date) {
    return new Date(input.getTime());
  }

  if (typeof input === 'number' || typeof input === 'string') {
    return new Date(input);
  }

  return new Date();
}

function pad(value: number) {
  return String(value).padStart(2, '0');
}

export function formatZollhausOrderDateSegment(input?: Date | number | string) {
  const date = normalizeDateInput(input);

  if (Number.isNaN(date.getTime())) {
    throw new Error('Ungueltiges Bestellnummer-Datum.');
  }

  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}`;
}

export function encodeZollhausOrderEntropy(bytes: Uint8Array, length = DEFAULT_ENTROPY_LENGTH) {
  if (!(bytes instanceof Uint8Array) || bytes.length === 0) {
    throw new Error('Fuer die Bestellnummer wird Entropie benoetigt.');
  }

  if (!Number.isInteger(length) || length <= 0) {
    throw new Error('Die Laenge der Bestellnummer-Entropie ist ungueltig.');
  }

  let result = '';

  for (let index = 0; result.length < length; index += 1) {
    const byte = bytes[index % bytes.length] ?? 0;
    result += ORDER_NUMBER_ALPHABET[byte % ORDER_NUMBER_ALPHABET.length];
  }

  return result;
}

export function formatZollhausOrderNumber(input: {
  date?: Date | number | string;
  entropy: string;
  prefix?: string;
}) {
  const prefix = String(input.prefix || DEFAULT_PREFIX).trim().toUpperCase();
  const entropy = String(input.entropy || '').trim().toUpperCase();

  if (!/^[A-Z0-9]{2,8}$/.test(prefix)) {
    throw new Error('Das Bestellnummer-Praefix ist ungueltig.');
  }

  if (!/^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6,16}$/.test(entropy)) {
    throw new Error('Der Bestellnummer-Entropieblock ist ungueltig.');
  }

  return `${prefix}-${formatZollhausOrderDateSegment(input.date)}-${entropy}`;
}

export function generateZollhausOrderNumber(options?: {
  now?: Date | number | string;
  random?: Uint8Array;
  prefix?: string;
  length?: number;
}) {
  const length = options?.length ?? DEFAULT_ENTROPY_LENGTH;
  const entropy = encodeZollhausOrderEntropy(options?.random ?? randomBytes(length), length);

  return formatZollhausOrderNumber({
    date: options?.now,
    entropy,
    prefix: options?.prefix,
  });
}

export function isZollhausOrderNumber(value: string) {
  return /^[A-Z0-9]{2,8}-\d{8}-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6,16}$/.test(String(value || '').trim().toUpperCase());
}
