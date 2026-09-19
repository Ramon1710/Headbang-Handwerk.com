import {
  DEFAULT_EVENT_SPONSORING_BANNER_HEIGHT_MM,
  DEFAULT_EVENT_SPONSORING_BANNER_WIDTH_MM,
  DEFAULT_EVENT_SPONSORING_CURRENCY_CODE,
  MAX_ACTIVE_EVENT_SPONSORING_BANNERS_PER_EVENT,
} from '@/lib/event-sponsoring/schema';
import { normalizeExternalUrl } from '@/lib/site';
import type {
  EventSponsoringBanner,
  EventSponsoringBooking,
  EventSponsoringBookingBillingAddress,
  EventSponsoringBookingStatus,
  EventSponsoringBookingType,
  EventSponsoringCheckoutSponsorDetails,
  EventSponsoringConfig,
  EventSponsoringCurrencyCode,
  EventSponsoringLogoSlotSize,
  EventSponsoringLogoUpload,
  EventSponsoringLogoUploadStatus,
  EventSponsoringPackage,
  EventSponsoringPackageKind,
  EventSponsoringPayment,
  EventSponsoringPaymentProvider,
  EventSponsoringPaymentStatus,
  EventSponsoringRequest,
  EventSponsoringRequestEmailErrorCategory,
  EventSponsoringRequestEmailState,
  EventSponsoringRequestStatus,
  EventSponsoringRequestSupportType,
  EventSponsoringSlot,
  EventSponsoringSlotSize,
  EventSponsoringSlotStatus,
} from '@/lib/event-sponsoring/types';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HASH_HEX_REGEX = /^[a-f0-9]{32,256}$/i;
const CHECKOUT_IDEMPOTENCY_KEY_REGEX = /^[A-Za-z0-9:_-]{16,200}$/;

function normalizeIsoTimestamp(input: unknown, fallback: string) {
  const value = String(input || '').trim();

  if (!value) {
    return fallback;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error('Ungueltiger Zeitstempel.');
  }

  return date.toISOString();
}

function normalizeBoolean(input: unknown, fallback = false) {
  if (typeof input === 'boolean') {
    return input;
  }

  if (typeof input === 'undefined' || input === null || input === '') {
    return fallback;
  }

  if (input === 'true' || input === '1' || input === 1) {
    return true;
  }

  if (input === 'false' || input === '0' || input === 0) {
    return false;
  }

  return Boolean(input);
}

function normalizeBoundedText(
  input: unknown,
  label: string,
  options: { minLength?: number; maxLength: number; allowEmpty?: boolean; allowMultiline?: boolean },
) {
  const raw = String(input ?? '');
  const value = options.allowMultiline ? raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim() : raw.trim();

  if (!options.allowEmpty && !value) {
    throw new Error(`${label} darf nicht leer sein.`);
  }

  if (options.minLength && value.length < options.minLength) {
    throw new Error(`${label} ist zu kurz.`);
  }

  if (value.length > options.maxLength) {
    throw new Error(`${label} ist zu lang.`);
  }

  return value;
}

function normalizeOptionalText(input: unknown, label: string, maxLength: number) {
  const value = normalizeBoundedText(input, label, { allowEmpty: true, maxLength });
  return value || undefined;
}

function normalizeInteger(input: unknown, label: string, options?: { min?: number; max?: number }) {
  const value = typeof input === 'number' ? input : Number(String(input ?? '').trim());

  if (!Number.isInteger(value)) {
    throw new Error(`${label} muss als Integer gespeichert werden.`);
  }

  if (typeof options?.min === 'number' && value < options.min) {
    throw new Error(`${label} ist zu klein.`);
  }

  if (typeof options?.max === 'number' && value > options.max) {
    throw new Error(`${label} ist zu gross.`);
  }

  return value;
}

function normalizeNumber(input: unknown, label: string, options?: { min?: number; max?: number; exclusiveMin?: boolean }) {
  const value = typeof input === 'number' ? input : Number(String(input ?? '').trim());

  if (!Number.isFinite(value)) {
    throw new Error(`${label} ist ungueltig.`);
  }

  if (typeof options?.min === 'number') {
    if (options.exclusiveMin ? value <= options.min : value < options.min) {
      throw new Error(`${label} ist zu klein.`);
    }
  }

  if (typeof options?.max === 'number' && value > options.max) {
    throw new Error(`${label} ist zu gross.`);
  }

  return value;
}

function normalizeCurrencyCode(input: unknown, fallback = DEFAULT_EVENT_SPONSORING_CURRENCY_CODE): EventSponsoringCurrencyCode {
  const value = String(input || fallback).trim().toUpperCase();

  if (!/^[A-Z]{3}$/.test(value)) {
    throw new Error('Waehrungscode ist ungueltig.');
  }

  return value;
}

function normalizeId(input: unknown, label: string, maxLength = 120) {
  return normalizeBoundedText(input, label, { maxLength });
}

function normalizeEmail(input: unknown) {
  const value = normalizeBoundedText(input, 'E-Mail', { maxLength: 320 });

  if (!EMAIL_REGEX.test(value)) {
    throw new Error('E-Mail ist ungueltig.');
  }

  return value;
}

function normalizeStringArray(input: unknown, label: string, options: { maxItems: number; maxLength: number; allowEmpty?: boolean }) {
  const entries = Array.isArray(input)
    ? input.map((entry) => String(entry ?? '').trim()).filter(Boolean)
    : typeof input === 'string'
      ? input.split(/\r?\n|,/).map((entry) => entry.trim()).filter(Boolean)
      : [];

  if (!options.allowEmpty && entries.length === 0) {
    throw new Error(`${label} darf nicht leer sein.`);
  }

  if (entries.length > options.maxItems) {
    throw new Error(`${label} hat zu viele Eintraege.`);
  }

  return entries.map((entry) => normalizeBoundedText(entry, label, { maxLength: options.maxLength }));
}

function normalizePackageKind(input: unknown): EventSponsoringPackageKind {
  const value = String(input || '').trim();

  if (
    value === 'small_logo'
    || value === 'medium_logo'
    || value === 'large_logo'
    || value === 'custom_request'
    || value === 'anonymous_support'
  ) {
    return value;
  }

  throw new Error('Paketart ist ungueltig.');
}

function normalizeLogoSlotSize(input: unknown): EventSponsoringLogoSlotSize {
  const value = String(input || '').trim();

  if (value === 'small' || value === 'medium' || value === 'large' || value === 'none') {
    return value;
  }

  throw new Error('Logo-Slot-Groesse ist ungueltig.');
}

function normalizeSlotSize(input: unknown): EventSponsoringSlotSize {
  const value = String(input || '').trim();

  if (value === 'small' || value === 'medium' || value === 'large') {
    return value;
  }

  throw new Error('Slot-Groesse ist ungueltig.');
}

function normalizeSlotStatus(input: unknown): EventSponsoringSlotStatus {
  const value = String(input || '').trim();

  if (value === 'available' || value === 'assigned' || value === 'blocked') {
    return value;
  }

  throw new Error('Slot-Status ist ungueltig.');
}

function normalizeBookingType(input: unknown): EventSponsoringBookingType {
  const value = String(input || '').trim();

  if (value === 'paid_logo' || value === 'custom_request' || value === 'anonymous_support') {
    return value;
  }

  throw new Error('Buchungstyp ist ungueltig.');
}

function normalizeBookingStatus(input: unknown): EventSponsoringBookingStatus {
  const value = String(input || '').trim();

  if (
    value === 'draft'
    || value === 'checkout_created'
    || value === 'payment_pending'
    || value === 'paid'
    || value === 'slot_selection_pending'
    || value === 'slot_assigned'
    || value === 'logo_uploaded'
    || value === 'under_review'
    || value === 'approved'
    || value === 'completed'
    || value === 'cancelled'
    || value === 'expired'
    || value === 'refunded'
  ) {
    return value;
  }

  throw new Error('Buchungsstatus ist ungueltig.');
}

function normalizePaymentProvider(input: unknown): EventSponsoringPaymentProvider {
  const value = String(input || '').trim();

  if (value === 'stripe') {
    return value;
  }

  throw new Error('Zahlungsanbieter ist ungueltig.');
}

function normalizePaymentStatus(input: unknown): EventSponsoringPaymentStatus {
  const value = String(input || '').trim();

  if (
    value === 'created'
    || value === 'completed'
    || value === 'failed'
    || value === 'expired'
    || value === 'refunded'
    || value === 'partially_refunded'
  ) {
    return value;
  }

  throw new Error('Zahlungsstatus ist ungueltig.');
}

function normalizeRequestStatus(input: unknown): EventSponsoringRequestStatus {
  const value = String(input || '').trim();

  if (value === 'new' || value === 'invoice_pending' || value === 'invoice_sent' || value === 'accepted' || value === 'declined' || value === 'archived') {
    return value;
  }

  throw new Error('Anfragestatus ist ungueltig.');
}

function normalizeRequestEmailState(input: unknown): EventSponsoringRequestEmailState {
  const value = String(input || '').trim();

  if (value === 'pending' || value === 'sending' || value === 'sent' || value === 'failed') {
    return value;
  }

  throw new Error('E-Mail-Status ist ungueltig.');
}

function normalizeRequestEmailErrorCategory(input: unknown): EventSponsoringRequestEmailErrorCategory {
  const value = String(input || '').trim();

  if (value === 'not_configured' || value === 'transport_error' || value === 'unknown') {
    return value;
  }

  throw new Error('E-Mail-Fehlerkategorie ist ungueltig.');
}

function normalizeRequestEmailErrorMessage(input: unknown) {
  return normalizeOptionalText(input, 'Bereinigte E-Mail-Fehlermeldung', 400);
}

function normalizeRequestSupportType(input: unknown): EventSponsoringRequestSupportType {
  const value = String(input || '').trim();

  if (
    value === 'material'
    || value === 'stand_construction'
    || value === 'interactive_activity'
    || value === 'tools_or_machines'
    || value === 'transport'
    || value === 'personnel'
    || value === 'financial'
    || value === 'other'
  ) {
    return value;
  }

  throw new Error('Unterstuetzungsart ist ungueltig.');
}

function normalizeLogoUploadStatus(input: unknown): EventSponsoringLogoUploadStatus {
  const value = String(input || '').trim();

  if (value === 'pending' || value === 'uploaded' || value === 'under_review' || value === 'approved' || value === 'rejected') {
    return value;
  }

  throw new Error('Logo-Upload-Status ist ungueltig.');
}

function normalizeOptionalBillingAddress(input: unknown): EventSponsoringBookingBillingAddress | undefined {
  if (!input || typeof input !== 'object') {
    return undefined;
  }

  const candidate = input as Record<string, unknown>;
  const next: EventSponsoringBookingBillingAddress = {};

  const company = normalizeOptionalText(candidate.company, 'Rechnungsadresse Unternehmen', 160);
  const street = normalizeOptionalText(candidate.street, 'Rechnungsadresse Strasse', 160);
  const houseNumber = normalizeOptionalText(candidate.houseNumber, 'Rechnungsadresse Hausnummer', 40);
  const postalCode = normalizeOptionalText(candidate.postalCode, 'Rechnungsadresse Postleitzahl', 20);
  const city = normalizeOptionalText(candidate.city, 'Rechnungsadresse Ort', 120);
  const countryCode = normalizeOptionalText(candidate.countryCode, 'Rechnungsadresse Land', 2)?.toUpperCase();

  if (company) {
    next.company = company;
  }
  if (street) {
    next.street = street;
  }
  if (houseNumber) {
    next.houseNumber = houseNumber;
  }
  if (postalCode) {
    next.postalCode = postalCode;
  }
  if (city) {
    next.city = city;
  }
  if (countryCode) {
    if (!/^[A-Z]{2}$/.test(countryCode)) {
      throw new Error('Laendercode der Rechnungsadresse ist ungueltig.');
    }
    next.countryCode = countryCode;
  }

  return Object.keys(next).length ? next : undefined;
}

function normalizeOptionalWebsite(input: unknown) {
  const normalized = normalizeOptionalText(input, 'Unternehmens-Website', 240);

  if (!normalized) {
    return undefined;
  }

  const resolved = normalizeExternalUrl(normalized);

  if (!/^https?:\/\//i.test(resolved)) {
    throw new Error('Die Unternehmens-Website ist ungueltig.');
  }

  return resolved;
}

export function normalizeEventSponsoringCheckoutIdempotencyKey(input: unknown) {
  const value = normalizeBoundedText(input, 'Checkout-Idempotency-Key', { maxLength: 200 });

  if (!CHECKOUT_IDEMPOTENCY_KEY_REGEX.test(value)) {
    throw new Error('Der Checkout-Vorgang konnte nicht bestaetigt werden.');
  }

  return value;
}

export function normalizeEventSponsoringCheckoutSponsorDetails(input: unknown): EventSponsoringCheckoutSponsorDetails {
  if (!input || typeof input !== 'object') {
    throw new Error('Sponsorendaten fehlen.');
  }

  const candidate = input as Record<string, unknown>;
  const confirmDataAccurate = normalizeBoolean(candidate.confirmDataAccurate, false);
  const acceptDataProcessing = normalizeBoolean(candidate.acceptDataProcessing, false);
  const acceptPostPaymentFlow = normalizeBoolean(candidate.acceptPostPaymentFlow, false);
  const publicDisplayConsent = normalizeBoolean(candidate.publicDisplayConsent, false);

  if (!confirmDataAccurate) {
    throw new Error('Bitte bestaetigt die Richtigkeit eurer Angaben.');
  }

  if (!acceptDataProcessing) {
    throw new Error('Bitte stimmt der Verarbeitung der Daten fuer die Sponsoringabwicklung zu.');
  }

  if (!acceptPostPaymentFlow) {
    throw new Error('Bitte bestaetigt, dass die Logo- und Platzauswahl erst nach bestaetigter Zahlung erfolgt.');
  }

  if (!publicDisplayConsent) {
    throw new Error('Bitte bestaetigt die spaetere oeffentliche Logodarstellung.');
  }

  const companyWebsite = normalizeOptionalWebsite(candidate.companyWebsite);
  const phone = normalizeOptionalText(candidate.phone, 'Telefon', 60);

  return {
    companyName: normalizeBoundedText(candidate.companyName, 'Unternehmensname', { maxLength: 160 }),
    ...(companyWebsite ? { companyWebsite } : {}),
    contactFirstName: normalizeBoundedText(candidate.contactFirstName, 'Vorname', { maxLength: 80 }),
    contactLastName: normalizeBoundedText(candidate.contactLastName, 'Nachname', { maxLength: 80 }),
    email: normalizeEmail(candidate.email),
    ...(phone ? { phone } : {}),
    billingStreet: normalizeBoundedText(candidate.billingStreet, 'Strasse', { maxLength: 160 }),
    billingHouseNumber: normalizeBoundedText(candidate.billingHouseNumber, 'Hausnummer', { maxLength: 40 }),
    billingPostalCode: normalizeBoundedText(candidate.billingPostalCode, 'Postleitzahl', { maxLength: 20 }),
    billingCity: normalizeBoundedText(candidate.billingCity, 'Ort', { maxLength: 120 }),
    billingCountryCode: normalizeBoundedText(candidate.billingCountryCode ?? 'DE', 'Land', { maxLength: 2 }).toUpperCase(),
    confirmDataAccurate,
    acceptDataProcessing,
    acceptPostPaymentFlow,
    publicDisplayConsent,
  } satisfies EventSponsoringCheckoutSponsorDetails;
}

export function getExpectedLogoSlotSizeForPackageKind(kind: EventSponsoringPackageKind): EventSponsoringLogoSlotSize {
  switch (kind) {
    case 'small_logo':
      return 'small';
    case 'medium_logo':
      return 'medium';
    case 'large_logo':
      return 'large';
    case 'custom_request':
    case 'anonymous_support':
      return 'none';
    default:
      return kind satisfies never;
  }
}

export function getExpectedBookingTypeForPackageKind(kind: EventSponsoringPackageKind): EventSponsoringBookingType {
  switch (kind) {
    case 'small_logo':
    case 'medium_logo':
    case 'large_logo':
      return 'paid_logo';
    case 'custom_request':
      return 'custom_request';
    case 'anonymous_support':
      return 'anonymous_support';
    default:
      return kind satisfies never;
  }
}

export function normalizeEventSponsoringConfig(input: unknown, options?: { now?: string; existing?: Partial<EventSponsoringConfig> }) {
  if (!input || typeof input !== 'object') {
    throw new Error('Veranstaltungssponsoring-Konfiguration fehlt.');
  }

  const now = normalizeIsoTimestamp(options?.now, new Date().toISOString());
  const candidate = input as Record<string, unknown>;
  const existing = options?.existing;
  const currencyCode = normalizeCurrencyCode(candidate.currencyCode ?? existing?.currencyCode);
  const anonymousSupportEnabled = normalizeBoolean(candidate.anonymousSupportEnabled ?? existing?.anonymousSupportEnabled, false);
  const anonymousMinimumAmountCents = normalizeInteger(
    candidate.anonymousMinimumAmountCents ?? existing?.anonymousMinimumAmountCents ?? 0,
    'Mindestbetrag fuer anonyme Unterstuetzung',
    { min: 0, max: 100_000_000 },
  );

  if (!anonymousSupportEnabled && anonymousMinimumAmountCents !== 0) {
    throw new Error('Der Mindestbetrag fuer anonyme Unterstuetzung darf nur gesetzt sein, wenn anonyme Unterstuetzung aktiviert ist.');
  }

  return {
    eventId: normalizeId(candidate.eventId ?? existing?.eventId, 'Veranstaltungs-ID'),
    enabled: normalizeBoolean(candidate.enabled ?? existing?.enabled, false),
    publicTitle: normalizeBoundedText(candidate.publicTitle ?? existing?.publicTitle, 'Oeffentlicher Titel', { maxLength: 160 }),
    publicDescription: normalizeBoundedText(candidate.publicDescription ?? existing?.publicDescription, 'Oeffentliche Beschreibung', {
      maxLength: 4_000,
      allowMultiline: true,
    }),
    currencyCode,
    anonymousSupportEnabled,
    anonymousMinimumAmountCents,
    customSponsoringEnabled: normalizeBoolean(candidate.customSponsoringEnabled ?? existing?.customSponsoringEnabled, false),
    showOccupiedLogosPublicly: normalizeBoolean(candidate.showOccupiedLogosPublicly ?? existing?.showOccupiedLogosPublicly, false),
    createdAt: normalizeIsoTimestamp(candidate.createdAt ?? existing?.createdAt, now),
    updatedAt: now,
  } satisfies EventSponsoringConfig;
}

export function normalizeEventSponsoringPackage(input: unknown, options?: { now?: string; existing?: Partial<EventSponsoringPackage> }) {
  if (!input || typeof input !== 'object') {
    throw new Error('Veranstaltungssponsoring-Paket fehlt.');
  }

  const now = normalizeIsoTimestamp(options?.now, new Date().toISOString());
  const candidate = input as Record<string, unknown>;
  const existing = options?.existing;
  const kind = normalizePackageKind(candidate.kind ?? existing?.kind);
  const logoSlotSize = normalizeLogoSlotSize(candidate.logoSlotSize ?? existing?.logoSlotSize ?? getExpectedLogoSlotSizeForPackageKind(kind));
  const expectedSlotSize = getExpectedLogoSlotSizeForPackageKind(kind);
  const grantsBannerPlacement = normalizeBoolean(candidate.grantsBannerPlacement ?? existing?.grantsBannerPlacement, kind.endsWith('_logo'));
  const isPaidOnline = normalizeBoolean(candidate.isPaidOnline ?? existing?.isPaidOnline, kind !== 'custom_request');
  const priceCents = normalizeInteger(candidate.priceCents ?? existing?.priceCents ?? 0, 'Paketpreis', { min: 0, max: 100_000_000 });

  if (logoSlotSize !== expectedSlotSize) {
    throw new Error('Paketart und Logo-Slot-Groesse passen fachlich nicht zusammen.');
  }

  if (grantsBannerPlacement !== (kind === 'small_logo' || kind === 'medium_logo' || kind === 'large_logo')) {
    throw new Error('Nur Logopakete duerfen Bannerplatzierung erhalten.');
  }

  if ((kind === 'custom_request' || kind === 'anonymous_support') && priceCents < 0) {
    throw new Error('Negative Preise sind unzulaessig.');
  }

  return {
    id: normalizeId(candidate.id ?? existing?.id, 'Paket-ID'),
    eventId: normalizeId(candidate.eventId ?? existing?.eventId, 'Veranstaltungs-ID'),
    name: normalizeBoundedText(candidate.name ?? existing?.name, 'Paketname', { maxLength: 160 }),
    kind,
    description: normalizeBoundedText(candidate.description ?? existing?.description, 'Paketbeschreibung', { maxLength: 5_000, allowMultiline: true }),
    features: normalizeStringArray(candidate.features ?? existing?.features, 'Paket-Features', { maxItems: 32, maxLength: 240 }),
    priceCents,
    currencyCode: normalizeCurrencyCode(candidate.currencyCode ?? existing?.currencyCode),
    active: normalizeBoolean(candidate.active ?? existing?.active, true),
    sortOrder: normalizeInteger(candidate.sortOrder ?? existing?.sortOrder ?? 0, 'Sortierreihenfolge', { min: 0, max: 10_000 }),
    grantsBannerPlacement,
    logoSlotSize,
    isPaidOnline,
    createdAt: normalizeIsoTimestamp(candidate.createdAt ?? existing?.createdAt, now),
    updatedAt: now,
  } satisfies EventSponsoringPackage;
}

export function normalizeEventSponsoringBanner(input: unknown, options?: { now?: string; existing?: Partial<EventSponsoringBanner> }) {
  if (!input || typeof input !== 'object') {
    throw new Error('Bannerdaten fehlen.');
  }

  const now = normalizeIsoTimestamp(options?.now, new Date().toISOString());
  const candidate = input as Record<string, unknown>;
  const existing = options?.existing;

  return {
    id: normalizeId(candidate.id ?? existing?.id, 'Banner-ID'),
    eventId: normalizeId(candidate.eventId ?? existing?.eventId, 'Veranstaltungs-ID'),
    name: normalizeBoundedText(candidate.name ?? existing?.name, 'Bannername', { maxLength: 160 }),
    widthMm: normalizeInteger(candidate.widthMm ?? existing?.widthMm ?? DEFAULT_EVENT_SPONSORING_BANNER_WIDTH_MM, 'Bannerbreite', { min: 1, max: 20_000 }),
    heightMm: normalizeInteger(candidate.heightMm ?? existing?.heightMm ?? DEFAULT_EVENT_SPONSORING_BANNER_HEIGHT_MM, 'Bannerhoehe', { min: 1, max: 20_000 }),
    sortOrder: normalizeInteger(candidate.sortOrder ?? existing?.sortOrder ?? 0, 'Sortierreihenfolge', { min: 0, max: 10_000 }),
    active: normalizeBoolean(candidate.active ?? existing?.active, true),
    layoutVersion: normalizeInteger(candidate.layoutVersion ?? existing?.layoutVersion ?? 1, 'Layout-Version', { min: 1, max: 10_000 }),
    createdAt: normalizeIsoTimestamp(candidate.createdAt ?? existing?.createdAt, now),
    updatedAt: now,
  } satisfies EventSponsoringBanner;
}

export function assertMaxTwoActiveBannersPerEvent(banners: EventSponsoringBanner[], eventId: string) {
  const activeCount = banners.filter((banner) => banner.eventId === eventId && banner.active).length;

  if (activeCount > MAX_ACTIVE_EVENT_SPONSORING_BANNERS_PER_EVENT) {
    throw new Error('Eine Veranstaltung darf hoechstens zwei aktive Banner besitzen.');
  }
}

export function normalizeEventSponsoringSlot(input: unknown, options?: { now?: string; existing?: Partial<EventSponsoringSlot> }) {
  if (!input || typeof input !== 'object') {
    throw new Error('Slotdaten fehlen.');
  }

  const now = normalizeIsoTimestamp(options?.now, new Date().toISOString());
  const candidate = input as Record<string, unknown>;
  const existing = options?.existing;
  const status = normalizeSlotStatus(candidate.status ?? existing?.status ?? 'available');
  const bookingId = normalizeOptionalText(candidate.bookingId ?? existing?.bookingId, 'Buchungs-ID', 120);
  const x = normalizeNumber(candidate.x ?? existing?.x, 'Slot X', { min: 0, max: 1 });
  const y = normalizeNumber(candidate.y ?? existing?.y, 'Slot Y', { min: 0, max: 1 });
  const width = normalizeNumber(candidate.width ?? existing?.width, 'Slot-Breite', { min: 0, max: 1, exclusiveMin: true });
  const height = normalizeNumber(candidate.height ?? existing?.height, 'Slot-Hoehe', { min: 0, max: 1, exclusiveMin: true });

  if (x + width > 1) {
    throw new Error('Slot-Breite laeuft aus dem Banner heraus.');
  }

  if (y + height > 1) {
    throw new Error('Slot-Hoehe laeuft aus dem Banner heraus.');
  }

  if (status === 'assigned' && !bookingId) {
    throw new Error('Ein zugewiesener Slot braucht eine Buchungs-ID.');
  }

  if (status === 'available' && bookingId) {
    throw new Error('Ein verfuegbarer Slot darf keine Buchungs-ID besitzen.');
  }

  return {
    id: normalizeId(candidate.id ?? existing?.id, 'Slot-ID'),
    eventId: normalizeId(candidate.eventId ?? existing?.eventId, 'Veranstaltungs-ID'),
    bannerId: normalizeId(candidate.bannerId ?? existing?.bannerId, 'Banner-ID'),
    slotCode: normalizeBoundedText(candidate.slotCode ?? existing?.slotCode, 'Slot-Code', { maxLength: 120 }),
    packageSize: normalizeSlotSize(candidate.packageSize ?? existing?.packageSize),
    x,
    y,
    width,
    height,
    sortOrder: normalizeInteger(candidate.sortOrder ?? existing?.sortOrder ?? 0, 'Sortierreihenfolge', { min: 0, max: 10_000 }),
    status,
    ...(bookingId ? { bookingId } : {}),
    displayLabel: normalizeBoundedText(candidate.displayLabel ?? existing?.displayLabel, 'Slot-Anzeige', { maxLength: 160 }),
    active: normalizeBoolean(candidate.active ?? existing?.active, true),
    createdAt: normalizeIsoTimestamp(candidate.createdAt ?? existing?.createdAt, now),
    updatedAt: now,
  } satisfies EventSponsoringSlot;
}

export function normalizeEventSponsoringBooking(input: unknown, options?: { now?: string; existing?: Partial<EventSponsoringBooking> }) {
  if (!input || typeof input !== 'object') {
    throw new Error('Buchungsdaten fehlen.');
  }

  const now = normalizeIsoTimestamp(options?.now, new Date().toISOString());
  const candidate = input as Record<string, unknown>;
  const existing = options?.existing;
  const packageKind = normalizePackageKind(candidate.packageKind ?? existing?.packageKind);
  const bookingType = normalizeBookingType(candidate.bookingType ?? existing?.bookingType ?? getExpectedBookingTypeForPackageKind(packageKind));
  const slotSize = normalizeLogoSlotSize(candidate.slotSize ?? existing?.slotSize ?? getExpectedLogoSlotSizeForPackageKind(packageKind));
  const expectedSlotSize = getExpectedLogoSlotSizeForPackageKind(packageKind);
  const expectedBookingType = getExpectedBookingTypeForPackageKind(packageKind);
  const anonymousSupport = normalizeBoolean(candidate.anonymousSupport ?? existing?.anonymousSupport, bookingType === 'anonymous_support');
  const selectedSlotId = normalizeOptionalText(candidate.selectedSlotId ?? existing?.selectedSlotId, 'Ausgewaehlter Slot', 120);
  const stripeCheckoutSessionId = normalizeOptionalText(candidate.stripeCheckoutSessionId ?? existing?.stripeCheckoutSessionId, 'Stripe Checkout Session ID', 240);
  const stripePaymentIntentId = normalizeOptionalText(candidate.stripePaymentIntentId ?? existing?.stripePaymentIntentId, 'Stripe Payment Intent ID', 240);
  const companyWebsite = normalizeOptionalWebsite(candidate.companyWebsite ?? existing?.companyWebsite);
  const contactFirstName = normalizeOptionalText(candidate.contactFirstName ?? existing?.contactFirstName, 'Vorname', 80);
  const contactLastName = normalizeOptionalText(candidate.contactLastName ?? existing?.contactLastName, 'Nachname', 80);
  const checkoutIdempotencyKeyHash = normalizeOptionalText(candidate.checkoutIdempotencyKeyHash ?? existing?.checkoutIdempotencyKeyHash, 'Checkout-Idempotency-Hash', 256);
  const checkoutRequestHash = normalizeOptionalText(candidate.checkoutRequestHash ?? existing?.checkoutRequestHash, 'Checkout-Request-Hash', 256);
  const capacityHoldExpiresAt = normalizeOptionalText(candidate.capacityHoldExpiresAt ?? existing?.capacityHoldExpiresAt, 'Ablauf des Kapazitaetsanspruchs', 64);
  const stripeCheckoutExpiresAt = normalizeOptionalText(candidate.stripeCheckoutExpiresAt ?? existing?.stripeCheckoutExpiresAt, 'Ablauf der Stripe-Checkout-Session', 64);
  const secureAccessTokenHash = normalizeOptionalText(candidate.secureAccessTokenHash ?? existing?.secureAccessTokenHash, 'Hash fuer den sicheren Zugriffslink', 256);

  if (slotSize !== expectedSlotSize) {
    throw new Error('Paketart und Slot-Groesse der Buchung passen nicht zusammen.');
  }

  if (bookingType !== expectedBookingType) {
    throw new Error('Paketart und Buchungstyp passen nicht zusammen.');
  }

  if ((bookingType === 'custom_request' || bookingType === 'anonymous_support') && slotSize !== 'none') {
    throw new Error('Individuelle oder anonyme Buchungen duerfen keinen Slot beanspruchen.');
  }

  if (bookingType === 'paid_logo' && slotSize === 'none') {
    throw new Error('Bezahlte Logobuchungen brauchen eine Slot-Groesse.');
  }

  if (selectedSlotId && slotSize === 'none') {
    throw new Error('Buchungen ohne Slot-Groesse duerfen keinen Slot auswaehlen.');
  }

  if (anonymousSupport !== (bookingType === 'anonymous_support')) {
    throw new Error('Das Anonym-Kennzeichen passt nicht zum Buchungstyp.');
  }

  if (secureAccessTokenHash && !HASH_HEX_REGEX.test(secureAccessTokenHash)) {
    throw new Error('Der Hash fuer den sicheren Zugriffslink ist ungueltig.');
  }

  if (checkoutIdempotencyKeyHash && !HASH_HEX_REGEX.test(checkoutIdempotencyKeyHash)) {
    throw new Error('Der Checkout-Idempotency-Hash ist ungueltig.');
  }

  if (checkoutRequestHash && !HASH_HEX_REGEX.test(checkoutRequestHash)) {
    throw new Error('Der Checkout-Request-Hash ist ungueltig.');
  }

  if ((contactFirstName && !contactLastName) || (!contactFirstName && contactLastName)) {
    throw new Error('Vorname und Nachname muessen gemeinsam gesetzt werden.');
  }

  return {
    id: normalizeId(candidate.id ?? existing?.id, 'Buchungs-ID'),
    eventId: normalizeId(candidate.eventId ?? existing?.eventId, 'Veranstaltungs-ID'),
    packageId: normalizeId(candidate.packageId ?? existing?.packageId, 'Paket-ID'),
    packageKind,
    bookingType,
    slotSize,
    ...(normalizeOptionalText(candidate.companyName ?? existing?.companyName, 'Firmenname', 160)
      ? { companyName: normalizeOptionalText(candidate.companyName ?? existing?.companyName, 'Firmenname', 160) }
      : {}),
    ...(companyWebsite ? { companyWebsite } : {}),
    ...(contactFirstName ? { contactFirstName } : {}),
    ...(contactLastName ? { contactLastName } : {}),
    contactName: normalizeBoundedText(candidate.contactName ?? existing?.contactName, 'Kontaktname', { maxLength: 160 }),
    email: normalizeEmail(candidate.email ?? existing?.email),
    ...(normalizeOptionalText(candidate.phone ?? existing?.phone, 'Telefon', 60)
      ? { phone: normalizeOptionalText(candidate.phone ?? existing?.phone, 'Telefon', 60) }
      : {}),
    ...(normalizeOptionalBillingAddress(candidate.billingAddress ?? existing?.billingAddress)
      ? { billingAddress: normalizeOptionalBillingAddress(candidate.billingAddress ?? existing?.billingAddress) }
      : {}),
    priceCents: normalizeInteger(candidate.priceCents ?? existing?.priceCents ?? 0, 'Buchungspreis', { min: 0, max: 100_000_000 }),
    currencyCode: normalizeCurrencyCode(candidate.currencyCode ?? existing?.currencyCode),
    status: normalizeBookingStatus(candidate.status ?? existing?.status ?? 'draft'),
    ...(stripeCheckoutSessionId ? { stripeCheckoutSessionId } : {}),
    ...(stripePaymentIntentId ? { stripePaymentIntentId } : {}),
    ...(checkoutIdempotencyKeyHash ? { checkoutIdempotencyKeyHash } : {}),
    ...(checkoutRequestHash ? { checkoutRequestHash } : {}),
    ...(capacityHoldExpiresAt ? { capacityHoldExpiresAt: normalizeIsoTimestamp(capacityHoldExpiresAt, now) } : {}),
    ...(stripeCheckoutExpiresAt ? { stripeCheckoutExpiresAt: normalizeIsoTimestamp(stripeCheckoutExpiresAt, now) } : {}),
    ...(selectedSlotId ? { selectedSlotId } : {}),
    publicDisplayEnabled: normalizeBoolean(candidate.publicDisplayEnabled ?? existing?.publicDisplayEnabled, bookingType === 'paid_logo'),
    anonymousSupport,
    ...(secureAccessTokenHash ? { secureAccessTokenHash } : {}),
    ...(candidate.secureAccessTokenExpiresAt || existing?.secureAccessTokenExpiresAt
      ? { secureAccessTokenExpiresAt: normalizeIsoTimestamp(candidate.secureAccessTokenExpiresAt ?? existing?.secureAccessTokenExpiresAt, now) }
      : {}),
    createdAt: normalizeIsoTimestamp(candidate.createdAt ?? existing?.createdAt, now),
    updatedAt: now,
    ...(candidate.paidAt || existing?.paidAt ? { paidAt: normalizeIsoTimestamp(candidate.paidAt ?? existing?.paidAt, now) } : {}),
    ...(candidate.cancelledAt || existing?.cancelledAt
      ? { cancelledAt: normalizeIsoTimestamp(candidate.cancelledAt ?? existing?.cancelledAt, now) }
      : {}),
  } satisfies EventSponsoringBooking;
}

export function normalizeEventSponsoringPayment(input: unknown, options?: { now?: string; existing?: Partial<EventSponsoringPayment> }) {
  if (!input || typeof input !== 'object') {
    throw new Error('Zahlungsdaten fehlen.');
  }

  const now = normalizeIsoTimestamp(options?.now, new Date().toISOString());
  const candidate = input as Record<string, unknown>;
  const existing = options?.existing;
  const metadataSnapshot = candidate.metadataSnapshot ?? existing?.metadataSnapshot ?? {};

  if (!metadataSnapshot || typeof metadataSnapshot !== 'object' || Array.isArray(metadataSnapshot)) {
    throw new Error('Zahlungs-Metadaten sind ungueltig.');
  }

  const processedWebhookEventIdsSource = candidate.processedWebhookEventIds ?? existing?.processedWebhookEventIds;
  const processedWebhookEventIds = Array.isArray(processedWebhookEventIdsSource)
    ? processedWebhookEventIdsSource.map((entry) => normalizeBoundedText(entry, 'Webhook-Event-ID', { maxLength: 240 }))
    : [];

  return {
    id: normalizeId(candidate.id ?? existing?.id, 'Zahlungs-ID'),
    bookingId: normalizeId(candidate.bookingId ?? existing?.bookingId, 'Buchungs-ID'),
    eventId: normalizeId(candidate.eventId ?? existing?.eventId, 'Veranstaltungs-ID'),
    provider: normalizePaymentProvider(candidate.provider ?? existing?.provider ?? 'stripe'),
    checkoutSessionId: normalizeBoundedText(candidate.checkoutSessionId ?? existing?.checkoutSessionId, 'Checkout Session ID', { maxLength: 240 }),
    ...(normalizeOptionalText(candidate.paymentIntentId ?? existing?.paymentIntentId, 'Payment Intent ID', 240)
      ? { paymentIntentId: normalizeOptionalText(candidate.paymentIntentId ?? existing?.paymentIntentId, 'Payment Intent ID', 240) }
      : {}),
    status: normalizePaymentStatus(candidate.status ?? existing?.status ?? 'created'),
    amountTotalCents: normalizeInteger(candidate.amountTotalCents ?? existing?.amountTotalCents, 'Zahlungsbetrag', { min: 0, max: 100_000_000 }),
    currencyCode: normalizeCurrencyCode(candidate.currencyCode ?? existing?.currencyCode),
    processedWebhookEventIds,
    metadataSnapshot: Object.fromEntries(
      Object.entries(metadataSnapshot as Record<string, unknown>).map(([key, value]) => [
        normalizeBoundedText(key, 'Metadaten-Schluessel', { maxLength: 120 }),
        normalizeBoundedText(value, `Metadatenwert ${key}`, { maxLength: 500, allowEmpty: true }),
      ]),
    ),
    createdAt: normalizeIsoTimestamp(candidate.createdAt ?? existing?.createdAt, now),
    updatedAt: now,
    ...(candidate.confirmedAt || existing?.confirmedAt ? { confirmedAt: normalizeIsoTimestamp(candidate.confirmedAt ?? existing?.confirmedAt, now) } : {}),
    ...(candidate.refundedAt || existing?.refundedAt ? { refundedAt: normalizeIsoTimestamp(candidate.refundedAt ?? existing?.refundedAt, now) } : {}),
  } satisfies EventSponsoringPayment;
}

export function normalizeEventSponsoringRequest(input: unknown, options?: { now?: string; existing?: Partial<EventSponsoringRequest> }) {
  if (!input || typeof input !== 'object') {
    throw new Error('Anfragedaten fehlen.');
  }

  const now = normalizeIsoTimestamp(options?.now, new Date().toISOString());
  const candidate = input as Record<string, unknown>;
  const existing = options?.existing;
  const rawSupportTypesSource = candidate.supportTypes ?? existing?.supportTypes;
  const rawSupportTypes = Array.isArray(rawSupportTypesSource)
    ? rawSupportTypesSource
    : [];
  const companyWebsite = normalizeOptionalWebsite(candidate.companyWebsite ?? existing?.companyWebsite);
  const idempotencyKeyHash = normalizeOptionalText(candidate.idempotencyKeyHash ?? existing?.idempotencyKeyHash, 'Idempotency-Key-Hash', 256);
  const requestHash = normalizeOptionalText(candidate.requestHash ?? existing?.requestHash, 'Request-Hash', 256);
  const billingAddress = normalizeOptionalBillingAddress(candidate.billingAddress ?? existing?.billingAddress);
  const emailDeliverySource = candidate.emailDelivery ?? existing?.emailDelivery ?? {};

  if (idempotencyKeyHash && !HASH_HEX_REGEX.test(idempotencyKeyHash)) {
    throw new Error('Der Idempotency-Key-Hash ist ungueltig.');
  }

  if (requestHash && !HASH_HEX_REGEX.test(requestHash)) {
    throw new Error('Der Request-Hash ist ungueltig.');
  }

  const supportTypes = Array.from(new Set(rawSupportTypes.map((entry) => normalizeRequestSupportType(entry))));
  const packageKind = normalizePackageKind(candidate.packageKind ?? existing?.packageKind);
  const anonymousSupport = normalizeBoolean(candidate.anonymousSupport ?? existing?.anonymousSupport, packageKind === 'anonymous_support');
  const publicDisplayEnabled = normalizeBoolean(candidate.publicDisplayEnabled ?? existing?.publicDisplayEnabled, packageKind !== 'anonymous_support');
  const acceptDataProcessing = normalizeBoolean(candidate.acceptDataProcessing ?? existing?.acceptDataProcessing, false);
  const acceptInvoicePayment = normalizeBoolean(candidate.acceptInvoicePayment ?? existing?.acceptInvoicePayment, false);
  const acceptManualLogoPlacement = normalizeBoolean(candidate.acceptManualLogoPlacement ?? existing?.acceptManualLogoPlacement, false);
  const message = normalizeOptionalText(candidate.message ?? existing?.message, 'Beschreibung', 8_000);
  const phone = normalizeOptionalText(candidate.phone ?? existing?.phone, 'Telefon', 60);
  const packageFeaturesSnapshot = normalizeStringArray(candidate.packageFeaturesSnapshot ?? existing?.packageFeaturesSnapshot, 'Paketleistungen', { maxItems: 20, maxLength: 240, allowEmpty: true });

  if (packageKind === 'custom_request' && supportTypes.length === 0) {
    throw new Error('Mindestens eine Unterstuetzungsart muss gesetzt sein.');
  }

  if (packageKind === 'custom_request' && !message) {
    throw new Error('Bitte beschreibt das individuelle Sponsoringangebot.');
  }

  if (packageKind !== 'custom_request' && supportTypes.length > 0) {
    throw new Error('Unterstuetzungsarten sind nur fuer individuelles Sponsoring zulaessig.');
  }

  if (packageKind === 'anonymous_support' && publicDisplayEnabled) {
    throw new Error('Anonyme Unterstuetzung darf nicht fuer eine oeffentliche Darstellung markiert werden.');
  }

  if (!acceptDataProcessing) {
    throw new Error('Die Einwilligung zur Datenverarbeitung ist erforderlich.');
  }

  if (!acceptInvoicePayment) {
    throw new Error('Die Kenntnisnahme der Rechnungszahlung ist erforderlich.');
  }

  if (!acceptManualLogoPlacement) {
    throw new Error('Die Kenntnisnahme der manuellen Logoplatzierung ist erforderlich.');
  }

  if (!billingAddress?.street || !billingAddress.houseNumber || !billingAddress.postalCode || !billingAddress.city || !billingAddress.countryCode) {
    throw new Error('Die Firmenadresse ist unvollstaendig.');
  }

  if (!phone) {
    throw new Error('Telefon darf nicht leer sein.');
  }

  const emailDeliveryCandidate = typeof emailDeliverySource === 'object' && emailDeliverySource && !Array.isArray(emailDeliverySource)
    ? emailDeliverySource as Record<string, unknown>
    : {};

  return {
    id: normalizeId(candidate.id ?? existing?.id, 'Anfrage-ID'),
    eventId: normalizeId(candidate.eventId ?? existing?.eventId, 'Veranstaltungs-ID'),
    packageId: normalizeId(candidate.packageId ?? existing?.packageId, 'Paket-ID'),
    packageKind,
    packageNameSnapshot: normalizeBoundedText(candidate.packageNameSnapshot ?? existing?.packageNameSnapshot, 'Paketname', { maxLength: 160 }),
    packageFeaturesSnapshot,
    ...(candidate.packagePriceCents ?? existing?.packagePriceCents ? { packagePriceCents: normalizeInteger(candidate.packagePriceCents ?? existing?.packagePriceCents, 'Paketpreis', { min: 0, max: 100_000_000 }) } : {}),
    ...(normalizeOptionalText(candidate.currencyCode ?? existing?.currencyCode, 'Waehrung', 3) ? { currencyCode: normalizeCurrencyCode(candidate.currencyCode ?? existing?.currencyCode) } : {}),
    companyName: normalizeBoundedText(candidate.companyName ?? existing?.companyName, 'Firmenname', { maxLength: 160 }),
    ...(companyWebsite ? { companyWebsite } : {}),
    contactFirstName: normalizeBoundedText(candidate.contactFirstName ?? existing?.contactFirstName, 'Vorname', { maxLength: 80 }),
    contactLastName: normalizeBoundedText(candidate.contactLastName ?? existing?.contactLastName, 'Nachname', { maxLength: 80 }),
    contactName: normalizeBoundedText(candidate.contactName ?? existing?.contactName, 'Kontaktname', { maxLength: 160 }),
    email: normalizeEmail(candidate.email ?? existing?.email),
    phone,
    billingAddress,
    supportTypes,
    ...(message ? { message } : {}),
    publicDisplayEnabled,
    anonymousSupport,
    acceptDataProcessing,
    acceptInvoicePayment,
    acceptManualLogoPlacement,
    ...(normalizeOptionalText(candidate.logoUploadId ?? existing?.logoUploadId, 'Logo-Upload-ID', 120)
      ? { logoUploadId: normalizeOptionalText(candidate.logoUploadId ?? existing?.logoUploadId, 'Logo-Upload-ID', 120) }
      : {}),
    ...(idempotencyKeyHash ? { idempotencyKeyHash } : {}),
    ...(requestHash ? { requestHash } : {}),
    status: normalizeRequestStatus(candidate.status ?? existing?.status ?? 'new'),
    emailDelivery: {
      state: normalizeRequestEmailState(emailDeliveryCandidate.state ?? existing?.emailDelivery?.state ?? 'pending'),
      attemptCount: normalizeInteger(emailDeliveryCandidate.attemptCount ?? existing?.emailDelivery?.attemptCount ?? 0, 'Anzahl E-Mail-Versuche', { min: 0, max: 1_000 }),
      ...(normalizeOptionalText(emailDeliveryCandidate.lastAttemptAt ?? existing?.emailDelivery?.lastAttemptAt, 'Letzter E-Mail-Versuch', 64)
        ? { lastAttemptAt: normalizeIsoTimestamp(emailDeliveryCandidate.lastAttemptAt ?? existing?.emailDelivery?.lastAttemptAt, now) }
        : {}),
      ...(normalizeOptionalText(emailDeliveryCandidate.sentAt ?? existing?.emailDelivery?.sentAt, 'E-Mail versendet am', 64)
        ? { sentAt: normalizeIsoTimestamp(emailDeliveryCandidate.sentAt ?? existing?.emailDelivery?.sentAt, now) }
        : {}),
      ...(normalizeOptionalText(emailDeliveryCandidate.lastErrorCategory ?? existing?.emailDelivery?.lastErrorCategory, 'E-Mail-Fehlerkategorie', 40)
        ? { lastErrorCategory: normalizeRequestEmailErrorCategory(emailDeliveryCandidate.lastErrorCategory ?? existing?.emailDelivery?.lastErrorCategory) }
        : {}),
      ...(normalizeRequestEmailErrorMessage(emailDeliveryCandidate.lastErrorMessage ?? existing?.emailDelivery?.lastErrorMessage)
        ? { lastErrorMessage: normalizeRequestEmailErrorMessage(emailDeliveryCandidate.lastErrorMessage ?? existing?.emailDelivery?.lastErrorMessage) }
        : {}),
      ...(normalizeOptionalText(emailDeliveryCandidate.providerMessageId ?? existing?.emailDelivery?.providerMessageId, 'Provider-Message-ID', 240)
        ? { providerMessageId: normalizeOptionalText(emailDeliveryCandidate.providerMessageId ?? existing?.emailDelivery?.providerMessageId, 'Provider-Message-ID', 240) }
        : {}),
      ...(normalizeOptionalText(emailDeliveryCandidate.sendingClaimId ?? existing?.emailDelivery?.sendingClaimId, 'Sending-Claim-ID', 120)
        ? { sendingClaimId: normalizeOptionalText(emailDeliveryCandidate.sendingClaimId ?? existing?.emailDelivery?.sendingClaimId, 'Sending-Claim-ID', 120) }
        : {}),
      ...(normalizeOptionalText(emailDeliveryCandidate.sendingClaimedAt ?? existing?.emailDelivery?.sendingClaimedAt, 'Sending-Claim-Zeit', 64)
        ? { sendingClaimedAt: normalizeIsoTimestamp(emailDeliveryCandidate.sendingClaimedAt ?? existing?.emailDelivery?.sendingClaimedAt, now) }
        : {}),
    },
    createdAt: normalizeIsoTimestamp(candidate.createdAt ?? existing?.createdAt, now),
    updatedAt: now,
  } satisfies EventSponsoringRequest;
}

export function normalizeEventSponsoringLogoUpload(input: unknown, options?: { now?: string; existing?: Partial<EventSponsoringLogoUpload> }) {
  if (!input || typeof input !== 'object') {
    throw new Error('Logo-Upload-Daten fehlen.');
  }

  const now = normalizeIsoTimestamp(options?.now, new Date().toISOString());
  const candidate = input as Record<string, unknown>;
  const existing = options?.existing;

  return {
    id: normalizeId(candidate.id ?? existing?.id, 'Logo-Upload-ID'),
    ...(normalizeOptionalText(candidate.bookingId ?? existing?.bookingId, 'Buchungs-ID', 120)
      ? { bookingId: normalizeOptionalText(candidate.bookingId ?? existing?.bookingId, 'Buchungs-ID', 120) }
      : {}),
    ...(normalizeOptionalText(candidate.requestId ?? existing?.requestId, 'Anfrage-ID', 120)
      ? { requestId: normalizeOptionalText(candidate.requestId ?? existing?.requestId, 'Anfrage-ID', 120) }
      : {}),
    eventId: normalizeId(candidate.eventId ?? existing?.eventId, 'Veranstaltungs-ID'),
    ...(normalizeOptionalText(candidate.slotId ?? existing?.slotId, 'Slot-ID', 120)
      ? { slotId: normalizeOptionalText(candidate.slotId ?? existing?.slotId, 'Slot-ID', 120) }
      : {}),
    ...(normalizeOptionalText(candidate.storageBucket ?? existing?.storageBucket, 'Storage-Bucket', 160)
      ? { storageBucket: normalizeOptionalText(candidate.storageBucket ?? existing?.storageBucket, 'Storage-Bucket', 160) }
      : {}),
    storagePath: normalizeBoundedText(candidate.storagePath ?? existing?.storagePath, 'Storage-Pfad', { maxLength: 512 }),
    originalFileName: normalizeBoundedText(candidate.originalFileName ?? existing?.originalFileName, 'Originaldateiname', { maxLength: 240 }),
    contentType: normalizeBoundedText(candidate.contentType ?? existing?.contentType, 'Content-Type', { maxLength: 160 }),
    sizeBytes: normalizeInteger(candidate.sizeBytes ?? existing?.sizeBytes, 'Dateigroesse', { min: 0, max: 100_000_000 }),
    ...(candidate.imageWidth ?? existing?.imageWidth ? { imageWidth: normalizeInteger(candidate.imageWidth ?? existing?.imageWidth, 'Bildbreite', { min: 1, max: 100_000 }) } : {}),
    ...(candidate.imageHeight ?? existing?.imageHeight ? { imageHeight: normalizeInteger(candidate.imageHeight ?? existing?.imageHeight, 'Bildhoehe', { min: 1, max: 100_000 }) } : {}),
    status: normalizeLogoUploadStatus(candidate.status ?? existing?.status ?? 'pending'),
    uploadedAt: normalizeIsoTimestamp(candidate.uploadedAt ?? existing?.uploadedAt, now),
    ...(candidate.approvedAt || existing?.approvedAt ? { approvedAt: normalizeIsoTimestamp(candidate.approvedAt ?? existing?.approvedAt, now) } : {}),
    ...(candidate.rejectedAt || existing?.rejectedAt ? { rejectedAt: normalizeIsoTimestamp(candidate.rejectedAt ?? existing?.rejectedAt, now) } : {}),
    ...(normalizeOptionalText(candidate.rejectionReason ?? existing?.rejectionReason, 'Ablehnungsgrund', 1_000)
      ? { rejectionReason: normalizeOptionalText(candidate.rejectionReason ?? existing?.rejectionReason, 'Ablehnungsgrund', 1_000) }
      : {}),
  } satisfies EventSponsoringLogoUpload;
}
