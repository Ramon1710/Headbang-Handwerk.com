import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeEvent } from '@/lib/event-stand';
import {
  buildEventSponsoringPublicPageView,
  resolveEventSponsoringPublicAccess,
} from '@/lib/event-sponsoring/public';
import {
  normalizeEventSponsoringConfigDocument,
  normalizeEventSponsoringPackageDocument,
} from '@/lib/event-sponsoring/store';
import { normalizeEventSponsoringConfig, normalizeEventSponsoringPackage } from '@/lib/event-sponsoring/validation';
import { getEventSponsoringHref, getEventStandHref, resolveEventDetailHref } from '@/lib/site';
import type { Event } from '@/lib/types';

const NOW = '2026-09-18T18:00:00.000Z';

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

function buildConfig(overrides: Partial<ReturnType<typeof normalizeEventSponsoringConfig>> = {}) {
  return normalizeEventSponsoringConfig({
    eventId: 'wacken-2027',
    enabled: true,
    publicTitle: 'Sponsoring beim Wacken 2027',
    publicDescription: 'Unterstützt den Auftritt von Headbang Handwerk auf dem Festival.',
    currencyCode: 'EUR',
    anonymousSupportEnabled: true,
    anonymousMinimumAmountCents: 2500,
    customSponsoringEnabled: true,
    showOccupiedLogosPublicly: true,
    ...overrides,
  }, { now: NOW });
}

function buildPackage(kind: 'small_logo' | 'medium_logo' | 'large_logo' | 'custom_request' | 'anonymous_support', overrides: Partial<ReturnType<typeof normalizeEventSponsoringPackage>> = {}) {
  const definition = {
    small_logo: { id: 'small', name: 'Kleines Logo', priceCents: 25000, sortOrder: 10, grantsBannerPlacement: true, logoSlotSize: 'small', isPaidOnline: true },
    medium_logo: { id: 'medium', name: 'Mittleres Logo', priceCents: 50000, sortOrder: 20, grantsBannerPlacement: true, logoSlotSize: 'medium', isPaidOnline: true },
    large_logo: { id: 'large', name: 'Großes Logo', priceCents: 100000, sortOrder: 30, grantsBannerPlacement: true, logoSlotSize: 'large', isPaidOnline: true },
    custom_request: { id: 'custom', name: 'Individuelles Sponsoring', priceCents: 0, sortOrder: 40, grantsBannerPlacement: false, logoSlotSize: 'none', isPaidOnline: false },
    anonymous_support: { id: 'anonymous', name: 'Anonyme Unterstützung', priceCents: 0, sortOrder: 50, grantsBannerPlacement: false, logoSlotSize: 'none', isPaidOnline: true },
  }[kind];

  return normalizeEventSponsoringPackage({
    id: `wacken-2027--${definition.id}`,
    eventId: 'wacken-2027',
    name: definition.name,
    kind,
    description: `${definition.name} Beschreibung`,
    features: [`Feature ${definition.name}`],
    priceCents: definition.priceCents,
    currencyCode: 'EUR',
    active: true,
    sortOrder: definition.sortOrder,
    grantsBannerPlacement: definition.grantsBannerPlacement,
    logoSlotSize: definition.logoSlotSize,
    isPaidOnline: definition.isPaidOnline,
    ...overrides,
  }, { now: NOW });
}

test('none, stand3d und sponsoring2d werden zentral in Detail-Links aufgeloest', () => {
  assert.equal(resolveEventDetailHref(buildEvent({ detailViewMode: 'none' })), null);
  assert.equal(resolveEventDetailHref(buildEvent({ detailViewMode: 'stand3d', standEnabled: true })), getEventStandHref('wacken-2027'));
  assert.equal(resolveEventDetailHref(buildEvent({ detailViewMode: 'sponsoring2d' })), getEventSponsoringHref('wacken-2027'));
  assert.equal(resolveEventDetailHref(buildEvent({ detailViewMode: undefined, standEnabled: true })), getEventStandHref('wacken-2027'));
});

test('EventCard ist zentral an den Detail-Resolver angebunden statt fest an den 3D-Stand', () => {
  const source = readFileSync(new URL('../components/event-card.tsx', import.meta.url), 'utf8');

  assert.match(source, /resolveEventDetailHref/);
  assert.match(source, /const detailHref = resolveEventDetailHref\(event\);/);
  assert.doesNotMatch(source, /const standHref = getEventStandHref\(event\.id\);/);
});

test('oeffentlicher Zugriff verlangt Eventmodus sponsoring2d, Konfiguration und aktive Pakete', () => {
  const event = buildEvent();
  const config = buildConfig();
  const packages = [buildPackage('small_logo')];

  assert.equal(resolveEventSponsoringPublicAccess({ event, config, packages, isAdmin: false }).allowed, true);
  assert.deepEqual(resolveEventSponsoringPublicAccess({ event: buildEvent({ detailViewMode: 'stand3d' }), config, packages, isAdmin: false }), { allowed: false, reason: 'wrong-mode' });
  assert.deepEqual(resolveEventSponsoringPublicAccess({ event, config: null, packages, isAdmin: false }), { allowed: false, reason: 'missing-config' });
  assert.deepEqual(resolveEventSponsoringPublicAccess({ event, config: buildConfig({ enabled: false }), packages, isAdmin: false }), { allowed: false, reason: 'disabled-config' });
  assert.deepEqual(resolveEventSponsoringPublicAccess({ event, config, packages: [], isAdmin: false }), { allowed: false, reason: 'missing-packages' });
});

test('Admin kann deaktivierte Sponsoringseite als Vorschau sehen', () => {
  const access = resolveEventSponsoringPublicAccess({
    event: buildEvent(),
    config: buildConfig({ enabled: false }),
    packages: [buildPackage('small_logo')],
    isAdmin: true,
  });

  assert.deepEqual(access, { allowed: true, isAdminPreview: true, reason: 'disabled-config' });
});

test('oeffentliches View-Model zeigt nur aktive Pakete sortiert und formatiert Preise deutsch', () => {
  const view = buildEventSponsoringPublicPageView({
    event: buildEvent(),
    config: buildConfig(),
    packages: [buildPackage('large_logo'), buildPackage('small_logo'), buildPackage('medium_logo', { active: false }), buildPackage('custom_request'), buildPackage('anonymous_support')],
    isAdminPreview: false,
  });

  assert.deepEqual(view.packages.map((pkg) => pkg.kind), ['small_logo', 'large_logo', 'custom_request', 'anonymous_support']);
  assert.equal(view.packages[0].priceLabel, '250,00 €');
  assert.match(view.packages[0].actionHref || '', /\/veranstaltungen\/wacken-2027\/sponsoring\/anfrage\?package=/);
  assert.equal(Array.isArray((view as { banners?: unknown }).banners), false);
  assert.equal('createdAt' in view.packages[0], false);
  assert.equal('updatedAt' in view.packages[0], false);
});

test('Weiterer Ablauf und anonyme Mindestbetraege werden fuer den Anfragefluss abgebildet', () => {
  const view = buildEventSponsoringPublicPageView({
    event: buildEvent(),
    config: buildConfig(),
    packages: [buildPackage('small_logo'), buildPackage('anonymous_support')],
    isAdminPreview: false,
  });

  assert.deepEqual(view.processSteps, [
    'Paket auswählen und Anfrageformular ausfüllen',
    'Firmen- und Rechnungsdaten sowie optional das Logo hochladen',
    'Headbang Handwerk prüft die Anfrage und meldet sich per E-Mail',
    'Die Abrechnung erfolgt nach Bearbeitung manuell per Rechnung',
  ]);
  assert.equal(view.packages.find((pkg) => pkg.kind === 'anonymous_support')?.priceLabel, 'ab 25,00 €');
});

test('alte oder unvollstaendige Config- und Paketdokumente werden fuer die oeffentliche Seite kontrolliert normalisiert', () => {
  const config = normalizeEventSponsoringConfigDocument('legacy-event', {
    enabled: true,
  });

  const pkg = normalizeEventSponsoringPackageDocument('legacy-package', {
    eventId: 'legacy-event',
    name: 'Legacy Paket',
    kind: 'small_logo',
    active: true,
    grantsBannerPlacement: true,
    logoSlotSize: 'small',
  });

  assert.equal(config.publicTitle, 'Veranstaltungs-Sponsoring');
  assert.equal(config.publicDescription, 'Weitere Informationen folgen.');
  assert.deepEqual(pkg.features, []);
  assert.equal(pkg.description, 'Weitere Informationen folgen.');
  assert.equal(pkg.sortOrder, 0);
  assert.equal(pkg.priceCents, 0);
});

test('oeffentliches View-Model rendert Legacy-Pakete ohne Features oder Beschreibung kontrolliert', () => {
  const view = buildEventSponsoringPublicPageView({
    event: buildEvent(),
    config: normalizeEventSponsoringConfigDocument('wacken-2027', {
      enabled: true,
    }),
    packages: [normalizeEventSponsoringPackageDocument('legacy-package', {
      eventId: 'wacken-2027',
      name: 'Legacy Paket',
      kind: 'small_logo',
      active: true,
      grantsBannerPlacement: true,
      logoSlotSize: 'small',
    })],
    isAdminPreview: false,
  });

  assert.equal(view.packages[0].description, 'Weitere Informationen folgen.');
  assert.deepEqual(view.packages[0].features, []);
  assert.equal(view.packages[0].priceLabel, 'Preis auf Anfrage');
});

test('die öffentliche UI verweist nicht mehr auf Stripe oder Bannerdarstellungen', () => {
  const source = readFileSync(new URL('../components/event-sponsoring-public-page.tsx', import.meta.url), 'utf8');

  assert.doesNotMatch(source, /Stripe/);
  assert.doesNotMatch(source, /Bannerflächen/);
  assert.match(source, /Anfrage absenden|Pakete für Sponsoringanfragen|manuell per Rechnung/);
});

test('fehlende oder nicht veroeffentlichte Angebote fuehren zu einer sichtbaren Reaktion statt zu einer weissen Default-404', () => {
  const source = readFileSync(new URL('../app/veranstaltungen/[eventId]/sponsoring/not-found.tsx', import.meta.url), 'utf8');

  assert.match(source, /Die Sponsoringangebote konnten momentan nicht geladen werden/);
  assert.match(source, /Zurueck zu den Veranstaltungen/);
  assert.match(source, /Erneut laden/);
});

test('unerwartete Laufzeitfehler haben in der Sponsoringroute eine sichtbare Error Boundary', () => {
  const source = readFileSync(new URL('../app/veranstaltungen/[eventId]/sponsoring/error.tsx', import.meta.url), 'utf8');

  assert.match(source, /Die Sponsoringangebote konnten momentan nicht geladen werden/);
  assert.match(source, /reset/);
  assert.match(source, /Zurueck zu den Veranstaltungen/);
});

test('die Sponsoringroute enthaelt keine Redirect-Schleife', () => {
  const source = readFileSync(new URL('../app/veranstaltungen/[eventId]/sponsoring/page.tsx', import.meta.url), 'utf8');

  assert.doesNotMatch(source, /redirect\(/);
  assert.match(source, /notFound\(/);
});