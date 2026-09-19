import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDefaultEventSponsoringBanners,
  buildDefaultEventSponsoringPackages,
  buildEventSponsoringCapacitySummary,
  buildDefaultEventSponsoringSlotsForBanner,
  ensureDefaultEventSponsoringBannersForAdmin,
  ensureDefaultEventSponsoringSlotsForAdmin,
  getActiveBannerSlotWarnings,
  saveEventSponsoringBannerForAdmin,
  saveEventSponsoringBannerLayoutForAdmin,
} from '@/lib/event-sponsoring/admin';
import { createInMemoryEventSponsoringStore } from '@/lib/event-sponsoring/store';
import { findOverlappingActiveSlots } from '@/lib/event-sponsoring/capacity';
import { normalizeEventSponsoringBooking } from '@/lib/event-sponsoring/validation';
import { normalizeEvent } from '@/lib/event-stand';
import type { Event } from '@/lib/types';

const NOW = '2026-09-18T16:00:00.000Z';

function buildEvent(overrides: Partial<Event> = {}): Event {
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
    stand: {
      assetUrl: '',
      assetName: '',
      assetContentType: '',
      lead: '',
      bannerSlots: [],
    },
    ...overrides,
  });
}

function createAdminDeps(options?: { unauthorized?: boolean; initialEvent?: Event }) {
  const store = createInMemoryEventSponsoringStore();
  const cms = { event: options?.initialEvent || buildEvent() };

  return {
    store,
    cms,
    deps: {
      store,
      now: NOW,
      requireAdmin: async () => {
        if (options?.unauthorized) {
          throw new Error('Nicht autorisiert.');
        }
      },
      getEventById: async (eventId: string) => (eventId === cms.event.id ? cms.event : null),
    },
  };
}

async function seedBannersAndSlots() {
  const harness = createAdminDeps();
  await ensureDefaultEventSponsoringBannersForAdmin({ eventId: 'wacken-2027' }, harness.deps);
  await ensureDefaultEventSponsoringSlotsForAdmin({ eventId: 'wacken-2027' }, harness.deps);
  return harness;
}

test('genau zwei Banner werden angelegt und wiederholtes Anlegen erzeugt keine Duplikate', async () => {
  const harness = createAdminDeps();

  const first = await ensureDefaultEventSponsoringBannersForAdmin({ eventId: 'wacken-2027' }, harness.deps);
  const second = await ensureDefaultEventSponsoringBannersForAdmin({ eventId: 'wacken-2027' }, harness.deps);
  const banners = await harness.store.runTransaction((transaction) => transaction.listBanners('wacken-2027'));

  assert.equal(first.createdBannerIds.length, 2);
  assert.equal(second.createdBannerIds.length, 0);
  assert.equal(banners.length, 2);
  assert.equal(banners[0].widthMm, 2000);
  assert.equal(banners[0].heightMm, 1000);
});

test('bei einem vorhandenen Banner wird nur der fehlende ergänzt', async () => {
  const harness = createAdminDeps();
  const [firstBanner] = buildDefaultEventSponsoringBanners('wacken-2027', NOW);

  await harness.store.runTransaction(async (transaction) => {
    await transaction.saveBanner(firstBanner);
  });

  const result = await ensureDefaultEventSponsoringBannersForAdmin({ eventId: 'wacken-2027' }, harness.deps);
  const banners = await harness.store.runTransaction((transaction) => transaction.listBanners('wacken-2027'));

  assert.equal(result.createdBannerIds.length, 1);
  assert.equal(banners.length, 2);
});

test('mehr als zwei aktive Banner werden abgewiesen', async () => {
  const harness = createAdminDeps();
  const banners = buildDefaultEventSponsoringBanners('wacken-2027', NOW);

  await harness.store.runTransaction(async (transaction) => {
    await transaction.saveBanner(banners[0]);
    await transaction.saveBanner(banners[1]);
  });

  await assert.rejects(
    () => saveEventSponsoringBannerForAdmin({ eventId: 'wacken-2027', bannerId: 'third', name: 'x', active: true }, harness.deps),
    /nicht gefunden/,
  );
});

test('pro Banner entstehen 1 grosse, 2 mittlere und 6 kleine Positionen ohne Ueberschneidung', async () => {
  const harness = await seedBannersAndSlots();
  const banners = await harness.store.runTransaction((transaction) => transaction.listBanners('wacken-2027'));
  const slots = await harness.store.runTransaction((transaction) => transaction.listSlotsByEvent('wacken-2027'));

  assert.equal(banners.length, 2);
  assert.equal(slots.length, 18);

  for (const banner of banners) {
    const bannerSlots = slots.filter((slot) => slot.bannerId === banner.id);
    assert.equal(bannerSlots.filter((slot) => slot.packageSize === 'large').length, 1);
    assert.equal(bannerSlots.filter((slot) => slot.packageSize === 'medium').length, 2);
    assert.equal(bannerSlots.filter((slot) => slot.packageSize === 'small').length, 6);
    assert.deepEqual(findOverlappingActiveSlots(bannerSlots), []);
    assert.equal(bannerSlots.every((slot) => slot.x >= 0 && slot.y >= 0 && slot.x + slot.width <= 1 && slot.y + slot.height <= 1), true);
  }
});

test('Codes der Standardpositionen sind eindeutig und wiederholtes Anlegen erzeugt keine Duplikate', async () => {
  const harness = await seedBannersAndSlots();

  const second = await ensureDefaultEventSponsoringSlotsForAdmin({ eventId: 'wacken-2027' }, harness.deps);
  const slots = await harness.store.runTransaction((transaction) => transaction.listSlotsByEvent('wacken-2027'));

  assert.equal(second.createdBannerIds.length, 0);
  assert.equal(new Set(slots.map((slot) => slot.slotCode)).size, slots.length);
});

test('vorhandene Layouts werden durch Standardpositionen nicht ueberschrieben', async () => {
  const harness = createAdminDeps();
  const [banner] = buildDefaultEventSponsoringBanners('wacken-2027', NOW);
  const [customSlot] = buildDefaultEventSponsoringSlotsForBanner(banner, NOW).slice(0, 1);

  await harness.store.runTransaction(async (transaction) => {
    await transaction.saveBanner(banner);
    await transaction.saveSlot(customSlot);
  });

  const result = await ensureDefaultEventSponsoringSlotsForAdmin({ eventId: 'wacken-2027' }, harness.deps);
  const slots = await harness.store.runTransaction((transaction) => transaction.listSlotsByBanner('wacken-2027', banner.id));

  assert.deepEqual(result.createdBannerIds, []);
  assert.equal(slots.length, 1);
});

test('Position ausserhalb des Banners und mit Breite oder Hoehe 0 wird abgewiesen', async () => {
  const harness = await seedBannersAndSlots();
  const [banner] = await harness.store.runTransaction((transaction) => transaction.listBanners('wacken-2027'));
  const slots = await harness.store.runTransaction((transaction) => transaction.listSlotsByBanner('wacken-2027', banner.id));
  const [first, ...rest] = slots;

  await assert.rejects(
    () => saveEventSponsoringBannerLayoutForAdmin({
      eventId: 'wacken-2027',
      bannerId: banner.id,
      baseLayoutVersion: banner.layoutVersion + 1,
      slots: [
        { id: first.id, slotCode: first.slotCode, displayLabel: first.displayLabel, packageSize: first.packageSize, xPercent: 90, yPercent: 90, widthPercent: 20, heightPercent: 20, sortOrder: first.sortOrder, status: first.status, active: true },
        ...rest.map((slot) => ({ id: slot.id, slotCode: slot.slotCode, displayLabel: slot.displayLabel, packageSize: slot.packageSize, xPercent: slot.x * 100, yPercent: slot.y * 100, widthPercent: slot.width * 100, heightPercent: slot.height * 100, sortOrder: slot.sortOrder, status: slot.status, active: slot.active })),
      ],
    }, harness.deps),
    /zwischenzeitlich geaendert|laeuft aus dem Banner heraus/,
  );

  await assert.rejects(
    () => saveEventSponsoringBannerLayoutForAdmin({
      eventId: 'wacken-2027',
      bannerId: banner.id,
      baseLayoutVersion: banner.layoutVersion,
      slots: slots.map((slot, index) => ({ id: slot.id, slotCode: slot.slotCode, displayLabel: slot.displayLabel, packageSize: slot.packageSize, xPercent: slot.x * 100, yPercent: slot.y * 100, widthPercent: index === 0 ? 0 : slot.width * 100, heightPercent: slot.height * 100, sortOrder: slot.sortOrder, status: slot.status, active: slot.active })),
    }, harness.deps),
    /groesser als 0|zu klein/,
  );
});

test('Ueberschneidung und doppelter Positionscode werden abgewiesen', async () => {
  const harness = await seedBannersAndSlots();
  const [banner] = await harness.store.runTransaction((transaction) => transaction.listBanners('wacken-2027'));
  const slots = await harness.store.runTransaction((transaction) => transaction.listSlotsByBanner('wacken-2027', banner.id));

  await assert.rejects(
    () => saveEventSponsoringBannerLayoutForAdmin({
      eventId: 'wacken-2027',
      bannerId: banner.id,
      baseLayoutVersion: banner.layoutVersion,
      slots: slots.map((slot, index) => ({
        id: slot.id,
        slotCode: index < 2 ? 'B1-X1' : slot.slotCode,
        displayLabel: slot.displayLabel,
        packageSize: slot.packageSize,
        xPercent: slot.x * 100,
        yPercent: slot.y * 100,
        widthPercent: slot.width * 100,
        heightPercent: slot.height * 100,
        sortOrder: slot.sortOrder,
        status: slot.status,
        active: slot.active,
      })),
    }, harness.deps),
    /mehrfach uebermittelt|bereits vergeben/,
  );

  await assert.rejects(
    () => saveEventSponsoringBannerLayoutForAdmin({
      eventId: 'wacken-2027',
      bannerId: banner.id,
      baseLayoutVersion: banner.layoutVersion,
      slots: slots.map((slot, index) => ({
        id: slot.id,
        slotCode: slot.slotCode,
        displayLabel: slot.displayLabel,
        packageSize: slot.packageSize,
        xPercent: index === 1 ? slots[0].x * 100 : slot.x * 100,
        yPercent: index === 1 ? slots[0].y * 100 : slot.y * 100,
        widthPercent: index === 1 ? slots[0].width * 100 : slot.width * 100,
        heightPercent: index === 1 ? slots[0].height * 100 : slot.height * 100,
        sortOrder: slot.sortOrder,
        status: slot.status,
        active: slot.active,
      })),
    }, harness.deps),
    /ueberschneiden/,
  );
});

test('gueltige Verschiebung und Groessenaenderung werden gespeichert und erhoehen die layoutVersion', async () => {
  const harness = await seedBannersAndSlots();
  const [bannerBefore] = await harness.store.runTransaction((transaction) => transaction.listBanners('wacken-2027'));
  const slotsBefore = await harness.store.runTransaction((transaction) => transaction.listSlotsByBanner('wacken-2027', bannerBefore.id));
  const first = slotsBefore[0];

  const result = await saveEventSponsoringBannerLayoutForAdmin({
    eventId: 'wacken-2027',
    bannerId: bannerBefore.id,
    baseLayoutVersion: bannerBefore.layoutVersion,
    slots: slotsBefore.map((slot) => ({
      id: slot.id,
      slotCode: slot.slotCode,
      displayLabel: slot.displayLabel,
      packageSize: slot.id === first.id ? 'medium' : slot.packageSize,
      xPercent: slot.id === first.id ? 8 : slot.x * 100,
      yPercent: slot.id === first.id ? 10 : slot.y * 100,
      widthPercent: slot.id === first.id ? 32 : slot.width * 100,
      heightPercent: slot.id === first.id ? 18 : slot.height * 100,
      sortOrder: slot.sortOrder,
      status: slot.status,
      active: slot.active,
    })),
  }, harness.deps);

  const bannerAfter = await harness.store.runTransaction((transaction) => transaction.getBanner(bannerBefore.id));
  const slotsAfter = await harness.store.runTransaction((transaction) => transaction.listSlotsByBanner('wacken-2027', bannerBefore.id));
  const updated = slotsAfter.find((slot) => slot.id === first.id);

  assert.equal(result.nextLayoutVersion, bannerBefore.layoutVersion + 1);
  assert.equal(bannerAfter?.layoutVersion, bannerBefore.layoutVersion + 1);
  assert.equal(updated?.x, 0.08);
  assert.equal(updated?.width, 0.32);
  assert.equal(updated?.packageSize, 'medium');
});

test('veraltete layoutVersion verhindert Ueberschreiben', async () => {
  const harness = await seedBannersAndSlots();
  const [banner] = await harness.store.runTransaction((transaction) => transaction.listBanners('wacken-2027'));
  const slots = await harness.store.runTransaction((transaction) => transaction.listSlotsByBanner('wacken-2027', banner.id));

  await assert.rejects(
    () => saveEventSponsoringBannerLayoutForAdmin({
      eventId: 'wacken-2027',
      bannerId: banner.id,
      baseLayoutVersion: banner.layoutVersion - 1,
      slots: slots.map((slot) => ({ id: slot.id, slotCode: slot.slotCode, displayLabel: slot.displayLabel, packageSize: slot.packageSize, xPercent: slot.x * 100, yPercent: slot.y * 100, widthPercent: slot.width * 100, heightPercent: slot.height * 100, sortOrder: slot.sortOrder, status: slot.status, active: slot.active })),
    }, harness.deps),
    /zwischenzeitlich geaendert/,
  );
});

test('zugewiesene Position kann nicht veraendert oder geloescht werden', async () => {
  const harness = await seedBannersAndSlots();
  const [banner] = await harness.store.runTransaction((transaction) => transaction.listBanners('wacken-2027'));
  const slots = await harness.store.runTransaction((transaction) => transaction.listSlotsByBanner('wacken-2027', banner.id));
  const assigned = { ...slots[0], status: 'assigned' as const, bookingId: 'booking-1' };
  const booking = normalizeEventSponsoringBooking({
    id: 'booking-1',
    eventId: 'wacken-2027',
    packageId: 'wacken-2027--small_logo',
    packageKind: 'small_logo',
    bookingType: 'paid_logo',
    slotSize: 'small',
    contactName: 'Erika',
    email: 'erika@example.com',
    priceCents: 100,
    currencyCode: 'EUR',
    status: 'slot_assigned',
    selectedSlotId: assigned.id,
    publicDisplayEnabled: true,
    anonymousSupport: false,
  }, { now: NOW });

  await harness.store.runTransaction(async (transaction) => {
    await transaction.saveSlot(assigned);
    await transaction.saveBooking(booking);
  });

  const currentSlots = await harness.store.runTransaction((transaction) => transaction.listSlotsByBanner('wacken-2027', banner.id));

  await assert.rejects(
    () => saveEventSponsoringBannerLayoutForAdmin({
      eventId: 'wacken-2027',
      bannerId: banner.id,
      baseLayoutVersion: banner.layoutVersion,
      slots: currentSlots.map((slot) => ({
        id: slot.id,
        slotCode: slot.slotCode,
        displayLabel: slot.displayLabel,
        packageSize: slot.packageSize,
        xPercent: slot.id === assigned.id ? 10 : slot.x * 100,
        yPercent: slot.y * 100,
        widthPercent: slot.width * 100,
        heightPercent: slot.height * 100,
        sortOrder: slot.sortOrder,
        status: slot.status,
        active: slot.active,
      })),
    }, harness.deps),
    /darf nicht veraendert werden/,
  );

  await assert.rejects(
    () => saveEventSponsoringBannerLayoutForAdmin({
      eventId: 'wacken-2027',
      bannerId: banner.id,
      baseLayoutVersion: banner.layoutVersion,
      slots: currentSlots.filter((slot) => slot.id !== assigned.id).map((slot) => ({ id: slot.id, slotCode: slot.slotCode, displayLabel: slot.displayLabel, packageSize: slot.packageSize, xPercent: slot.x * 100, yPercent: slot.y * 100, widthPercent: slot.width * 100, heightPercent: slot.height * 100, sortOrder: slot.sortOrder, status: slot.status, active: slot.active })),
    }, harness.deps),
    /kann nicht entfernt werden/,
  );
});

test('freie Position kann physisch entfernt werden', async () => {
  const harness = await seedBannersAndSlots();
  const [banner] = await harness.store.runTransaction((transaction) => transaction.listBanners('wacken-2027'));
  const slots = await harness.store.runTransaction((transaction) => transaction.listSlotsByBanner('wacken-2027', banner.id));

  await saveEventSponsoringBannerLayoutForAdmin({
    eventId: 'wacken-2027',
    bannerId: banner.id,
    baseLayoutVersion: banner.layoutVersion,
    slots: slots.slice(1).map((slot) => ({ id: slot.id, slotCode: slot.slotCode, displayLabel: slot.displayLabel, packageSize: slot.packageSize, xPercent: slot.x * 100, yPercent: slot.y * 100, widthPercent: slot.width * 100, heightPercent: slot.height * 100, sortOrder: slot.sortOrder, status: slot.status, active: slot.active })),
  }, harness.deps);

  const remaining = await harness.store.runTransaction((transaction) => transaction.listSlotsByBanner('wacken-2027', banner.id));
  assert.equal(remaining.length, slots.length - 1);
});

test('nicht autorisierte Aktionen sowie Banner anderer Veranstaltungen werden abgewiesen', async () => {
  const unauthorized = createAdminDeps({ unauthorized: true });
  await assert.rejects(() => ensureDefaultEventSponsoringBannersForAdmin({ eventId: 'wacken-2027' }, unauthorized.deps), /Nicht autorisiert/);

  const harness = await seedBannersAndSlots();
  const otherBanner = buildDefaultEventSponsoringBanners('other-event', NOW)[0];
  await harness.store.runTransaction(async (transaction) => {
    await transaction.saveBanner(otherBanner);
  });

  await assert.rejects(
    () => saveEventSponsoringBannerLayoutForAdmin({ eventId: 'wacken-2027', bannerId: otherBanner.id, baseLayoutVersion: otherBanner.layoutVersion, slots: [] }, harness.deps),
    /gehoert nicht zu dieser Veranstaltung/,
  );
});

test('Kapazitaetsanzeige behandelt blockierte, deaktivierte, zugewiesene und freie Positionen korrekt', async () => {
  const harness = await seedBannersAndSlots();
  const packages = buildDefaultEventSponsoringPackages('wacken-2027', NOW);
  const slots = await harness.store.runTransaction((transaction) => transaction.listSlotsByEvent('wacken-2027'));
  const adjusted = [
    { ...slots[0], status: 'blocked' as const },
    { ...slots[1], active: false },
    { ...slots[2], status: 'assigned' as const, bookingId: 'booking-1' },
    ...slots.slice(3),
  ];
  const booking = normalizeEventSponsoringBooking({
    id: 'booking-1',
    eventId: 'wacken-2027',
    packageId: 'wacken-2027--medium_logo',
    packageKind: 'medium_logo',
    bookingType: 'paid_logo',
    slotSize: 'medium',
    contactName: 'Erika',
    email: 'erika@example.com',
    priceCents: 100,
    currencyCode: 'EUR',
    status: 'slot_assigned',
    selectedSlotId: adjusted[2].id,
    publicDisplayEnabled: true,
    anonymousSupport: false,
  }, { now: NOW });
  const summary = buildEventSponsoringCapacitySummary(packages, adjusted, [booking]);

  assert.equal(summary.find((row) => row.size === 'medium')?.assigned, 1);
  assert.equal(summary.find((row) => row.size === 'large')?.blocked, 1);
  assert.equal(summary.find((row) => row.size === 'small')?.sellable! > 0, true);
});

test('Warnung fuer aktive Pakete ohne passende Position funktioniert', () => {
  const packages = buildDefaultEventSponsoringPackages('wacken-2027', NOW);
  const warnings = getActiveBannerSlotWarnings(packages, []);

  assert.equal(warnings.length, 3);
});
