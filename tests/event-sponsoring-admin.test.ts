import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeEvent } from '@/lib/event-stand';
import {
  buildDefaultEventSponsoringPackages,
  buildEventSponsoringConfigDraft,
  ensureDefaultEventSponsoringPackagesForAdmin,
  getEventSponsoringPackageKindInvariants,
  parseOrderedFeatureList,
  saveEventDetailViewModeForAdmin,
  saveEventSponsoringConfigForAdmin,
  saveEventSponsoringPackageForAdmin,
} from '@/lib/event-sponsoring/admin';
import { createInMemoryEventSponsoringStore } from '@/lib/event-sponsoring/store';
import { formatEuroCentsForInput, parseEuroAmountToCents } from '@/lib/event-sponsoring/money';
import type { Event, SponsorPackage } from '@/lib/types';

const NOW = '2026-09-18T15:00:00.000Z';

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
    detailViewMode: 'none',
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

function createAdminDeps(options?: { unauthorized?: boolean; initialEvent?: Event; sponsorPackages?: SponsorPackage[] }) {
  const store = createInMemoryEventSponsoringStore();
  const cms = {
    event: options?.initialEvent || buildEvent(),
    sponsorPackages: options?.sponsorPackages || [{
      id: 'general-1',
      name: 'Allgemein',
      price: 100,
      features: ['Allgemein'],
      visibility: 'hoch',
      logoSize: 'mittel',
      placement: 'allgemein',
      highlighted: false,
    }],
  };

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
      saveEvent: async (event: Event) => {
        cms.event = event;
      },
    },
  };
}

test('alte Events ohne detailViewMode werden mit standEnabled=true auf stand3d normalisiert', () => {
  const normalized = normalizeEvent(buildEvent({ detailViewMode: undefined, standEnabled: true }));

  assert.equal(normalized.detailViewMode, 'stand3d');
  assert.equal(normalized.standEnabled, true);
});

test('alte Events ohne detailViewMode werden mit standEnabled=false auf none normalisiert', () => {
  const normalized = normalizeEvent(buildEvent({ detailViewMode: undefined, standEnabled: false }));

  assert.equal(normalized.detailViewMode, 'none');
  assert.equal(normalized.standEnabled, false);
});

test('detailViewMode none, stand3d und sponsoring2d werden gespeichert', async () => {
  const harness = createAdminDeps();

  await saveEventDetailViewModeForAdmin({ eventId: 'wacken-2027', detailViewMode: 'none' }, harness.deps);
  assert.equal(harness.cms.event.detailViewMode, 'none');
  assert.equal(harness.cms.event.standEnabled, false);

  await saveEventDetailViewModeForAdmin({ eventId: 'wacken-2027', detailViewMode: 'stand3d' }, harness.deps);
  assert.equal(harness.cms.event.detailViewMode, 'stand3d');
  assert.equal(harness.cms.event.standEnabled, true);

  await saveEventDetailViewModeForAdmin({ eventId: 'wacken-2027', detailViewMode: 'sponsoring2d' }, harness.deps);
  assert.equal(harness.cms.event.detailViewMode, 'sponsoring2d');
  assert.equal(harness.cms.event.standEnabled, false);
});

test('nicht autorisierte Adminaktionen werden abgewiesen', async () => {
  const harness = createAdminDeps({ unauthorized: true });

  await assert.rejects(
    () => saveEventDetailViewModeForAdmin({ eventId: 'wacken-2027', detailViewMode: 'stand3d' }, harness.deps),
    /Nicht autorisiert/,
  );
});

test('ungueltige eventId wird in Adminaktionen abgewiesen', async () => {
  const harness = createAdminDeps();

  await assert.rejects(
    () => saveEventSponsoringConfigForAdmin({
      eventId: 'unknown',
      enabled: true,
      publicTitle: 'Titel',
      publicDescription: 'Beschreibung',
      currencyCode: 'EUR',
      anonymousSupportEnabled: true,
      anonymousMinimumAmountEuro: '25,00',
      customSponsoringEnabled: true,
      showOccupiedLogosPublicly: true,
    }, harness.deps),
    /nicht gefunden/,
  );
});

test('Standardpakete werden vollstaendig und idempotent angelegt', async () => {
  const harness = createAdminDeps();

  const first = await ensureDefaultEventSponsoringPackagesForAdmin({ eventId: 'wacken-2027' }, harness.deps);
  const second = await ensureDefaultEventSponsoringPackagesForAdmin({ eventId: 'wacken-2027' }, harness.deps);
  const packages = await harness.store.runTransaction((transaction) => transaction.listPackages('wacken-2027'));

  assert.equal(first.createdKinds.length, 5);
  assert.equal(second.createdKinds.length, 0);
  assert.equal(packages.length, 5);
});

test('teilweise vorhandene Standardpakete werden nur fehlend ergaenzt', async () => {
  const harness = createAdminDeps();
  const defaults = buildDefaultEventSponsoringPackages('wacken-2027', NOW);

  await harness.store.runTransaction(async (transaction) => {
    await transaction.savePackage(defaults[0]);
    await transaction.savePackage(defaults[3]);
  });

  const result = await ensureDefaultEventSponsoringPackagesForAdmin({ eventId: 'wacken-2027' }, harness.deps);
  const packages = await harness.store.runTransaction((transaction) => transaction.listPackages('wacken-2027'));

  assert.deepEqual(result.createdKinds, ['medium_logo', 'large_logo', 'anonymous_support']);
  assert.equal(packages.length, 5);
});

test('Paketart erzwingt Slotgroesse, Bannerberechtigung und den Anfragefluss serverseitig', async () => {
  const harness = createAdminDeps();

  await ensureDefaultEventSponsoringPackagesForAdmin({ eventId: 'wacken-2027' }, harness.deps);
  const packagesBefore = await harness.store.runTransaction((transaction) => transaction.listPackages('wacken-2027'));
  const custom = packagesBefore.find((entry) => entry.kind === 'custom_request');

  assert.ok(custom);

  await saveEventSponsoringPackageForAdmin({
    eventId: 'wacken-2027',
    packageId: custom!.id,
    name: 'Neu',
    description: 'Neu beschrieben',
    featuresText: 'Eigene Aktion\nStandbauhilfe',
    priceEuro: '0',
    active: true,
    sortOrder: '44',
  }, harness.deps);

  const packagesAfter = await harness.store.runTransaction((transaction) => transaction.listPackages('wacken-2027'));
  const updated = packagesAfter.find((entry) => entry.id === custom!.id);
  const invariants = getEventSponsoringPackageKindInvariants('custom_request');

  assert.equal(updated?.logoSlotSize, invariants.logoSlotSize);
  assert.equal(updated?.grantsBannerPlacement, invariants.grantsBannerPlacement);
  assert.equal(updated?.isPaidOnline, invariants.isPaidOnline);
});

test('Euro-zu-Cent-Umwandlung akzeptiert ganze, Komma- und Punktwerte', () => {
  assert.equal(parseEuroAmountToCents('250', 'Preis'), 25_000);
  assert.equal(parseEuroAmountToCents('250,00', 'Preis'), 25_000);
  assert.equal(parseEuroAmountToCents('250.00', 'Preis'), 25_000);
  assert.equal(formatEuroCentsForInput(25_000), '250,00');
});

test('negative, ungueltige und zu genaue Preise werden abgelehnt', () => {
  assert.throws(() => parseEuroAmountToCents('-1', 'Preis'), /gueltiger Eurobetrag|negativ/);
  assert.throws(() => parseEuroAmountToCents('abc', 'Preis'), /gueltiger Eurobetrag/);
  assert.throws(() => parseEuroAmountToCents('10,999', 'Preis'), /hoechstens zwei Nachkommastellen/);
});

test('Logopakete mit 0 Euro werden abgelehnt, custom_request und anonymous_support mit 0 Euro sind zulaessig', async () => {
  const harness = createAdminDeps();
  await ensureDefaultEventSponsoringPackagesForAdmin({ eventId: 'wacken-2027' }, harness.deps);
  const packages = await harness.store.runTransaction((transaction) => transaction.listPackages('wacken-2027'));
  const smallLogo = packages.find((entry) => entry.kind === 'small_logo');
  const custom = packages.find((entry) => entry.kind === 'custom_request');
  const anonymous = packages.find((entry) => entry.kind === 'anonymous_support');

  await assert.rejects(
    () => saveEventSponsoringPackageForAdmin({
      eventId: 'wacken-2027',
      packageId: smallLogo!.id,
      name: smallLogo!.name,
      description: smallLogo!.description,
      featuresText: smallLogo!.features.join('\n'),
      priceEuro: '0',
      active: true,
      sortOrder: '10',
    }, harness.deps),
    /groesser als 0/,
  );

  await assert.doesNotReject(() => saveEventSponsoringPackageForAdmin({
    eventId: 'wacken-2027',
    packageId: custom!.id,
    name: custom!.name,
    description: custom!.description,
    featuresText: custom!.features.join('\n'),
    priceEuro: '0',
    active: true,
    sortOrder: '40',
  }, harness.deps));

  await assert.doesNotReject(() => saveEventSponsoringPackageForAdmin({
    eventId: 'wacken-2027',
    packageId: anonymous!.id,
    name: anonymous!.name,
    description: anonymous!.description,
    featuresText: anonymous!.features.join('\n'),
    priceEuro: '0',
    active: true,
    sortOrder: '50',
  }, harness.deps));
});

test('Mindestbetrag wird korrekt validiert und gespeichert', async () => {
  const harness = createAdminDeps();

  await assert.rejects(
    () => saveEventSponsoringConfigForAdmin({
      eventId: 'wacken-2027',
      enabled: true,
      publicTitle: 'Titel',
      publicDescription: 'Beschreibung',
      currencyCode: 'EUR',
      anonymousSupportEnabled: true,
      anonymousMinimumAmountEuro: '0',
      customSponsoringEnabled: true,
      showOccupiedLogosPublicly: true,
    }, harness.deps),
    /groesser als 0/,
  );

  const saved = await saveEventSponsoringConfigForAdmin({
    eventId: 'wacken-2027',
    enabled: true,
    publicTitle: 'Titel',
    publicDescription: 'Beschreibung',
    currencyCode: 'EUR',
    anonymousSupportEnabled: true,
    anonymousMinimumAmountEuro: '25,00',
    customSponsoringEnabled: true,
    showOccupiedLogosPublicly: true,
  }, harness.deps);

  assert.equal(saved.anonymousMinimumAmountCents, 2500);
});

test('allgemeine Sponsorenpakete bleiben unveraendert', async () => {
  const sponsorPackages: SponsorPackage[] = [{
    id: 'general-1',
    name: 'Allgemein',
    price: 100,
    features: ['Allgemein'],
    visibility: 'hoch',
    logoSize: 'mittel',
    placement: 'allgemein',
    highlighted: false,
  }];
  const harness = createAdminDeps({ sponsorPackages });

  await saveEventDetailViewModeForAdmin({ eventId: 'wacken-2027', detailViewMode: 'sponsoring2d' }, harness.deps);
  await ensureDefaultEventSponsoringPackagesForAdmin({ eventId: 'wacken-2027' }, harness.deps);

  assert.deepEqual(harness.cms.sponsorPackages, sponsorPackages);
});

test('Entwurfswerte fuer neue Konfiguration werden kontrolliert vorbelegt', () => {
  const draft = buildEventSponsoringConfigDraft('wacken-2027', null, NOW);

  assert.equal(draft.enabled, false);
  assert.equal(draft.currencyCode, 'EUR');
  assert.equal(draft.anonymousSupportEnabled, true);
  assert.equal(draft.anonymousMinimumAmountCents, 2500);
  assert.equal(draft.customSponsoringEnabled, true);
  assert.equal(draft.showOccupiedLogosPublicly, true);
});

test('Leistungslisten bleiben geordnet und leere Zeilen werden entfernt', () => {
  assert.deepEqual(parseOrderedFeatureList('Punkt 1\n\nPunkt 2\n'), ['Punkt 1', 'Punkt 2']);
});
