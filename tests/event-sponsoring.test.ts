import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canSellAnotherPackageOfSize,
  doesSlotMatchBooking,
  findOverlappingActiveSlots,
  getConsumedCapacityBySize,
  getSellableCapacityBySize,
  getTotalCapacityBySize,
} from '@/lib/event-sponsoring/capacity';
import {
  createInMemoryEventSponsoringStore,
  getEventSponsoringBookingById,
  getEventSponsoringConfigByEventId,
  getEventSponsoringPaymentById,
  getEventSponsoringRequestById,
  listEventSponsoringBannersByEventId,
  listEventSponsoringPackagesByEventId,
  listEventSponsoringSlotsByBannerId,
  saveEventSponsoringBanner,
  saveEventSponsoringBooking,
  saveEventSponsoringConfig,
  saveEventSponsoringPackage,
  saveEventSponsoringPayment,
  saveEventSponsoringRequest,
  saveEventSponsoringSlot,
} from '@/lib/event-sponsoring/store';
import { EVENT_SPONSORING_COLLECTIONS } from '@/lib/event-sponsoring/types';
import {
  assertMaxTwoActiveBannersPerEvent,
  getExpectedBookingTypeForPackageKind,
  getExpectedLogoSlotSizeForPackageKind,
  normalizeEventSponsoringBanner,
  normalizeEventSponsoringBooking,
  normalizeEventSponsoringConfig,
  normalizeEventSponsoringPackage,
  normalizeEventSponsoringPayment,
  normalizeEventSponsoringRequest,
  normalizeEventSponsoringSlot,
} from '@/lib/event-sponsoring/validation';

const NOW = '2026-09-18T12:00:00.000Z';

function buildConfig(overrides: Partial<ReturnType<typeof normalizeEventSponsoringConfig>> = {}) {
  return normalizeEventSponsoringConfig({
    eventId: 'wacken-2027',
    enabled: true,
    publicTitle: 'Festival Sponsoring',
    publicDescription: 'Sponsoring fuer das Event.',
    currencyCode: 'eur',
    anonymousSupportEnabled: true,
    anonymousMinimumAmountCents: 5000,
    customSponsoringEnabled: true,
    showOccupiedLogosPublicly: true,
    ...overrides,
  }, { now: NOW });
}

function buildPackage(overrides: Partial<ReturnType<typeof normalizeEventSponsoringPackage>> = {}) {
  return normalizeEventSponsoringPackage({
    id: 'pkg-small',
    eventId: 'wacken-2027',
    name: 'Kleines Logo',
    kind: 'small_logo',
    description: 'Kleines Logopaket',
    features: ['Logo auf Banner'],
    priceCents: 25000,
    currencyCode: 'EUR',
    active: true,
    sortOrder: 1,
    grantsBannerPlacement: true,
    logoSlotSize: 'small',
    isPaidOnline: false,
    ...overrides,
  }, { now: NOW });
}

function buildBanner(overrides: Partial<ReturnType<typeof normalizeEventSponsoringBanner>> = {}) {
  return normalizeEventSponsoringBanner({
    id: 'banner-a',
    eventId: 'wacken-2027',
    name: 'Banner A',
    widthMm: 2000,
    heightMm: 1000,
    sortOrder: 0,
    active: true,
    layoutVersion: 1,
    ...overrides,
  }, { now: NOW });
}

function buildSlot(overrides: Partial<ReturnType<typeof normalizeEventSponsoringSlot>> = {}) {
  return normalizeEventSponsoringSlot({
    id: 'slot-a',
    eventId: 'wacken-2027',
    bannerId: 'banner-a',
    slotCode: 'A-01',
    packageSize: 'small',
    x: 0,
    y: 0,
    width: 0.2,
    height: 0.2,
    sortOrder: 0,
    status: 'available',
    displayLabel: 'A1',
    active: true,
    ...overrides,
  }, { now: NOW });
}

function buildBooking(overrides: Partial<ReturnType<typeof normalizeEventSponsoringBooking>> = {}) {
  return normalizeEventSponsoringBooking({
    id: 'booking-a',
    eventId: 'wacken-2027',
    packageId: 'pkg-small',
    packageKind: 'small_logo',
    bookingType: 'paid_logo',
    slotSize: 'small',
    companyName: 'Muster GmbH',
    contactName: 'Erika Muster',
    email: 'erika@example.com',
    phone: '+49123456789',
    billingAddress: {
      street: 'Musterweg',
      houseNumber: '1',
      postalCode: '26789',
      city: 'Leer',
      countryCode: 'de',
    },
    priceCents: 25000,
    currencyCode: 'EUR',
    status: 'paid',
    publicDisplayEnabled: true,
    anonymousSupport: false,
    secureAccessTokenHash: 'a'.repeat(64),
    secureAccessTokenExpiresAt: '2026-09-19T12:00:00.000Z',
    ...overrides,
  }, { now: NOW });
}

function buildPayment(overrides: Partial<ReturnType<typeof normalizeEventSponsoringPayment>> = {}) {
  return normalizeEventSponsoringPayment({
    id: 'payment-a',
    bookingId: 'booking-a',
    eventId: 'wacken-2027',
    provider: 'stripe',
    checkoutSessionId: 'cs_test_123',
    paymentIntentId: 'pi_test_123',
    status: 'created',
    amountTotalCents: 25000,
    currencyCode: 'EUR',
    processedWebhookEventIds: ['evt_1'],
    metadataSnapshot: {
      bookingId: 'booking-a',
      eventId: 'wacken-2027',
    },
    ...overrides,
  }, { now: NOW });
}

function buildRequest() {
  return normalizeEventSponsoringRequest({
    id: 'request-a',
    eventId: 'wacken-2027',
    packageId: 'package-custom',
    packageKind: 'custom_request',
    packageNameSnapshot: 'Individuelles Sponsoring',
    packageFeaturesSnapshot: ['Individuelle Unterstuetzung nach Abstimmung'],
    packagePriceCents: 0,
    currencyCode: 'EUR',
    companyName: 'Material GmbH',
    companyWebsite: 'https://material.example',
    contactFirstName: 'Alex',
    contactLastName: 'Beispiel',
    contactName: 'Alex Beispiel',
    billingAddress: {
      company: 'Material GmbH',
      street: 'Werkstrasse',
      houseNumber: '12',
      postalCode: '20457',
      city: 'Hamburg',
      countryCode: 'DE',
    },
    email: 'alex@example.com',
    phone: '+4911111111',
    supportTypes: ['material', 'transport'],
    message: 'Wir koennen Material und Transport unterstuetzen.',
    publicDisplayEnabled: true,
    anonymousSupport: false,
    acceptDataProcessing: true,
    acceptInvoicePayment: true,
    acceptManualLogoPlacement: true,
    status: 'new',
    emailDelivery: {
      state: 'pending',
      attemptCount: 0,
    },
  }, { now: NOW });
}

test('Collection-Namen bleiben klar getrennt und vollständig', () => {
  assert.deepEqual(EVENT_SPONSORING_COLLECTIONS, {
    configs: 'eventSponsoringConfigs',
    packages: 'eventSponsoringPackages',
    banners: 'eventSponsoringBanners',
    slots: 'eventSponsoringSlots',
    bookings: 'eventSponsoringBookings',
    payments: 'eventSponsoringPayments',
    logoUploads: 'eventSponsoringLogoUploads',
    requests: 'eventSponsoringRequests',
  });
});

test('Paketarten werden fachlich korrekt ihren Slotgroessen und Buchungstypen zugeordnet', () => {
  assert.equal(getExpectedLogoSlotSizeForPackageKind('small_logo'), 'small');
  assert.equal(getExpectedLogoSlotSizeForPackageKind('medium_logo'), 'medium');
  assert.equal(getExpectedLogoSlotSizeForPackageKind('large_logo'), 'large');
  assert.equal(getExpectedLogoSlotSizeForPackageKind('custom_request'), 'none');
  assert.equal(getExpectedLogoSlotSizeForPackageKind('anonymous_support'), 'none');
  assert.equal(getExpectedBookingTypeForPackageKind('small_logo'), 'paid_logo');
  assert.equal(getExpectedBookingTypeForPackageKind('custom_request'), 'custom_request');
  assert.equal(getExpectedBookingTypeForPackageKind('anonymous_support'), 'anonymous_support');
});

test('ungueltige Paketarten und negative Preise werden abgewiesen', () => {
  assert.throws(() => normalizeEventSponsoringPackage({ ...buildPackage(), kind: 'bronze' }, { now: NOW }), /ungueltig/);
  assert.throws(() => normalizeEventSponsoringPackage({ ...buildPackage(), priceCents: -1 }, { now: NOW }), /zu klein/);
});

test('nur Logopakete duerfen Bannerplatzierung erhalten', () => {
  assert.throws(
    () => normalizeEventSponsoringPackage({ ...buildPackage(), kind: 'custom_request', logoSlotSize: 'none', grantsBannerPlacement: true }, { now: NOW }),
    /Nur Logopakete/,
  );
});

test('Bannermaeße und aktive Bannergrenze werden geprueft', () => {
  const first = buildBanner({ id: 'banner-1' });
  const second = buildBanner({ id: 'banner-2', sortOrder: 1 });
  const third = buildBanner({ id: 'banner-3', sortOrder: 2 });

  assert.equal(first.widthMm, 2000);
  assert.equal(first.heightMm, 1000);
  assert.throws(() => normalizeEventSponsoringBanner({ ...buildBanner(), widthMm: 0 }, { now: NOW }), /zu klein/);
  assert.doesNotThrow(() => assertMaxTwoActiveBannersPerEvent([first, second], 'wacken-2027'));
  assert.throws(() => assertMaxTwoActiveBannersPerEvent([first, second, third], 'wacken-2027'), /hoechstens zwei aktive Banner/);
});

test('Slotkoordinaten werden validiert', () => {
  assert.equal(buildSlot().width > 0, true);
  assert.throws(() => normalizeEventSponsoringSlot({ ...buildSlot(), x: -0.1 }, { now: NOW }), /zu klein|ungueltig/);
  assert.throws(() => normalizeEventSponsoringSlot({ ...buildSlot(), width: 0 }, { now: NOW }), /zu klein/);
  assert.throws(() => normalizeEventSponsoringSlot({ ...buildSlot(), x: 0.9, width: 0.2 }, { now: NOW }), /laeuft aus dem Banner heraus/);
  assert.throws(() => normalizeEventSponsoringSlot({ ...buildSlot(), y: 0.9, height: 0.2 }, { now: NOW }), /laeuft aus dem Banner heraus/);
});

test('Slotstatus assigned verlangt bookingId und available verbietet bookingId', () => {
  assert.throws(() => normalizeEventSponsoringSlot({ ...buildSlot(), status: 'assigned' }, { now: NOW }), /braucht eine Buchungs-ID/);
  assert.throws(() => normalizeEventSponsoringSlot({ ...buildSlot(), status: 'available', bookingId: 'booking-a' }, { now: NOW }), /darf keine Buchungs-ID besitzen/);
  const assigned = normalizeEventSponsoringSlot({ ...buildSlot(), status: 'assigned', bookingId: 'booking-a' }, { now: NOW });
  assert.equal(assigned.bookingId, 'booking-a');
});

test('ueberlappende aktive Slots werden erkannt', () => {
  const overlaps = findOverlappingActiveSlots([
    buildSlot({ id: 'slot-1', x: 0, y: 0, width: 0.3, height: 0.3 }),
    buildSlot({ id: 'slot-2', x: 0.2, y: 0.2, width: 0.3, height: 0.3 }),
    buildSlot({ id: 'slot-3', x: 0.6, y: 0.6, width: 0.2, height: 0.2 }),
  ]);

  assert.deepEqual(overlaps, [{ bannerId: 'banner-a', firstSlotId: 'slot-1', secondSlotId: 'slot-2' }]);
});

test('beruehrende Kanten gelten nicht als Ueberlappung', () => {
  const overlaps = findOverlappingActiveSlots([
    buildSlot({ id: 'slot-1', x: 0, y: 0, width: 0.2, height: 0.2 }),
    buildSlot({ id: 'slot-2', x: 0.2, y: 0, width: 0.2, height: 0.2 }),
  ]);

  assert.deepEqual(overlaps, []);
});

test('Kapazitaeten fuer kleine, mittlere und grosse Slots werden korrekt berechnet', () => {
  const slots = [
    buildSlot({ id: 's1', packageSize: 'small', status: 'available' }),
    buildSlot({ id: 's2', packageSize: 'small', status: 'blocked', x: 0.25 }),
    buildSlot({ id: 'm1', packageSize: 'medium', x: 0.4, width: 0.25 }),
    buildSlot({ id: 'l1', packageSize: 'large', x: 0.7, width: 0.2 }),
  ];

  assert.deepEqual(getTotalCapacityBySize(slots), { small: 1, medium: 1, large: 1 });
});

test('bezahlte Buchung ohne Slotwahl verbraucht Kapazitaet', () => {
  const bookings = [buildBooking({ selectedSlotId: undefined, status: 'paid' })];
  assert.deepEqual(getConsumedCapacityBySize(bookings), { small: 1, medium: 0, large: 0 });
});

test('unbezahlte Buchungen verbrauchen keine dauerhafte Kapazitaet', () => {
  const bookings = [
    buildBooking({ id: 'draft', status: 'draft' }),
    buildBooking({ id: 'checkout', status: 'checkout_created' }),
    buildBooking({ id: 'pending', status: 'payment_pending' }),
  ];

  assert.deepEqual(getConsumedCapacityBySize(bookings), { small: 0, medium: 0, large: 0 });
});

test('stornierte, abgelaufene und erstattete Buchungen geben Kapazitaet frei', () => {
  const bookings = [
    buildBooking({ id: 'cancelled', status: 'cancelled' }),
    buildBooking({ id: 'expired', status: 'expired' }),
    buildBooking({ id: 'refunded', status: 'refunded' }),
  ];

  assert.deepEqual(getConsumedCapacityBySize(bookings), { small: 0, medium: 0, large: 0 });
});

test('verkaufbare Restkapazitaet und Nachverkaufspruefung stimmen', () => {
  const slots = [buildSlot({ id: 's1' }), buildSlot({ id: 's2', x: 0.25 })];
  const bookings = [buildBooking({ id: 'b1' })];

  assert.deepEqual(getSellableCapacityBySize(slots, bookings), { small: 1, medium: 0, large: 0 });
  assert.equal(canSellAnotherPackageOfSize('small', slots, bookings), true);
  assert.equal(canSellAnotherPackageOfSize('medium', slots, bookings), false);
});

test('Buchung kann nur einen Slot derselben Groesse und desselben Events auswaehlen', () => {
  const booking = buildBooking({ id: 'booking-fit', slotSize: 'small' });
  assert.equal(doesSlotMatchBooking(buildSlot({ id: 'slot-ok', packageSize: 'small' }), booking), true);
  assert.equal(doesSlotMatchBooking(buildSlot({ id: 'slot-big', packageSize: 'large' }), booking), false);
  assert.equal(doesSlotMatchBooking(buildSlot({ id: 'slot-other', eventId: 'summer-breeze-2027' }), booking), false);
});

test('anonyme Unterstuetzung und individuelles Sponsoring erhalten keine Slotgroesse', () => {
  const anonymous = normalizeEventSponsoringBooking({
    ...buildBooking(),
    id: 'anonymous',
    packageKind: 'anonymous_support',
    bookingType: 'anonymous_support',
    slotSize: 'none',
    anonymousSupport: true,
    publicDisplayEnabled: false,
  }, { now: NOW });
  const custom = normalizeEventSponsoringBooking({
    ...buildBooking(),
    id: 'custom',
    packageKind: 'custom_request',
    bookingType: 'custom_request',
    slotSize: 'none',
    anonymousSupport: false,
    publicDisplayEnabled: false,
  }, { now: NOW });

  assert.equal(anonymous.slotSize, 'none');
  assert.equal(custom.slotSize, 'none');
});

test('optionale Felder werden sauber normalisiert statt als leere Strings gespeichert', () => {
  const booking = normalizeEventSponsoringBooking({
    ...buildBooking(),
    companyName: ' ',
    phone: ' ',
    stripeCheckoutSessionId: ' ',
    stripePaymentIntentId: ' ',
    selectedSlotId: ' ',
    secureAccessTokenHash: undefined,
    secureAccessTokenExpiresAt: undefined,
    billingAddress: {},
  }, { now: NOW });

  assert.equal('companyName' in booking, false);
  assert.equal('phone' in booking, false);
  assert.equal('stripeCheckoutSessionId' in booking, false);
  assert.equal('stripePaymentIntentId' in booking, false);
  assert.equal('selectedSlotId' in booking, false);
  assert.equal('billingAddress' in booking, false);
});

test('Store liest und schreibt die neue Fachlogik getrennt vom CMS-Dokument', async () => {
  const store = createInMemoryEventSponsoringStore();
  const config = buildConfig();
  const pkg = buildPackage();
  const banner = buildBanner();
  const slot = buildSlot();
  const booking = buildBooking();
  const payment = buildPayment();
  const request = buildRequest();

  await saveEventSponsoringConfig(config, { store });
  await saveEventSponsoringPackage(pkg, { store });
  await saveEventSponsoringBanner(banner, { store });
  await saveEventSponsoringSlot(slot, { store });
  await saveEventSponsoringBooking(booking, { store });
  await saveEventSponsoringPayment(payment, { store });
  await saveEventSponsoringRequest(request, { store });

  assert.deepEqual(await getEventSponsoringConfigByEventId('wacken-2027', { store }), config);
  assert.deepEqual(await listEventSponsoringPackagesByEventId('wacken-2027', { store }), [pkg]);
  assert.deepEqual(await listEventSponsoringBannersByEventId('wacken-2027', { store }), [banner]);
  assert.deepEqual(await listEventSponsoringSlotsByBannerId('wacken-2027', 'banner-a', { store }), [slot]);
  assert.deepEqual(await getEventSponsoringBookingById('booking-a', { store }), booking);
  assert.deepEqual(await getEventSponsoringPaymentById('payment-a', { store }), payment);
  assert.deepEqual(await getEventSponsoringRequestById('request-a', { store }), request);
});

test('Store lehnt dritten aktiven Banner fuer ein Event ab', async () => {
  const store = createInMemoryEventSponsoringStore();

  await saveEventSponsoringBanner(buildBanner({ id: 'banner-1' }), { store });
  await saveEventSponsoringBanner(buildBanner({ id: 'banner-2', sortOrder: 1 }), { store });

  await assert.rejects(
    () => saveEventSponsoringBanner(buildBanner({ id: 'banner-3', sortOrder: 2 }), { store }),
    /hoechstens zwei aktive Banner/,
  );
});

test('Store lehnt ueberlappende aktive Slots desselben Banners ab', async () => {
  const store = createInMemoryEventSponsoringStore();

  await saveEventSponsoringSlot(buildSlot({ id: 'slot-1', x: 0, y: 0, width: 0.3, height: 0.3 }), { store });

  await assert.rejects(
    () => saveEventSponsoringSlot(buildSlot({ id: 'slot-2', x: 0.2, y: 0.2, width: 0.3, height: 0.3 }), { store }),
    /duerfen sich nicht ueberschneiden/,
  );
});
