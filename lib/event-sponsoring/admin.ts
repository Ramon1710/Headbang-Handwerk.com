import { normalizeEvent } from '@/lib/event-stand';
import { type EventDetailViewMode, normalizeEventDetailViewMode } from '@/lib/events';
import {
  DEFAULT_EVENT_SPONSORING_BANNER_HEIGHT_MM,
  DEFAULT_EVENT_SPONSORING_BANNER_WIDTH_MM,
  DEFAULT_EVENT_SPONSORING_CURRENCY_CODE,
} from '@/lib/event-sponsoring/schema';
import type { EventSponsoringStore } from '@/lib/event-sponsoring/store';
import type {
  EventSponsoringBanner,
  EventSponsoringBooking,
  EventSponsoringConfig,
  EventSponsoringPackage,
  EventSponsoringPackageKind,
  EventSponsoringSlot,
  EventSponsoringSlotSize,
} from '@/lib/event-sponsoring/types';
import { parseEuroAmountToCents } from '@/lib/event-sponsoring/money';
import {
  getExpectedLogoSlotSizeForPackageKind,
  normalizeEventSponsoringConfig,
  normalizeEventSponsoringPackage,
  normalizeEventSponsoringBanner,
  normalizeEventSponsoringSlot,
} from '@/lib/event-sponsoring/validation';
import type { Event } from '@/lib/types';
import { findOverlappingActiveSlots, getSellableCapacityBySize, getSlotStatusBreakdownBySize } from '@/lib/event-sponsoring/capacity';

export const EVENT_SPONSORING_ADMIN_DEFAULTS = {
  enabled: false,
  currencyCode: DEFAULT_EVENT_SPONSORING_CURRENCY_CODE,
  anonymousSupportEnabled: true,
  anonymousMinimumAmountCents: 2500,
  customSponsoringEnabled: true,
  showOccupiedLogosPublicly: true,
} as const;

export const EVENT_SPONSORING_PACKAGE_KIND_ORDER: EventSponsoringPackageKind[] = [
  'small_logo',
  'medium_logo',
  'large_logo',
  'custom_request',
  'anonymous_support',
];

export const EVENT_SPONSORING_BANNER_ORDER = [1, 2] as const;

function isLogoPackageKind(kind: EventSponsoringPackageKind) {
  return kind === 'small_logo' || kind === 'medium_logo' || kind === 'large_logo';
}

function sanitizeText(input: unknown) {
  return String(input ?? '').trim();
}

function sanitizeCode(input: unknown) {
  return sanitizeText(input)
    .toUpperCase()
    .replace(/[^A-Z0-9-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
}

function roundNormalized(value: number) {
  return Math.round(value * 10_000) / 10_000;
}

function normalizePercentNumber(input: unknown, label: string) {
  const numeric = typeof input === 'number' ? input : Number(String(input ?? '').trim());

  if (!Number.isFinite(numeric)) {
    throw new Error(`${label} ist ungueltig.`);
  }

  const normalized = numeric / 100;

  if (Math.abs(normalized - roundNormalized(normalized)) > 0.0000001) {
    throw new Error(`${label} darf hoechstens zwei Nachkommastellen in Prozent enthalten.`);
  }

  return roundNormalized(normalized);
}

function parseSortOrder(input: unknown) {
  const value = Number.parseInt(sanitizeText(input), 10);

  if (!Number.isInteger(value) || value < 0) {
    throw new Error('Die Sortierreihenfolge muss eine nicht-negative ganze Zahl sein.');
  }

  return value;
}

export function parseOrderedFeatureList(input: unknown) {
  return String(input ?? '')
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function getEventSponsoringPackageId(eventId: string, kind: EventSponsoringPackageKind) {
  return `${eventId}--${kind}`;
}

export function getEventSponsoringBannerId(eventId: string, order: (typeof EVENT_SPONSORING_BANNER_ORDER)[number]) {
  return `${eventId}--banner-${order}`;
}

export function getEventSponsoringBannerCodePrefix(bannerSortOrder: number) {
  return bannerSortOrder <= 10 ? 'B1' : 'B2';
}

export function getEventSponsoringPackageKindInvariants(kind: EventSponsoringPackageKind) {
  return {
    logoSlotSize: getExpectedLogoSlotSizeForPackageKind(kind),
    grantsBannerPlacement: isLogoPackageKind(kind),
    isPaidOnline: false,
  } as const;
}

export function buildEventSponsoringConfigDraft(eventId: string, existing?: EventSponsoringConfig | null, now?: string) {
  return normalizeEventSponsoringConfig(
    {
      eventId,
      publicTitle: existing?.publicTitle || 'Sponsoring',
      publicDescription: existing?.publicDescription || 'Unterstützt diese Veranstaltung mit einem Sponsoring-Paket oder einer anonymen Spende.',
      ...EVENT_SPONSORING_ADMIN_DEFAULTS,
      ...existing,
    },
    existing ? { existing, now } : { now },
  );
}

export function buildDefaultEventSponsoringPackages(eventId: string, now?: string) {
  const definitions: Array<{
    kind: EventSponsoringPackageKind;
    name: string;
    description: string;
    features: string[];
    priceCents: number;
    sortOrder: number;
  }> = [
    {
      kind: 'small_logo',
      name: 'Kleines Logo',
      description: 'Mit einem kleinen Logo auf einem unserer Veranstaltungsbanner unterstützt ihr die Umsetzung unseres Standes.',
      features: ['Kleines Logo auf einem Veranstaltungsbanner'],
      priceCents: 25_000,
      sortOrder: 10,
    },
    {
      kind: 'medium_logo',
      name: 'Mittleres Logo',
      description: 'Mit einem mittleren Logo erhaltet ihr eine deutlich sichtbare Platzierung auf einem unserer Veranstaltungsbanner.',
      features: ['Mittleres Logo auf einem Veranstaltungsbanner'],
      priceCents: 50_000,
      sortOrder: 20,
    },
    {
      kind: 'large_logo',
      name: 'Großes Logo',
      description: 'Mit einem großen Logo werdet ihr besonders hervorgehoben und leistet einen wesentlichen Beitrag zur Umsetzung unseres Veranstaltungsauftritts.',
      features: ['Großes Logo auf einem Veranstaltungsbanner'],
      priceCents: 100_000,
      sortOrder: 30,
    },
    {
      kind: 'custom_request',
      name: 'Individuelles Sponsoring',
      description: 'Unterstützt uns mit Material, beim Standbau, mit Maschinen, Personal, Transport oder einer eigenen Mitmachaktion.',
      features: ['Individuelle Unterstützung nach gemeinsamer Abstimmung'],
      priceCents: 0,
      sortOrder: 40,
    },
    {
      kind: 'anonymous_support',
      name: 'Anonyme Unterstützung',
      description: 'Unterstützt die Veranstaltung finanziell, ohne mit Namen oder Logo öffentlich dargestellt zu werden.',
      features: ['Finanzielle Unterstützung ohne öffentliche Nennung'],
      priceCents: 0,
      sortOrder: 50,
    },
  ];

  return definitions.map((definition) =>
    normalizeEventSponsoringPackage(
      {
        id: getEventSponsoringPackageId(eventId, definition.kind),
        eventId,
        name: definition.name,
        kind: definition.kind,
        description: definition.description,
        features: definition.features,
        priceCents: definition.priceCents,
        currencyCode: DEFAULT_EVENT_SPONSORING_CURRENCY_CODE,
        active: true,
        sortOrder: definition.sortOrder,
        ...getEventSponsoringPackageKindInvariants(definition.kind),
      },
      { now },
    ),
  );
}

export function buildDefaultEventSponsoringBanners(eventId: string, now?: string) {
  return EVENT_SPONSORING_BANNER_ORDER.map((order, index) =>
    normalizeEventSponsoringBanner(
      {
        id: getEventSponsoringBannerId(eventId, order),
        eventId,
        name: `Banner ${order}`,
        widthMm: DEFAULT_EVENT_SPONSORING_BANNER_WIDTH_MM,
        heightMm: DEFAULT_EVENT_SPONSORING_BANNER_HEIGHT_MM,
        sortOrder: index === 0 ? 10 : 20,
        active: true,
        layoutVersion: 1,
      },
      { now },
    ),
  );
}

function buildDefaultBannerLayoutTemplate(prefix: 'B1' | 'B2') {
  return [
    { slotCode: `${prefix}-L1`, displayLabel: 'Groß 1', packageSize: 'large' as const, x: 0.05, y: 0.08, width: 0.42, height: 0.28, sortOrder: 10 },
    { slotCode: `${prefix}-M1`, displayLabel: 'Mittel 1', packageSize: 'medium' as const, x: 0.53, y: 0.08, width: 0.18, height: 0.18, sortOrder: 20 },
    { slotCode: `${prefix}-M2`, displayLabel: 'Mittel 2', packageSize: 'medium' as const, x: 0.77, y: 0.08, width: 0.18, height: 0.18, sortOrder: 30 },
    { slotCode: `${prefix}-S1`, displayLabel: 'Klein 1', packageSize: 'small' as const, x: 0.05, y: 0.46, width: 0.24, height: 0.14, sortOrder: 40 },
    { slotCode: `${prefix}-S2`, displayLabel: 'Klein 2', packageSize: 'small' as const, x: 0.38, y: 0.46, width: 0.24, height: 0.14, sortOrder: 50 },
    { slotCode: `${prefix}-S3`, displayLabel: 'Klein 3', packageSize: 'small' as const, x: 0.71, y: 0.46, width: 0.24, height: 0.14, sortOrder: 60 },
    { slotCode: `${prefix}-S4`, displayLabel: 'Klein 4', packageSize: 'small' as const, x: 0.05, y: 0.68, width: 0.24, height: 0.14, sortOrder: 70 },
    { slotCode: `${prefix}-S5`, displayLabel: 'Klein 5', packageSize: 'small' as const, x: 0.38, y: 0.68, width: 0.24, height: 0.14, sortOrder: 80 },
    { slotCode: `${prefix}-S6`, displayLabel: 'Klein 6', packageSize: 'small' as const, x: 0.71, y: 0.68, width: 0.24, height: 0.14, sortOrder: 90 },
  ];
}

export function buildDefaultEventSponsoringSlotsForBanner(banner: EventSponsoringBanner, now?: string) {
  const prefix = getEventSponsoringBannerCodePrefix(banner.sortOrder) === 'B1' ? 'B1' : 'B2';

  return buildDefaultBannerLayoutTemplate(prefix).map((slot, index) =>
    normalizeEventSponsoringSlot(
      {
        id: `${banner.id}--slot-${index + 1}`,
        eventId: banner.eventId,
        bannerId: banner.id,
        slotCode: slot.slotCode,
        packageSize: slot.packageSize,
        x: slot.x,
        y: slot.y,
        width: slot.width,
        height: slot.height,
        sortOrder: slot.sortOrder,
        status: 'available',
        displayLabel: slot.displayLabel,
        active: true,
      },
      { now },
    ),
  );
}

function isProtectedAssignedSlot(slot: EventSponsoringSlot, bookings: EventSponsoringBooking[]) {
  if (slot.status === 'assigned' || slot.bookingId) {
    return true;
  }

  return bookings.some((booking) => booking.selectedSlotId === slot.id);
}

function assertBannerBelongsToEvent(banner: EventSponsoringBanner, eventId: string) {
  if (banner.eventId !== eventId) {
    throw new Error('Das Banner gehoert nicht zu dieser Veranstaltung.');
  }
}

function parseSlotSize(input: unknown): EventSponsoringSlotSize {
  const value = sanitizeText(input);

  if (value === 'small' || value === 'medium' || value === 'large') {
    return value;
  }

  throw new Error('Die Slotgroesse ist ungueltig.');
}

function parseSlotStatusForAdmin(input: unknown, existingSlot?: EventSponsoringSlot) {
  const value = sanitizeText(input);

  if (value === 'available' || value === 'blocked') {
    return value;
  }

  if (value === 'assigned') {
    if (existingSlot?.status === 'assigned' && existingSlot.bookingId) {
      return 'assigned';
    }

    throw new Error('Der Status assigned darf nicht manuell ohne gueltige Buchungsreferenz gesetzt werden.');
  }

  throw new Error('Der Slot-Status ist ungueltig.');
}

function areSlotsEquivalent(left: EventSponsoringSlot, right: EventSponsoringSlot) {
  return JSON.stringify({
    id: left.id,
    eventId: left.eventId,
    bannerId: left.bannerId,
    slotCode: left.slotCode,
    packageSize: left.packageSize,
    x: left.x,
    y: left.y,
    width: left.width,
    height: left.height,
    sortOrder: left.sortOrder,
    status: left.status,
    bookingId: left.bookingId,
    displayLabel: left.displayLabel,
    active: left.active,
  }) === JSON.stringify({
    id: right.id,
    eventId: right.eventId,
    bannerId: right.bannerId,
    slotCode: right.slotCode,
    packageSize: right.packageSize,
    x: right.x,
    y: right.y,
    width: right.width,
    height: right.height,
    sortOrder: right.sortOrder,
    status: right.status,
    bookingId: right.bookingId,
    displayLabel: right.displayLabel,
    active: right.active,
  });
}

function assertUniqueSlotCodesWithinEvent(nextSlots: EventSponsoringSlot[], otherEventSlots: EventSponsoringSlot[]) {
  const seenCodes = new Set(otherEventSlots.map((slot) => slot.slotCode.toUpperCase()));

  for (const slot of nextSlots) {
    const candidate = slot.slotCode.toUpperCase();

    if (seenCodes.has(candidate)) {
      throw new Error(`Der Positionscode ${slot.slotCode} ist innerhalb der Veranstaltung bereits vergeben.`);
    }

    seenCodes.add(candidate);
  }
}

function buildNextSlotDocumentId(bannerId: string, existingSlots: EventSponsoringSlot[]) {
  const used = new Set(
    existingSlots
      .map((slot) => {
        const match = slot.id.match(/--slot-(\d+)$/);
        return match ? Number.parseInt(match[1], 10) : null;
      })
      .filter((value): value is number => typeof value === 'number' && Number.isFinite(value)),
  );

  let next = 1;

  while (used.has(next)) {
    next += 1;
  }

  return `${bannerId}--slot-${next}`;
}

function parseLayoutSlotsInput(
  eventId: string,
  banner: EventSponsoringBanner,
  existingSlots: EventSponsoringSlot[],
  bookings: EventSponsoringBooking[],
  input: Array<Record<string, unknown>>,
  now?: string,
) {
  const existingById = new Map(existingSlots.map((slot) => [slot.id, slot]));
  const drafts = input.map((entry) => ({ ...entry }));
  const nextSlots: EventSponsoringSlot[] = [];
  const nextIds = new Set<string>();

  for (const draft of drafts) {
    const inputId = sanitizeText(draft.id);
    const existingSlot = inputId ? existingById.get(inputId) : undefined;
    const protectedSlot = existingSlot ? isProtectedAssignedSlot(existingSlot, bookings) : false;
    const slotId = existingSlot ? existingSlot.id : buildNextSlotDocumentId(banner.id, [...existingSlots, ...nextSlots]);

    if (nextIds.has(slotId)) {
      throw new Error('Dasselbe Positionselement wurde mehrfach uebermittelt.');
    }

    const normalized = normalizeEventSponsoringSlot(
      {
        id: slotId,
        eventId,
        bannerId: banner.id,
        slotCode: sanitizeCode(draft.slotCode),
        packageSize: parseSlotSize(draft.packageSize),
        x: normalizePercentNumber(draft.xPercent, 'X-Position'),
        y: normalizePercentNumber(draft.yPercent, 'Y-Position'),
        width: normalizePercentNumber(draft.widthPercent, 'Breite'),
        height: normalizePercentNumber(draft.heightPercent, 'Hoehe'),
        sortOrder: parseSortOrder(draft.sortOrder),
        status: parseSlotStatusForAdmin(draft.status, existingSlot),
        displayLabel: sanitizeText(draft.displayLabel),
        active: draft.active === true || draft.active === 'true' || draft.active === 'on',
        ...(existingSlot?.bookingId ? { bookingId: existingSlot.bookingId } : {}),
        createdAt: existingSlot?.createdAt,
      },
      existingSlot ? { existing: existingSlot, now } : { now },
    );

    if (protectedSlot && !areSlotsEquivalent(existingSlot!, normalized)) {
      throw new Error(`Die bereits zugewiesene Position ${existingSlot!.slotCode} darf nicht veraendert werden.`);
    }

    nextSlots.push(normalized);
    nextIds.add(slotId);
  }

  for (const existingSlot of existingSlots) {
    if (nextIds.has(existingSlot.id)) {
      continue;
    }

    if (isProtectedAssignedSlot(existingSlot, bookings)) {
      throw new Error(`Die Position ${existingSlot.slotCode} kann nicht entfernt werden, weil bereits eine Buchungsreferenz besteht.`);
    }
  }

  const overlaps = findOverlappingActiveSlots(nextSlots);

  if (overlaps.length > 0) {
    throw new Error('Aktive Slots eines Banners duerfen sich nicht ueberschneiden.');
  }

  return nextSlots;
}

export interface EventSponsoringBannerCapacitySummaryRow {
  size: EventSponsoringSlotSize;
  active: number;
  blocked: number;
  assigned: number;
  sellable: number;
  missingActiveSlotForEnabledPackage: boolean;
}

export function buildEventSponsoringCapacitySummary(packages: EventSponsoringPackage[], slots: EventSponsoringSlot[], bookings: EventSponsoringBooking[]) {
  const slotStatus = getSlotStatusBreakdownBySize(slots);
  const sellable = getSellableCapacityBySize(slots, bookings);
  const activePackageSizes = new Set(
    packages
      .filter((pkg) => pkg.active && pkg.grantsBannerPlacement && pkg.logoSlotSize !== 'none')
      .map((pkg) => pkg.logoSlotSize as EventSponsoringSlotSize),
  );

  return (['small', 'medium', 'large'] as EventSponsoringSlotSize[]).map((size) => ({
    size,
    active: slotStatus.active[size],
    blocked: slotStatus.blocked[size],
    assigned: slotStatus.assigned[size],
    sellable: sellable[size],
    missingActiveSlotForEnabledPackage: activePackageSizes.has(size) && slotStatus.active[size] === 0,
  })) satisfies EventSponsoringBannerCapacitySummaryRow[];
}

export function getActiveBannerSlotWarnings(packages: EventSponsoringPackage[], slots: EventSponsoringSlot[]) {
  const activeCounts = getSlotStatusBreakdownBySize(slots).active;

  return (['small', 'medium', 'large'] as EventSponsoringSlotSize[])
    .filter((size) => packages.some((pkg) => pkg.active && pkg.grantsBannerPlacement && pkg.logoSlotSize === size) && activeCounts[size] === 0)
    .map((size) => `Fuer das aktive Paket ${size} sind noch keine Bannerplaetze vorhanden.`);
}

interface EventSponsoringAdminDependencies {
  store: EventSponsoringStore;
  requireAdmin?: () => Promise<unknown>;
  getEventById: (eventId: string) => Promise<Event | null>;
  saveEvent?: (event: Event) => Promise<void>;
  now?: string;
}

async function assertAdmin(dependencies: EventSponsoringAdminDependencies) {
  if (dependencies.requireAdmin) {
    await dependencies.requireAdmin();
  }
}

async function assertEventExists(eventId: string, dependencies: EventSponsoringAdminDependencies) {
  const event = await dependencies.getEventById(eventId);

  if (!event) {
    throw new Error('Die Veranstaltung wurde nicht gefunden.');
  }

  return event;
}

export async function saveEventDetailViewModeForAdmin(
  input: { eventId: string; detailViewMode: EventDetailViewMode },
  dependencies: EventSponsoringAdminDependencies,
) {
  await assertAdmin(dependencies);

  if (!dependencies.saveEvent) {
    throw new Error('Die Event-Speicherung ist nicht konfiguriert.');
  }

  const event = await assertEventExists(input.eventId, dependencies);
  const normalizedEvent = normalizeEvent({
    ...event,
    detailViewMode: normalizeEventDetailViewMode(input.detailViewMode),
  });

  await dependencies.saveEvent(normalizedEvent);
  return normalizedEvent;
}

export async function saveEventSponsoringConfigForAdmin(
  input: {
    eventId: string;
    enabled: boolean;
    publicTitle: string;
    publicDescription: string;
    currencyCode: string;
    anonymousSupportEnabled: boolean;
    anonymousMinimumAmountEuro: string;
    customSponsoringEnabled: boolean;
    showOccupiedLogosPublicly: boolean;
  },
  dependencies: EventSponsoringAdminDependencies,
) {
  await assertAdmin(dependencies);
  await assertEventExists(input.eventId, dependencies);

  if (sanitizeText(input.currencyCode).toUpperCase() !== DEFAULT_EVENT_SPONSORING_CURRENCY_CODE) {
    throw new Error('Aktuell wird in der Sponsoring-Verwaltung nur EUR unterstützt.');
  }

  const existing = await dependencies.store.runTransaction((transaction) => transaction.getConfig(input.eventId));
  const draft = buildEventSponsoringConfigDraft(input.eventId, existing, dependencies.now);
  const anonymousMinimumAmountCents = input.anonymousSupportEnabled
    ? parseEuroAmountToCents(input.anonymousMinimumAmountEuro, 'Der Mindestbetrag fuer anonyme Unterstuetzung', { allowZero: false })
    : parseEuroAmountToCents(input.anonymousMinimumAmountEuro, 'Der Mindestbetrag fuer anonyme Unterstuetzung', { allowZero: true, allowEmpty: true });

  const normalized = normalizeEventSponsoringConfig(
    {
      ...draft,
      enabled: input.enabled,
      publicTitle: sanitizeText(input.publicTitle),
      publicDescription: sanitizeText(input.publicDescription),
      currencyCode: DEFAULT_EVENT_SPONSORING_CURRENCY_CODE,
      anonymousSupportEnabled: input.anonymousSupportEnabled,
      anonymousMinimumAmountCents,
      customSponsoringEnabled: input.customSponsoringEnabled,
      showOccupiedLogosPublicly: input.showOccupiedLogosPublicly,
    },
    existing ? { existing, now: dependencies.now } : { now: dependencies.now },
  );

  await dependencies.store.runTransaction(async (transaction) => {
    await transaction.saveConfig(normalized);
  });

  return normalized;
}

export async function ensureDefaultEventSponsoringPackagesForAdmin(
  input: { eventId: string },
  dependencies: EventSponsoringAdminDependencies,
) {
  await assertAdmin(dependencies);
  await assertEventExists(input.eventId, dependencies);

  const defaults = buildDefaultEventSponsoringPackages(input.eventId, dependencies.now);

  return dependencies.store.runTransaction(async (transaction) => {
    const existingPackages = await transaction.listPackages(input.eventId);
    const existingKinds = new Set(existingPackages.map((entry) => entry.kind));
    const createdKinds: EventSponsoringPackageKind[] = [];

    for (const pkg of defaults) {
      if (existingKinds.has(pkg.kind)) {
        continue;
      }

      await transaction.savePackage(pkg);
      createdKinds.push(pkg.kind);
    }

    return {
      createdKinds,
      skippedKinds: EVENT_SPONSORING_PACKAGE_KIND_ORDER.filter((kind) => existingKinds.has(kind)),
    };
  });
}

export async function saveEventSponsoringPackageForAdmin(
  input: {
    eventId: string;
    packageId: string;
    name: string;
    description: string;
    featuresText: string;
    priceEuro: string;
    active: boolean;
    sortOrder: string;
  },
  dependencies: EventSponsoringAdminDependencies,
) {
  await assertAdmin(dependencies);
  await assertEventExists(input.eventId, dependencies);

  return dependencies.store.runTransaction(async (transaction) => {
    const existingPackages = await transaction.listPackages(input.eventId);
    const existingPackage = existingPackages.find((entry) => entry.id === sanitizeText(input.packageId));

    if (!existingPackage) {
      throw new Error('Das Sponsoring-Paket wurde nicht gefunden.');
    }

    const allowZeroPrice = existingPackage.kind === 'custom_request' || existingPackage.kind === 'anonymous_support';
    const features = parseOrderedFeatureList(input.featuresText);

    if (!features.length) {
      throw new Error('Bitte mindestens eine Paketleistung angeben.');
    }

    const normalized = normalizeEventSponsoringPackage(
      {
        ...existingPackage,
        name: sanitizeText(input.name),
        description: sanitizeText(input.description),
        features,
        priceCents: parseEuroAmountToCents(input.priceEuro, 'Der Paketpreis', { allowZero: allowZeroPrice }),
        active: input.active,
        sortOrder: parseSortOrder(input.sortOrder),
        ...getEventSponsoringPackageKindInvariants(existingPackage.kind),
      },
      { existing: existingPackage, now: dependencies.now },
    );

    await transaction.savePackage(normalized);
    return normalized;
  });
}

export async function ensureDefaultEventSponsoringBannersForAdmin(
  input: { eventId: string },
  dependencies: EventSponsoringAdminDependencies,
) {
  await assertAdmin(dependencies);
  await assertEventExists(input.eventId, dependencies);

  const defaults = buildDefaultEventSponsoringBanners(input.eventId, dependencies.now);

  return dependencies.store.runTransaction(async (transaction) => {
    const existingBanners = await transaction.listBanners(input.eventId);
    const existingIds = new Set(existingBanners.map((banner) => banner.id));
    const createdBannerIds: string[] = [];

    for (const banner of defaults) {
      if (existingIds.has(banner.id)) {
        continue;
      }

      await transaction.saveBanner(banner);
      createdBannerIds.push(banner.id);
    }

    return {
      createdBannerIds,
      skippedBannerIds: defaults.map((banner) => banner.id).filter((bannerId) => existingIds.has(bannerId)),
    };
  });
}

export async function ensureDefaultEventSponsoringSlotsForAdmin(
  input: { eventId: string },
  dependencies: EventSponsoringAdminDependencies,
) {
  await assertAdmin(dependencies);
  await assertEventExists(input.eventId, dependencies);

  return dependencies.store.runTransaction(async (transaction) => {
    const banners = await transaction.listBanners(input.eventId);
    const createdBannerIds: string[] = [];

    for (const banner of banners) {
      const slots = await transaction.listSlotsByBanner(input.eventId, banner.id);
      const hasActiveSlots = slots.some((slot) => slot.active);

      if (hasActiveSlots) {
        continue;
      }

      for (const slot of buildDefaultEventSponsoringSlotsForBanner(banner, dependencies.now)) {
        await transaction.saveSlot(slot);
      }

      await transaction.saveBanner(
        normalizeEventSponsoringBanner(
          {
            ...banner,
            layoutVersion: banner.layoutVersion + 1,
          },
          { existing: banner, now: dependencies.now },
        ),
      );

      createdBannerIds.push(banner.id);
    }

    return {
      createdBannerIds,
      skippedBannerIds: banners.filter((banner) => !createdBannerIds.includes(banner.id)).map((banner) => banner.id),
    };
  });
}

export async function saveEventSponsoringBannerForAdmin(
  input: {
    eventId: string;
    bannerId: string;
    name: string;
    active: boolean;
  },
  dependencies: EventSponsoringAdminDependencies,
) {
  await assertAdmin(dependencies);
  await assertEventExists(input.eventId, dependencies);

  return dependencies.store.runTransaction(async (transaction) => {
    const banner = await transaction.getBanner(input.bannerId);

    if (!banner) {
      throw new Error('Das Banner wurde nicht gefunden.');
    }

    assertBannerBelongsToEvent(banner, input.eventId);

    const normalized = normalizeEventSponsoringBanner(
      {
        ...banner,
        name: sanitizeText(input.name),
        active: input.active,
      },
      { existing: banner, now: dependencies.now },
    );

    await transaction.saveBanner(normalized);
    return normalized;
  });
}

export async function saveEventSponsoringBannerLayoutForAdmin(
  input: {
    eventId: string;
    bannerId: string;
    baseLayoutVersion: number;
    slots: Array<Record<string, unknown>>;
  },
  dependencies: EventSponsoringAdminDependencies,
) {
  await assertAdmin(dependencies);
  await assertEventExists(input.eventId, dependencies);

  return dependencies.store.runTransaction(async (transaction) => {
    const banner = await transaction.getBanner(input.bannerId);

    if (!banner) {
      throw new Error('Das Banner wurde nicht gefunden.');
    }

    assertBannerBelongsToEvent(banner, input.eventId);

    if (banner.layoutVersion !== input.baseLayoutVersion) {
      throw new Error('Das Bannerlayout wurde zwischenzeitlich geaendert. Bitte Seite neu laden und den Stand erneut bearbeiten.');
    }

    const existingSlots = await transaction.listSlotsByBanner(input.eventId, banner.id);
    const otherEventSlots = (await transaction.listSlotsByEvent(input.eventId)).filter((slot) => slot.bannerId !== banner.id);
    const bookings = await transaction.listBookingsByEvent(input.eventId);
    const nextSlots = parseLayoutSlotsInput(input.eventId, banner, existingSlots, bookings, input.slots, dependencies.now);

    assertUniqueSlotCodesWithinEvent(nextSlots, otherEventSlots);

    const existingById = new Map(existingSlots.map((slot) => [slot.id, slot]));
    const nextById = new Map(nextSlots.map((slot) => [slot.id, slot]));

    const layoutChanged = existingSlots.length !== nextSlots.length || nextSlots.some((slot) => !areSlotsEquivalent(existingById.get(slot.id) || slot, slot));

    if (!layoutChanged) {
      return {
        bannerId: banner.id,
        nextLayoutVersion: banner.layoutVersion,
        slots: existingSlots,
      };
    }

    for (const existingSlot of existingSlots) {
      await transaction.deleteSlot(existingSlot.id);
    }

    for (const slot of nextSlots) {
      await transaction.saveSlot(slot);
    }

    await transaction.saveBanner(
      normalizeEventSponsoringBanner(
        {
          ...banner,
          layoutVersion: banner.layoutVersion + 1,
        },
        { existing: banner, now: dependencies.now },
      ),
    );

    return {
      bannerId: banner.id,
      nextLayoutVersion: banner.layoutVersion + 1,
      slots: nextSlots,
    };
  });
}
