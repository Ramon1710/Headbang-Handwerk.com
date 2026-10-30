import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer, type Socket } from 'node:net';
import { readFileSync } from 'node:fs';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/contact/route';
import { contactFieldLimits, contactInterestOptions, validateContactSubmission } from '@/lib/contact';

const submission = {
  name: 'Max Mustermann',
  company: 'Mustermann GmbH',
  email: 'visitor@example.com',
  subject: 'Kontakt Test',
  interests: ['Sponsoring Bronze', 'Sponsoring Gold'],
  message: 'Testnachricht.\nZweite Zeile.',
};

function request(body: unknown) {
  return new NextRequest('http://localhost/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

test('Kontaktvalidierung normalisiert alle Felder und erlaubt optionale Angaben', () => {
  assert.deepEqual(validateContactSubmission({ ...submission, name: ' Max Mustermann ' }), submission);
  assert.deepEqual(validateContactSubmission({ ...submission, company: undefined, interests: undefined }), {
    ...submission, company: '', interests: [],
  });
  assert.deepEqual(validateContactSubmission({ ...submission, interests: contactInterestOptions })?.interests, contactInterestOptions);
  assert.deepEqual(validateContactSubmission({ ...submission, interests: ['Sponsoring Gold', 'Sponsoring Gold'] })?.interests, ['Sponsoring Gold']);
  assert.ok(validateContactSubmission({ ...submission, message: 'x'.repeat(contactFieldLimits.message) }));
});

test('Kontaktvalidierung lehnt falsche Typen, leere Werte, Überlängen und Header-Injection ab', () => {
  for (const body of [null, [], 'text', 123, {}]) assert.equal(validateContactSubmission(body), null);
  for (const field of Object.keys(contactFieldLimits)) {
    assert.equal(validateContactSubmission({ ...submission, [field]: {} }), null, field);
    assert.equal(validateContactSubmission({ ...submission, [field]: ['text'] }), null, field);
    const limit = contactFieldLimits[field as keyof typeof contactFieldLimits];
    assert.equal(validateContactSubmission({ ...submission, [field]: 'x'.repeat(limit + 1) }), null, field);
  }
  for (const field of ['name', 'email', 'subject', 'message']) {
    assert.equal(validateContactSubmission({ ...submission, [field]: ' \t ' }), null, field);
  }
  for (const field of ['name', 'company', 'email', 'subject']) {
    assert.equal(validateContactSubmission({ ...submission, [field]: 'a\r\nBcc: other@example.com' }), null, field);
  }
  for (const email of ['invalid', 'a@b', 'a@b.com,other@example.com', 'Visitor <a@b.com>']) {
    assert.equal(validateContactSubmission({ ...submission, email }), null, email);
  }
  for (const interests of ['Sponsoring Gold', {}, [null], ['unknown'], Array(7).fill('Sponsoring Gold')]) {
    assert.equal(validateContactSubmission({ ...submission, interests }), null);
  }
  assert.equal(validateContactSubmission({ ...submission, message: 'text\u0000text' }), null);
});

test('Kontakt-Endpunkt verwendet SMTP und bestätigt nur die tatsächliche Annahme', { timeout: 15000 }, async (t) => {
  const keys = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM'] as const;
  const savedEnv = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  const logs: unknown[][] = [];
  t.mock.method(console, 'error', (...args: unknown[]) => { logs.push(args); });
  const sockets = new Set<Socket>();
  const messages: Array<{ commands: string[]; content: string }> = [];
  let mode: 'accept' | 'reject-auth' | 'reject-recipient' | 'reject-data' | 'hold' = 'accept';
  let dataReceived: (() => void) | undefined;
  let releaseAcceptance: (() => void) | undefined;

  const server = createServer((socket) => {
    sockets.add(socket);
    socket.on('close', () => sockets.delete(socket));
    socket.setEncoding('utf8');
    socket.write('220 localhost test SMTP\r\n');
    let buffer = '';
    let inData = false;
    let content = '';
    const commands: string[] = [];
    socket.on('data', (chunk) => {
      buffer += chunk;
      let end: number;
      while ((end = buffer.indexOf('\r\n')) !== -1) {
        const line = buffer.slice(0, end);
        buffer = buffer.slice(end + 2);
        if (inData) {
          if (line !== '.') {
            content += `${line}\r\n`;
            continue;
          }
          inData = false;
          messages.push({ commands, content });
          if (mode === 'hold') {
            releaseAcceptance = () => { socket.write('250 queued\r\n'); };
            dataReceived?.();
          } else {
            socket.write(mode === 'reject-data' ? '554 message rejected\r\n' : '250 queued\r\n');
          }
        } else if (line.startsWith('EHLO')) {
          socket.write('250-localhost\r\n250 AUTH PLAIN\r\n');
        } else if (line.startsWith('AUTH PLAIN')) {
          socket.write(mode === 'reject-auth' ? '535 authentication failed\r\n' : '235 authenticated\r\n');
        } else if (line.startsWith('MAIL FROM:')) {
          commands.push(line);
          socket.write('250 sender accepted\r\n');
        } else if (line.startsWith('RCPT TO:')) {
          commands.push(line);
          socket.write(mode === 'reject-recipient' ? '550 recipient rejected\r\n' : '250 recipient accepted\r\n');
        } else if (line === 'DATA') {
          inData = true;
          socket.write('354 send message\r\n');
        } else if (line === 'QUIT') {
          socket.end('221 bye\r\n');
        } else {
          socket.write('250 OK\r\n');
        }
      }
    });
  });

  t.after(async () => {
    for (const key of keys) {
      if (savedEnv[key] === undefined) delete process.env[key];
      else process.env[key] = savedEnv[key];
    }
    for (const socket of sockets) socket.destroy();
    if (server.listening) await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  });
  for (const key of keys) delete process.env[key];

  await t.test('ungültiges JSON und ungültige Formulardaten ergeben 400', async () => {
    const malformed = new NextRequest('http://localhost/api/contact', { method: 'POST', body: '{' });
    assert.equal((await POST(malformed)).status, 400);
    assert.equal((await POST(request({ ...submission, email: {} }))).status, 400);
  });

  await t.test('fehlende Konfiguration ergibt 503 ohne Erfolg oder sensible Logs', async () => {
    const response = await POST(request(submission));
    assert.equal(response.status, 503);
    const body = await response.json();
    assert.equal(body.success, undefined);
    assert.match(body.error, /nicht eingerichtet/);
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  Object.assign(process.env, {
    SMTP_HOST: '127.0.0.1',
    SMTP_PORT: String(address.port),
    SMTP_USER: 'mailer@example.com',
    SMTP_PASS: 'local-test-password',
    SMTP_FROM: 'Headbang Handwerk <mailer@example.com>',
  });

  await t.test('fehlende Zugangsdaten, ungültiger Port und ungültiger Absender ergeben 503', async () => {
    for (const [key, value] of [
      ['SMTP_HOST', ''], ['SMTP_USER', ''], ['SMTP_PASS', ''],
      ['SMTP_PORT', 'invalid'], ['SMTP_PORT', '0'], ['SMTP_PORT', '65536'],
      ['SMTP_FROM', 'bad sender'], ['SMTP_FROM', 'a@example.com\r\nBcc: b@example.com'],
    ]) {
      const previous = process.env[key];
      process.env[key] = value;
      assert.equal((await POST(request(submission))).status, 503, key);
      process.env[key] = previous;
    }
  });

  await t.test('SMTP bestätigt erst nach DATA; Empfänger, Absender, Reply-To und alle Inhalte stimmen', async () => {
    mode = 'hold';
    const received = new Promise<void>((resolve) => { dataReceived = resolve; });
    let completed = false;
    const pending = POST(request({
      ...submission,
      to: 'attacker@example.com',
      from: 'attacker@example.com',
      cc: 'attacker@example.com',
      bcc: 'attacker@example.com',
      replyTo: 'attacker@example.com',
    })).then((response) => { completed = true; return response; });
    await received;
    assert.equal(completed, false);
    assert.ok(releaseAcceptance);
    releaseAcceptance();
    const response = await pending;
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { success: true, status: 'accepted' });
    const mail = messages.at(-1);
    assert.ok(mail);
    assert.deepEqual(mail.commands, [
      'MAIL FROM:<mailer@example.com>',
      'RCPT TO:<info@headbang-handwerk.de>',
    ]);
    assert.match(mail.content, /From: Headbang Handwerk <mailer@example\.com>/);
    assert.match(mail.content, /Reply-To: visitor@example\.com/);
    assert.match(mail.content, /Subject: Kontaktanfrage: Kontakt Test/);
    for (const text of [
      'Name: Max Mustermann', 'Unternehmen: Mustermann GmbH', 'E-Mail: visitor@example.com',
      'Betreff: Kontakt Test', 'Interessen: Sponsoring Bronze, Sponsoring Gold',
      'Testnachricht.\r\nZweite Zeile.',
    ]) assert.ok(mail.content.includes(text), text);
    assert.doesNotMatch(mail.content, /attacker@example/);
  });

  await t.test('SMTP_USER dient ohne SMTP_FROM als Absender', async () => {
    mode = 'accept';
    delete process.env.SMTP_FROM;
    assert.equal((await POST(request(submission))).status, 200);
    assert.match(messages.at(-1)?.content || '', /From: mailer@example\.com/);
    process.env.SMTP_FROM = 'Headbang Handwerk <mailer@example.com>';
  });

  await t.test('ein reiner SMTP-Anmeldename erfordert SMTP_FROM', async () => {
    delete process.env.SMTP_FROM;
    process.env.SMTP_USER = 'smtp-login';
    assert.equal((await POST(request(submission))).status, 503);
    process.env.SMTP_FROM = 'Headbang Handwerk <mailer@example.com>';
    process.env.SMTP_USER = 'mailer@example.com';
  });

  for (const rejection of ['reject-auth', 'reject-recipient', 'reject-data'] as const) {
    await t.test(`SMTP-Fehler ${rejection} ergibt 502 statt Erfolg`, async () => {
      mode = rejection;
      const response = await POST(request(submission));
      assert.equal(response.status, 502);
      const body = await response.json();
      assert.equal(body.success, undefined);
      assert.match(body.error, /nicht bestätigt/);
    });
  }

  assert.ok(logs.length > 0);
  for (const log of logs) {
    assert.equal(log[0], 'Contact email failed');
    assert.equal(log.length, 2);
    const metadata = log[1] as { category: string; code: string };
    assert.deepEqual(Object.keys(metadata).sort(), ['category', 'code']);
    assert.ok(['configuration', 'delivery'].includes(metadata.category));
    assert.ok(['SMTP_CONFIG', 'EAUTH', 'EENVELOPE', 'EMESSAGE'].includes(metadata.code));
  }
  assert.ok(logs.some((log) => (log[1] as { code: string }).code === 'EAUTH'));
  assert.doesNotMatch(JSON.stringify(logs), /password|visitor@example|Testnachricht|Mustermann|authenticated/);
});

test('Formular behält Fehlerwerte und schützt die laufende Übermittlung', () => {
  const source = readFileSync(new URL('../components/contact-form.tsx', import.meta.url), 'utf8');
  assert.match(source, /if \(submitting\.current\) return/);
  assert.match(source, /submitting\.current = true/);
  assert.match(source, /submitting\.current = false/);
  assert.match(source, /disabled=\{loading\}/);
  assert.match(source, /result\.success !== true/);
  assert.match(source, /result\.status !== 'accepted'/);
  assert.match(source, /noch nicht die Zustellung/);
  const submitHandler = source.slice(source.indexOf('const handleSubmit'), source.indexOf('if (success)'));
  assert.doesNotMatch(submitHandler, /setForm\(/);
});
