import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeEvent } from '@/lib/event-stand';
import {
  buildEventSponsoringPublicPageView,
  resolveEventSponsoringPublicAccess,
} from '@/lib/event-sponsoring/public';
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

test('die öffentliche UI verweist nicht mehr auf Stripe oder Bannerdarstellungen', () => {
  const source = readFileSync(new URL('../components/event-sponsoring-public-page.tsx', import.meta.url), 'utf8');

  assert.doesNotMatch(source, /Stripe/);
  assert.doesNotMatch(source, /Bannerflächen/);
  assert.match(source, /Anfrage absenden|Pakete für Sponsoringanfragen|manuell per Rechnung/);
});