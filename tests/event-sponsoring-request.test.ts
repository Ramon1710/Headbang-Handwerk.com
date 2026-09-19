import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeEvent } from '@/lib/event-stand';
import { validateEventSponsoringLogoUpload } from '@/lib/event-sponsoring/logo-upload';
import {
  createEventSponsoringRequestMessageId,
  sendEventSponsoringRequestNotification,
  submitEventSponsoringRequest,
  type EventSponsoringMailPayload,
  type EventSponsoringRequestDependencies,
  type EventSponsoringRequestSubmission,
} from '@/lib/event-sponsoring/request';
import { createInMemoryEventSponsoringStore, type EventSponsoringStore } from '@/lib/event-sponsoring/store';
import { normalizeEventSponsoringConfig, normalizeEventSponsoringPackage } from '@/lib/event-sponsoring/validation';
import type { Event } from '@/lib/types';

const NOW = new Date('2026-09-18T12:00:00.000Z');

function buildEvent(overrides: Partial<Event> = {}) {
  return normalizeEvent({
    id: 'wacken-2027',
    title: 'Wacken 2027',
    date: '31.07.2027 - 02.08.2027',
    startDate: '2027-07-31',
    endDate: '2027-08-02',
    location: 'Wacken',
    festivalName: 'Wacken Open Air',
    description: 'Eventbeschreibung',
    status: 'confirmed',
    detailViewMode: 'sponsoring2d',
    standEnabled: false,
    ctaText: 'Mehr erfahren',
    ctaUrl: '/kontakt',
    stand: { assetUrl: '', assetName: '', assetContentType: '', lead: '', bannerSlots: [] },
    ...overrides,
  });
}

function buildConfig(overrides: Record<string, unknown> = {}) {
  return normalizeEventSponsoringConfig({
    eventId: 'wacken-2027',
    enabled: true,
    publicTitle: 'Sponsoring beim Wacken 2027',
    publicDescription: 'Beschreibung',
    currencyCode: 'EUR',
    anonymousSupportEnabled: true,
    anonymousMinimumAmountCents: 2500,
    customSponsoringEnabled: true,
    showOccupiedLogosPublicly: false,
    ...overrides,
  }, { now: NOW.toISOString() });
}

function buildPackage(kind: 'small_logo' | 'custom_request' | 'anonymous_support', overrides: Record<string, unknown> = {}) {
  const base = {
    small_logo: {
      id: 'pkg-small',
      name: 'Kleines Logo',
      logoSlotSize: 'small',
      sortOrder: 10,
      priceCents: 25000,
      grantsBannerPlacement: true,
      isPaidOnline: false,
      features: ['Kleines Logo auf Veranstaltungsbanner', 'Logo wird intern platziert'],
    },
    custom_request: {
      id: 'pkg-custom',
      name: 'Custom',
      logoSlotSize: 'none',
      sortOrder: 40,
      priceCents: 0,
      grantsBannerPlacement: false,
      isPaidOnline: false,
      features: ['Individuelle Unterstuetzung nach Abstimmung'],
    },
    anonymous_support: {
      id: 'pkg-anon',
      name: 'Anon',
      logoSlotSize: 'none',
      sortOrder: 50,
      priceCents: 0,
      grantsBannerPlacement: false,
      isPaidOnline: false,
      features: ['Finanzielle Unterstuetzung ohne oeffentliche Nennung'],
    },
  }[kind];

  return normalizeEventSponsoringPackage({
    id: base.id,
    eventId: 'wacken-2027',
    name: base.name,
    kind,
    description: `${base.name} Beschreibung`,
    features: base.features,
    priceCents: base.priceCents,
    currencyCode: 'EUR',
    active: true,
    sortOrder: base.sortOrder,
    grantsBannerPlacement: base.grantsBannerPlacement,
    logoSlotSize: base.logoSlotSize,
    isPaidOnline: base.isPaidOnline,
    ...overrides,
  }, { now: NOW.toISOString() });
}

function buildSubmission(overrides: Partial<EventSponsoringRequestSubmission> = {}): EventSponsoringRequestSubmission {
  return {
    eventId: 'wacken-2027',
    packageId: 'pkg-custom',
    idempotencyKey: 'evtspreq_test_request_123456',
    companyName: 'Mustermann GmbH',
    companyWebsite: 'https://mustermann.example',
    contactFirstName: 'Erika',
    contactLastName: 'Muster',
    email: 'erika@example.com',
    phone: '+49 151 1234567',
    billingStreet: 'Musterstrasse',
    billingHouseNumber: '12a',
    billingPostalCode: '20457',
    billingCity: 'Hamburg',
    billingCountryCode: 'DE',
    message: 'Wir koennen Material und Personal bereitstellen.',
    supportTypes: ['material', 'personnel'],
    publicDisplayEnabled: true,
    acceptDataProcessing: true,
    acceptInvoicePayment: true,
    acceptManualLogoPlacement: true,
    logoFile: null,
    ...overrides,
  };
}

function createDependencies(
  store = createInMemoryEventSponsoringStore({ configs: [buildConfig()], packages: [buildPackage('custom_request')] }),
  overrides: Partial<EventSponsoringRequestDependencies> = {},
): EventSponsoringRequestDependencies {
  return {
    store,
    getEventById: async () => buildEvent(),
    now: () => NOW,
    ...overrides,
  };
}

function createFailingSaveStore(baseStore: EventSponsoringStore): EventSponsoringStore {
  return {
    runTransaction(callback) {
      return baseStore.runTransaction((transaction) => callback({
        ...transaction,
        async saveRequest() {
          throw new Error('save failed');
        },
      }));
    },
  };
}

test('Logo-Upload akzeptiert PNG und PDF, lehnt SVG ab', async () => {
  const png = new File([Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], 'logo.png', { type: 'image/png' });
  const pdf = new File([Uint8Array.from([0x25, 0x50, 0x44, 0x46, 0x2d])], 'briefing.pdf', { type: 'application/pdf' });
  const svg = new File(['<svg></svg>'], 'logo.svg', { type: 'image/svg+xml' });

  assert.equal((await validateEventSponsoringLogoUpload(png)).contentType, 'image/png');
  assert.equal((await validateEventSponsoringLogoUpload(pdf)).contentType, 'application/pdf');
  await assert.rejects(() => validateEventSponsoringLogoUpload(svg), /SVG-Dateien/);
});

test('Logopakete verlangen im Anfragefluss eine Logo-Datei', async () => {
  const store = createInMemoryEventSponsoringStore({
    configs: [buildConfig()],
    packages: [buildPackage('small_logo')],
  });

  await assert.rejects(
    () => submitEventSponsoringRequest(buildSubmission({ packageId: 'pkg-small' }), createDependencies(store)),
    /Logo-Datei/,
  );
});

test('fehlende Pflicht-Einwilligungen werden serverseitig abgewiesen', async () => {
  const store = createInMemoryEventSponsoringStore({
    configs: [buildConfig()],
    packages: [buildPackage('custom_request')],
  });

  await assert.rejects(
    () => submitEventSponsoringRequest(buildSubmission({ acceptDataProcessing: false }), createDependencies(store)),
    /Einwilligung|Datenverarbeitung/,
  );
  await assert.rejects(
    () => submitEventSponsoringRequest(buildSubmission({ acceptInvoicePayment: false }), createDependencies(store)),
    /Rechnungszahlung/,
  );
  await assert.rejects(
    () => submitEventSponsoringRequest(buildSubmission({ acceptManualLogoPlacement: false }), createDependencies(store)),
    /Logoplatzierung/,
  );
});

test('Dateien ueber 5 MB werden serverseitig abgewiesen', async () => {
  const store = createInMemoryEventSponsoringStore({
    configs: [buildConfig()],
    packages: [buildPackage('small_logo')],
  });

  const oversized = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'logo.png', { type: 'image/png' });

  await assert.rejects(
    () => submitEventSponsoringRequest(buildSubmission({ packageId: 'pkg-small', logoFile: oversized }), createDependencies(store)),
    /5 MB/,
  );
});

test('Individuelle Sponsoringanfragen werden idempotent gespeichert und nicht doppelt verarbeitet', async () => {
  process.env.EVENT_SPONSORING_RECIPIENT_EMAIL = 'team@example.com';
  const sentPayloads: EventSponsoringMailPayload[] = [];
  const store = createInMemoryEventSponsoringStore({
    configs: [buildConfig()],
    packages: [buildPackage('custom_request')],
  });

  const deps = createDependencies(store, {
    sendMail: async (payload) => {
      sentPayloads.push(payload);
      return { messageId: 'msg-1' };
    },
  });

  const submission = buildSubmission();
  const first = await submitEventSponsoringRequest(submission, deps);
  const second = await submitEventSponsoringRequest(submission, deps);
  const requests = await store.runTransaction((transaction) => transaction.listRequestsByEvent('wacken-2027'));

  assert.equal(first.request.id, second.request.id);
  assert.equal(second.duplicated, true);
  assert.equal(requests.length, 1);
  assert.equal(sentPayloads.length, 1);
});

test('Anfragen bleiben gespeichert, auch wenn die interne E-Mail nicht konfiguriert ist', async () => {
  delete process.env.EVENT_SPONSORING_RECIPIENT_EMAIL;
  const store = createInMemoryEventSponsoringStore({
    configs: [buildConfig()],
    packages: [buildPackage('anonymous_support')],
  });

  const result = await submitEventSponsoringRequest(buildSubmission({
    packageId: 'pkg-anon',
    companyName: 'Foobar GmbH',
    contactFirstName: 'Max',
    contactLastName: 'Beispiel',
    email: 'max@example.com',
    phone: '+49 40 5555',
    billingStreet: 'Hafenweg',
    billingHouseNumber: '8',
    billingPostalCode: '20095',
    billingCity: 'Hamburg',
    message: 'Wir moechten anonym unterstuetzen.',
    supportTypes: [],
    publicDisplayEnabled: false,
  }), createDependencies(store));

  const saved = await store.runTransaction((transaction) => transaction.getRequest(result.request.id));

  assert.equal(saved?.packagePriceCents, 2500);
  assert.equal(saved?.anonymousSupport, true);
  assert.equal(saved?.packageFeaturesSnapshot[0], 'Finanzielle Unterstuetzung ohne oeffentliche Nennung');
  assert.equal(saved?.emailDelivery.state, 'failed');
  assert.equal(saved?.emailDelivery.lastErrorCategory, 'not_configured');
  assert.equal(saved?.emailDelivery.lastErrorMessage, 'Empfaengeradresse oder SMTP-Konfiguration fehlt.');
});

test('fehlgeschlagene Speicherung nach Upload loescht die bereits hochgeladene Logo-Datei wieder', async () => {
  process.env.EVENT_SPONSORING_RECIPIENT_EMAIL = 'team@example.com';
  const baseStore = createInMemoryEventSponsoringStore({
    configs: [buildConfig()],
    packages: [buildPackage('small_logo')],
  });
  const failingStore = createFailingSaveStore(baseStore);
  const deleted: string[] = [];

  await assert.rejects(
    () => submitEventSponsoringRequest(
      buildSubmission({
        packageId: 'pkg-small',
        logoFile: new File([Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], 'logo.png', { type: 'image/png' }),
      }),
      createDependencies(failingStore, {
        uploadLogoFile: async () => ({
          logoUpload: {
            id: 'logo-1',
            requestId: 'request-1',
            eventId: 'wacken-2027',
            storageBucket: 'bucket-a',
            storagePath: 'event-sponsoring/wacken-2027/requests/request-1/logo-1.png',
            originalFileName: 'logo.png',
            contentType: 'image/png',
            sizeBytes: 8,
            status: 'uploaded',
            uploadedAt: NOW.toISOString(),
          },
        }),
        deleteLogoFile: async (upload) => {
          deleted.push(upload.storagePath);
        },
      }),
    ),
    /save failed/,
  );

  assert.deepEqual(deleted, ['event-sponsoring/wacken-2027/requests/request-1/logo-1.png']);
});

test('interne Anfrage-Mail enthaelt Referenz, Snapshot und Logo-Anhang', async () => {
  process.env.EVENT_SPONSORING_RECIPIENT_EMAIL = 'team@example.com';
  const captured: EventSponsoringMailPayload[] = [];
  const store = createInMemoryEventSponsoringStore({
    configs: [buildConfig()],
    packages: [buildPackage('small_logo')],
  });

  const result = await submitEventSponsoringRequest(
    buildSubmission({
      packageId: 'pkg-small',
      logoFile: new File([Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], 'logo.png', { type: 'image/png' }),
    }),
    createDependencies(store, {
      uploadLogoFile: async () => ({
        logoUpload: {
          id: 'logo-1',
          requestId: 'request-1',
          eventId: 'wacken-2027',
          storageBucket: 'bucket-a',
          storagePath: 'event-sponsoring/wacken-2027/requests/request-1/logo-1.png',
          originalFileName: 'logo.png',
          contentType: 'image/png',
          sizeBytes: 8,
          status: 'uploaded',
          uploadedAt: NOW.toISOString(),
        },
      }),
      readLogoFile: async () => ({
        filename: 'logo.png',
        contentType: 'image/png',
        content: Buffer.from([1, 2, 3]),
        storageBucket: 'bucket-a',
        storagePath: 'event-sponsoring/wacken-2027/requests/request-1/logo-1.png',
      }),
      sendMail: async (payload) => {
        captured.push(payload);
        return { messageId: 'provider-123' };
      },
    }),
  );

  assert.equal(captured.length, 1);
  assert.equal(captured[0].attachments?.length, 1);
  assert.equal(captured[0].attachments?.[0].filename, 'logo.png');
  assert.match(captured[0].text, /Anfrage-ID:/);
  assert.match(captured[0].text, /Leistungen:/);
  assert.match(captured[0].text, /Zahlung erfolgt per Rechnung/);
  assert.match(captured[0].text, /Logoplatzierung erfolgt durch Headbang Handwerk/);
  assert.match(captured[0].html, /Interner Logo-Bezug/);
  assert.equal(captured[0].messageId, createEventSponsoringRequestMessageId(result.request));
});

test('fehlender Logo-Anhang verhindert den Mailversand nicht', async () => {
  process.env.EVENT_SPONSORING_RECIPIENT_EMAIL = 'team@example.com';
  const captured: EventSponsoringMailPayload[] = [];
  const store = createInMemoryEventSponsoringStore({
    configs: [buildConfig()],
    packages: [buildPackage('small_logo')],
  });

  const result = await submitEventSponsoringRequest(
    buildSubmission({
      packageId: 'pkg-small',
      logoFile: new File([Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], 'unsafe/..\\logo.png', { type: 'image/png' }),
    }),
    createDependencies(store, {
      uploadLogoFile: async () => ({
        logoUpload: {
          id: 'logo-1',
          requestId: 'request-1',
          eventId: 'wacken-2027',
          storageBucket: 'bucket-a',
          storagePath: 'event-sponsoring/wacken-2027/requests/request-1/logo-1.png',
          originalFileName: 'unsafe-..-logo.png',
          contentType: 'image/png',
          sizeBytes: 8,
          status: 'uploaded',
          uploadedAt: NOW.toISOString(),
        },
      }),
      readLogoFile: async () => {
        throw new Error('download failed');
      },
      sendMail: async (payload) => {
        captured.push(payload);
        return { messageId: 'provider-789' };
      },
    }),
  );

  const saved = await store.runTransaction((transaction) => transaction.getRequest(result.request.id));
  assert.equal(captured.length, 1);
  assert.equal(captured[0].attachments?.length || 0, 0);
  assert.match(captured[0].text, /Logo angehaengt: nein/);
  assert.match(captured[0].text, /Interner Logo-Bezug: bucket-a:event-sponsoring\/wacken-2027\/requests\/request-1\/logo-1.png/);
  assert.equal(saved?.emailDelivery.state, 'sent');
});

test('Mailfehler werden bereinigt gespeichert und koennen nach einem Fehler erneut versendet werden', async () => {
  process.env.EVENT_SPONSORING_RECIPIENT_EMAIL = 'team@example.com';
  const store = createInMemoryEventSponsoringStore({
    configs: [buildConfig()],
    packages: [buildPackage('custom_request')],
  });
  let shouldFail = true;

  const result = await submitEventSponsoringRequest(buildSubmission(), createDependencies(store, {
    sendMail: async () => {
      if (shouldFail) {
        throw new Error('SMTP timeout\nwith internal details');
      }

      return { messageId: 'provider-456' };
    },
  }));

  let saved = await store.runTransaction((transaction) => transaction.getRequest(result.request.id));
  assert.equal(saved?.emailDelivery.state, 'failed');
  assert.equal(saved?.emailDelivery.lastErrorCategory, 'transport_error');
  assert.equal(saved?.emailDelivery.lastErrorMessage, 'SMTP timeout with internal details');

  shouldFail = false;

  const retryResult = await sendEventSponsoringRequestNotification(result.request.id, {
    store,
    getEventById: async () => buildEvent(),
    now: () => new Date('2026-09-18T12:06:00.000Z'),
    sendMail: async () => ({ messageId: 'provider-456' }),
  });

  saved = await store.runTransaction((transaction) => transaction.getRequest(result.request.id));
  assert.ok('status' in retryResult);
  assert.equal(retryResult.status, 'sent');
  assert.equal(saved?.emailDelivery.state, 'sent');
  assert.equal(saved?.emailDelivery.providerMessageId, 'provider-456');
});

test('bereits versendete Anfrage-Mails werden nicht doppelt versendet', async () => {
  process.env.EVENT_SPONSORING_RECIPIENT_EMAIL = 'team@example.com';
  const store = createInMemoryEventSponsoringStore({
    configs: [buildConfig()],
    packages: [buildPackage('custom_request')],
  });
  let sends = 0;

  const result = await submitEventSponsoringRequest(buildSubmission(), createDependencies(store, {
    sendMail: async () => {
      sends += 1;
      return { messageId: 'provider-once' };
    },
  }));

  const second = await sendEventSponsoringRequestNotification(result.request.id, {
    store,
    getEventById: async () => buildEvent(),
    now: () => new Date('2026-09-18T12:05:00.000Z'),
    sendMail: async () => {
      sends += 1;
      return { messageId: 'provider-twice' };
    },
  });

  assert.equal(sends, 1);
  assert.equal('reason' in second ? second.reason : undefined, 'already-sent');
});

test('parallele Versandversuche erzeugen keine Doppelmail und festhaengende Claims sind uebernehmbar', async () => {
  process.env.EVENT_SPONSORING_RECIPIENT_EMAIL = 'team@example.com';
  const store = createInMemoryEventSponsoringStore({
    configs: [buildConfig()],
    packages: [buildPackage('custom_request')],
  });
  let sends = 0;

  const result = await submitEventSponsoringRequest(buildSubmission(), createDependencies(store, {
    sendMail: async () => {
      throw new Error('SMTP timeout');
    },
  }));

  await store.runTransaction(async (transaction) => {
    const existing = await transaction.getRequest(result.request.id);
    if (!existing) {
      throw new Error('missing request');
    }
    await transaction.saveRequest({
      ...existing,
      emailDelivery: {
        ...existing.emailDelivery,
        state: 'sending',
        sendingClaimId: 'claim-1',
        sendingClaimedAt: '2026-09-18T12:00:00.000Z',
      },
    });
  });

  const blocked = await sendEventSponsoringRequestNotification(result.request.id, {
    store,
    getEventById: async () => buildEvent(),
    now: () => new Date('2026-09-18T12:03:00.000Z'),
    sendMail: async () => {
      sends += 1;
      return { messageId: 'provider-1' };
    },
  });

  assert.equal('reason' in blocked ? blocked.reason : undefined, 'already-sending');
  assert.equal(sends, 0);

  const recovered = await sendEventSponsoringRequestNotification(result.request.id, {
    store,
    getEventById: async () => buildEvent(),
    now: () => new Date('2026-09-18T12:08:00.000Z'),
    sendMail: async () => {
      sends += 1;
      return { messageId: 'provider-2' };
    },
  });

  assert.equal('status' in recovered ? recovered.status : undefined, 'sent');
  assert.equal(sends, 1);
});

test('oeffentliche und Admin-Pfade importieren keine Serverdienste in Client-Komponenten', () => {
  const publicPageSource = readFileSync(new URL('../app/veranstaltungen/[eventId]/sponsoring/page.tsx', import.meta.url), 'utf8');
  const requestPageSource = readFileSync(new URL('../app/veranstaltungen/[eventId]/sponsoring/anfrage/page.tsx', import.meta.url), 'utf8');
  const publicComponentSource = readFileSync(new URL('../components/event-sponsoring-public-page.tsx', import.meta.url), 'utf8');

  assert.doesNotMatch(publicComponentSource, /lib\/event-sponsoring\/request|lib\/event-sponsoring\/logo-upload-storage|lib\/email/);
  assert.doesNotMatch(requestPageSource, /lib\/email|firebase-admin/);
  assert.doesNotMatch(publicPageSource, /stripe|checkout/i);
});

test('oeffentliche Anfragepfade und Stripe-Seiten sind im Event-Sponsoring nicht mehr verdrahtet', () => {
  const publicSource = readFileSync(new URL('../lib/event-sponsoring/public.ts', import.meta.url), 'utf8');
  const requestSource = readFileSync(new URL('../app/veranstaltungen/[eventId]/sponsoring/anfrage/page.tsx', import.meta.url), 'utf8');

  assert.match(publicSource, /sponsoring\/anfrage\?package=/);
  assert.doesNotMatch(publicSource, /sponsoring\/buchen/);
  assert.doesNotMatch(requestSource, /stripe|checkout/i);
  assert.match(requestSource, /manuell per Rechnung/);
});