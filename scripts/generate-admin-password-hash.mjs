import { randomBytes, scrypt as scryptCallback } from 'node:crypto';
import process from 'node:process';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const params = { N: 1 << 15, r: 8, p: 1, keyLength: 64 };

function getScryptMaxMemory(N, r, p) {
  return 256 * N * r + 1024 * p;
}

function promptHidden(label) {
  return new Promise((resolve, reject) => {
    const stdin = process.stdin;
    const stdout = process.stdout;

    if (!stdin.isTTY || !stdout.isTTY) {
      reject(new Error('Bitte das Skript interaktiv in einem Terminal ausfuehren.'));
      return;
    }

    let value = '';
    stdout.write(label);
    stdin.resume();
    stdin.setRawMode(true);
    stdin.setEncoding('utf8');

    function cleanup() {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.removeListener('data', onData);
      stdout.write('\n');
    }

    function onData(chunk) {
      const char = String(chunk);

      if (char === '\u0003') {
        cleanup();
        reject(new Error('Abgebrochen.'));
        return;
      }

      if (char === '\r' || char === '\n') {
        cleanup();
        resolve(value);
        return;
      }

      if (char === '\u007f') {
        value = value.slice(0, -1);
        return;
      }

      value += char;
    }

    stdin.on('data', onData);
  });
}

async function main() {
  const password = await promptHidden('Passwort: ');
  const confirmation = await promptHidden('Passwort wiederholen: ');

  if (!password) {
    throw new Error('Es wurde kein Passwort eingegeben.');
  }

  if (password !== confirmation) {
    throw new Error('Die Passwoerter stimmen nicht ueberein.');
  }

  const salt = randomBytes(16);
  const derivedKey = await scrypt(password, salt, params.keyLength, {
    N: params.N,
    r: params.r,
    p: params.p,
    maxmem: getScryptMaxMemory(params.N, params.r, params.p),
  });

  process.stdout.write(
    ['scrypt', String(params.N), String(params.r), String(params.p), salt.toString('base64url'), Buffer.from(derivedKey).toString('base64url')].join('$') + '\n'
  );
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : 'Unbekannter Fehler'}\n`);
  process.exitCode = 1;
});