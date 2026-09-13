import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';

const DEFAULT_SCRYPT_PARAMS = {
  N: 1 << 15,
  r: 8,
  p: 1,
  keyLength: 64,
};

function getScryptMaxMemory(N: number, r: number, p: number) {
  return 256 * N * r + 1024 * p;
}

function toBase64Url(value: Buffer) {
  return value.toString('base64url');
}

function fromBase64Url(value: string) {
  return Buffer.from(value, 'base64url');
}

function deriveKey(password: string, salt: Buffer, keyLength: number, params: { N: number; r: number; p: number; maxmem: number }) {
  return new Promise<Buffer>((resolve, reject) => {
    scryptCallback(password, salt, keyLength, params, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(derivedKey as Buffer);
    });
  });
}

function parseScryptHash(hash: string) {
  const [algorithm, rawN, rawR, rawP, salt, derivedKey] = hash.split('$');
  const N = Number.parseInt(rawN || '', 10);
  const r = Number.parseInt(rawR || '', 10);
  const p = Number.parseInt(rawP || '', 10);

  if (
    algorithm !== 'scrypt' ||
    !Number.isInteger(N) ||
    !Number.isInteger(r) ||
    !Number.isInteger(p) ||
    !salt ||
    !derivedKey
  ) {
    return null;
  }

  return {
    N,
    r,
    p,
    salt,
    derivedKey,
  };
}

export async function createPasswordHash(password: string) {
  const salt = randomBytes(16);
  const derivedKey = await deriveKey(password, salt, DEFAULT_SCRYPT_PARAMS.keyLength, {
    N: DEFAULT_SCRYPT_PARAMS.N,
    r: DEFAULT_SCRYPT_PARAMS.r,
    p: DEFAULT_SCRYPT_PARAMS.p,
    maxmem: getScryptMaxMemory(DEFAULT_SCRYPT_PARAMS.N, DEFAULT_SCRYPT_PARAMS.r, DEFAULT_SCRYPT_PARAMS.p),
  });

  return [
    'scrypt',
    String(DEFAULT_SCRYPT_PARAMS.N),
    String(DEFAULT_SCRYPT_PARAMS.r),
    String(DEFAULT_SCRYPT_PARAMS.p),
    toBase64Url(salt),
    toBase64Url(derivedKey),
  ].join('$');
}

export async function verifyPasswordHash(password: string, hash: string) {
  const parsed = parseScryptHash(hash);

  if (!parsed) {
    return false;
  }

  const salt = fromBase64Url(parsed.salt);
  const expected = fromBase64Url(parsed.derivedKey);
  const actual = await deriveKey(password, salt, expected.length, {
    N: parsed.N,
    r: parsed.r,
    p: parsed.p,
    maxmem: getScryptMaxMemory(parsed.N, parsed.r, parsed.p),
  });

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}