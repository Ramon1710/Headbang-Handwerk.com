import { createHash, randomUUID } from 'node:crypto';
import { sendMailWithMetadata } from '@/lib/email';
import { resolveEventDetailViewMode } from '@/lib/events';
import { formatEuroCents } from '@/lib/event-sponsoring/money';
import { deleteEventSponsoringLogoFile, readEventSponsoringLogoFile, uploadEventSponsoringLogoFile } from '@/lib/event-sponsoring/logo-upload-storage';
import { validateEventSponsoringLogoUpload } from '@/lib/event-sponsoring/logo-upload';
import { getEventSponsoringStore, type EventSponsoringStore } from '@/lib/event-sponsoring/store';
import type { EventSponsoringLogoUpload, EventSponsoringPackage, EventSponsoringRequest, EventSponsoringRequestEmailErrorCategory } from '@/lib/event-sponsoring/types';
import { normalizeEventSponsoringCheckoutIdempotencyKey, normalizeEventSponsoringRequest } from '@/lib/event-sponsoring/validation';
import type { Event } from '@/lib/types';

const CLAIM_TIMEOUT_MS = 5 * 60 * 1000;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface EventSponsoringMailAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
}

export interface EventSponsoringMailPayload {
  to: string;
  subject: string;
  text: string;
  html: string;
  messageId: string;
  headers: Record<string, string>;
  attachments?: EventSponsoringMailAttachment[];
}

export interface EventSponsoringRequestSubmission {
  eventId: string;
  packageId: string;
  idempotencyKey: string;
  companyName: string;
  companyWebsite?: string;
  contactFirstName: string;
  contactLastName: string;
  email: string;
  phone: string;
  billingStreet: string;
  billingHouseNumber: string;
  billingPostalCode: string;
  billingCity: string;
  billingCountryCode: string;
  message?: string;
  supportTypes: string[];
  publicDisplayEnabled: boolean;
  acceptDataProcessing: boolean;
  acceptInvoicePayment: boolean;
  acceptManualLogoPlacement: boolean;
  logoFile?: File | null;
}

export interface EventSponsoringRequestDependencies {
  store: EventSponsoringStore;
  getEventById(eventId: string): Promise<Event | null>;
  now?: () => Date;
  sendMail?: (payload: EventSponsoringMailPayload) => Promise<{ messageId?: string | null }>;
  uploadLogoFile?: typeof uploadEventSponsoringLogoFile;
  readLogoFile?: typeof readEventSponsoringLogoFile;
  deleteLogoFile?: typeof deleteEventSponsoringLogoFile;
}

export class EventSponsoringRequestError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = 'EventSponsoringRequestError';
  }
}

function assertRequest(condition: unknown, code: string, message: string): asserts condition {
  if (!condition) {
    throw new EventSponsoringRequestError(code, message);
  }
}

function sha256(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

function getMessageIdDomain() {
  const from = String(process.env.SMTP_FROM || process.env.SMTP_USER || 'localhost').trim();
  const domainCandidate = from.includes('@') ? from.slice(from.lastIndexOf('@') + 1).replace(/[>\s].*$/, '') : 'localhost';
  const normalized = domainCandidate.toLowerCase().replace(/[^a-z0-9.-]/g, '');
  return normalized || 'localhost';
}

function sanitizeHeaderValue(value: string) {
  return value.replace(/[\r\n]+/g, ' ').trim();
}

function sanitizeErrorDetail(value: string) {
  return value.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 400);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function categorizeEmailError(error: unknown): EventSponsoringRequestEmailErrorCategory {
  const message = error instanceof Error ? error.message : String(error || '');

  if (message.includes('SMTP is not configured') || message.includes('recipient-not-configured')) {
    return 'not_configured';
  }

  if (message) {
    return 'transport_error';
  }

  return 'unknown';
}

function getSanitizedEmailErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || '');

  if (!message || message.includes('SMTP is not configured') || message.includes('recipient-not-configured')) {
    return 'Empfaengeradresse oder SMTP-Konfiguration fehlt.';
  }

  return sanitizeErrorDetail(message);
}

function formatPackageKind(kind: EventSponsoringRequest['packageKind']) {
  if (kind === 'small_logo') {
    return 'Kleines Logopaket';
  }

  if (kind === 'medium_logo') {
    return 'Mittleres Logopaket';
  }

  if (kind === 'large_logo') {
    return 'Grosses Logopaket';
  }

  if (kind === 'custom_request') {
    return 'Individuelles Sponsoring';
  }

  return 'Anonyme Unterstuetzung';
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' });
}

function formatReference(requestId: string) {
  return requestId.replace(/-/g, '').slice(0, 8).toUpperCase();
}

function isValidSingleRecipientEmail(value: string) {
  return EMAIL_REGEX.test(value) && !value.includes(',') && !value.includes(';') && !value.includes('\n') && !value.includes('\r');
}

function getRecipientAddress() {
  const recipient = String(process.env.EVENT_SPONSORING_RECIPIENT_EMAIL || '').trim();

  if (!recipient) {
    throw new Error('recipient-not-configured');
  }

  if (!isValidSingleRecipientEmail(recipient)) {
    throw new Error('recipient-invalid');
  }

  return recipient;
}

function canClaimEmailSend(request: EventSponsoringRequest, nowMs: number) {
  if (request.emailDelivery.state === 'sent') {
    return { allowed: false as const, reason: 'already-sent' as const };
  }

  if (request.emailDelivery.state === 'sending' && request.emailDelivery.sendingClaimedAt) {
    const claimedAt = new Date(request.emailDelivery.sendingClaimedAt).getTime();

    if (!Number.isNaN(claimedAt) && nowMs - claimedAt < CLAIM_TIMEOUT_MS) {
      return { allowed: false as const, reason: 'already-sending' as const };
    }
  }

  return { allowed: true as const };
}

function buildPackagePriceSnapshot(pkg: EventSponsoringPackage, minimumAmountCents: number) {
  if (pkg.kind === 'anonymous_support' && pkg.priceCents <= 0) {
    return minimumAmountCents;
  }

  return pkg.priceCents;
}

function normalizeSubmission(input: EventSponsoringRequestSubmission) {
  return {
    eventId: String(input.eventId || '').trim(),
    packageId: String(input.packageId || '').trim(),
    idempotencyKey: normalizeEventSponsoringCheckoutIdempotencyKey(input.idempotencyKey),
    companyName: String(input.companyName || '').trim(),
    companyWebsite: String(input.companyWebsite || '').trim(),
    contactFirstName: String(input.contactFirstName || '').trim(),
    contactLastName: String(input.contactLastName || '').trim(),
    email: String(input.email || '').trim(),
    phone: String(input.phone || '').trim(),
    billingStreet: String(input.billingStreet || '').trim(),
    billingHouseNumber: String(input.billingHouseNumber || '').trim(),
    billingPostalCode: String(input.billingPostalCode || '').trim(),
    billingCity: String(input.billingCity || '').trim(),
    billingCountryCode: String(input.billingCountryCode || '').trim(),
    message: String(input.message || '').trim(),
    supportTypes: Array.isArray(input.supportTypes) ? input.supportTypes.map((entry) => String(entry || '').trim()).filter(Boolean) : [],
    publicDisplayEnabled: Boolean(input.publicDisplayEnabled),
    acceptDataProcessing: Boolean(input.acceptDataProcessing),
    acceptInvoicePayment: Boolean(input.acceptInvoicePayment),
    acceptManualLogoPlacement: Boolean(input.acceptManualLogoPlacement),
    logoFile: input.logoFile instanceof File ? input.logoFile : null,
  };
}

export function createEventSponsoringRequestIdempotencyKey() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `evtspreq_${crypto.randomUUID().replace(/-/g, '')}`;
  }

  return `evtspreq_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 18)}`;
}

export function createEventSponsoringRequestHash(input: Omit<EventSponsoringRequestSubmission, 'logoFile'> & { logoFileMeta?: { name: string; size: number; type: string } | null }) {
  return sha256(JSON.stringify(input));
}

export function createEventSponsoringRequestMessageId(request: Pick<EventSponsoringRequest, 'id' | 'eventId'>) {
  const digest = createHash('sha256').update(request.id).update(':').update(request.eventId).digest('hex').slice(0, 24);
  return `<event-sponsoring-request-${digest}@${getMessageIdDomain()}>`;
}

function buildEmailContent(params: {
  request: EventSponsoringRequest;
  event: Event;
  packagePriceCents?: number;
  logoUpload?: EventSponsoringLogoUpload | null;
  logoAttached: boolean;
  logoStorageReference?: string;
}) {
  const subject = sanitizeHeaderValue(`Neue Sponsoringanfrage – ${params.event.festivalName || params.event.title}`);
  const supportTypes = params.request.supportTypes.length > 0 ? params.request.supportTypes.join(', ') : 'keine';
  const priceLabel = typeof params.packagePriceCents === 'number' && params.packagePriceCents > 0 ? formatEuroCents(params.packagePriceCents) : 'individuelle Vereinbarung';
  const featureList = params.request.packageFeaturesSnapshot.length > 0 ? params.request.packageFeaturesSnapshot : ['keine gespeicherten Leistungen'];
  const contactLabel = `${params.request.contactLastName}, ${params.request.contactFirstName}`;
  const receivedAt = formatDateTime(params.request.createdAt);
  const reference = formatReference(params.request.id);
  const text = [
    `Anfrage-ID: ${params.request.id}`,
    `Referenz: ${reference}`,
    `Eingang: ${receivedAt}`,
    `Veranstaltung: ${params.event.festivalName || params.event.title}`,
    `Paket: ${params.request.packageNameSnapshot}`,
    `Paketart: ${formatPackageKind(params.request.packageKind)}`,
    `Paketpreis: ${priceLabel}`,
    'Leistungen:',
    ...featureList.map((feature) => `- ${feature}`),
    `Firma: ${params.request.companyName}`,
    `Website: ${params.request.companyWebsite || '-'}`,
    `Ansprechpartner: ${contactLabel}`,
    `E-Mail: ${params.request.email}`,
    `Telefon: ${params.request.phone}`,
    `Rechnungsadresse: ${params.request.billingAddress.street || ''} ${params.request.billingAddress.houseNumber || ''}, ${params.request.billingAddress.postalCode || ''} ${params.request.billingAddress.city || ''}, ${params.request.billingAddress.countryCode || ''}`,
    `Oeffentliche Darstellung erlaubt: ${params.request.publicDisplayEnabled ? 'ja' : 'nein'}`,
    `Anonyme Unterstuetzung: ${params.request.anonymousSupport ? 'ja' : 'nein'}`,
    `Unterstuetzungsarten: ${supportTypes}`,
    `Logo-Datei: ${params.logoUpload ? params.logoUpload.originalFileName : 'keine'}`,
    `Logo angehaengt: ${params.logoAttached ? 'ja' : 'nein'}`,
    `Interner Logo-Bezug: ${params.logoStorageReference || 'kein gespeichertes Logo'}`,
    'Hinweis: Zahlung erfolgt per Rechnung.',
    'Hinweis: Logoplatzierung erfolgt durch Headbang Handwerk.',
    '',
    params.request.message ? `Nachricht:\n${params.request.message}` : 'Keine weitere Nachricht.',
  ].join('\n');

  const html = [
    '<!doctype html><html><body style="font-family:Segoe UI,Arial,sans-serif;color:#111827;line-height:1.5;">',
    `<h1 style="font-size:24px;margin:0 0 16px;">${escapeHtml(subject)}</h1>`,
    '<table style="border-collapse:collapse;margin:0 0 20px;">',
    `<tr><td style="padding:4px 12px 4px 0;"><strong>Anfrage-ID</strong></td><td>${escapeHtml(params.request.id)}</td></tr>`,
    `<tr><td style="padding:4px 12px 4px 0;"><strong>Referenz</strong></td><td>${escapeHtml(reference)}</td></tr>`,
    `<tr><td style="padding:4px 12px 4px 0;"><strong>Eingang</strong></td><td>${escapeHtml(receivedAt)}</td></tr>`,
    `<tr><td style="padding:4px 12px 4px 0;"><strong>Veranstaltung</strong></td><td>${escapeHtml(params.event.festivalName || params.event.title)}</td></tr>`,
    `<tr><td style="padding:4px 12px 4px 0;"><strong>Paket</strong></td><td>${escapeHtml(params.request.packageNameSnapshot)}</td></tr>`,
    `<tr><td style="padding:4px 12px 4px 0;"><strong>Paketart</strong></td><td>${escapeHtml(formatPackageKind(params.request.packageKind))}</td></tr>`,
    `<tr><td style="padding:4px 12px 4px 0;"><strong>Paketpreis</strong></td><td>${escapeHtml(priceLabel)}</td></tr>`,
    `<tr><td style="padding:4px 12px 4px 0;"><strong>Firma</strong></td><td>${escapeHtml(params.request.companyName)}</td></tr>`,
    `<tr><td style="padding:4px 12px 4px 0;"><strong>Website</strong></td><td>${escapeHtml(params.request.companyWebsite || '-')}</td></tr>`,
    `<tr><td style="padding:4px 12px 4px 0;"><strong>Ansprechpartner</strong></td><td>${escapeHtml(contactLabel)}</td></tr>`,
    `<tr><td style="padding:4px 12px 4px 0;"><strong>E-Mail</strong></td><td>${escapeHtml(params.request.email)}</td></tr>`,
    `<tr><td style="padding:4px 12px 4px 0;"><strong>Telefon</strong></td><td>${escapeHtml(params.request.phone)}</td></tr>`,
    `<tr><td style="padding:4px 12px 4px 0;"><strong>Unterstuetzungsarten</strong></td><td>${escapeHtml(supportTypes)}</td></tr>`,
    `<tr><td style="padding:4px 12px 4px 0;"><strong>Logo-Datei</strong></td><td>${escapeHtml(params.logoUpload?.originalFileName || 'keine')}</td></tr>`,
    `<tr><td style="padding:4px 12px 4px 0;"><strong>Logo angehaengt</strong></td><td>${params.logoAttached ? 'ja' : 'nein'}</td></tr>`,
    `<tr><td style="padding:4px 12px 4px 0;"><strong>Interner Logo-Bezug</strong></td><td>${escapeHtml(params.logoStorageReference || 'kein gespeichertes Logo')}</td></tr>`,
    '</table>',
    '<p><strong>Leistungen zum Anfragezeitpunkt:</strong></p>',
    `<ul>${featureList.map((feature) => `<li>${escapeHtml(feature)}</li>`).join('')}</ul>`,
    `<p><strong>Rechnungsadresse:</strong> ${escapeHtml(`${params.request.billingAddress.street || ''} ${params.request.billingAddress.houseNumber || ''}, ${params.request.billingAddress.postalCode || ''} ${params.request.billingAddress.city || ''}, ${params.request.billingAddress.countryCode || ''}`)}</p>`,
    `<p><strong>Oeffentliche Darstellung erlaubt:</strong> ${params.request.publicDisplayEnabled ? 'ja' : 'nein'}</p>`,
    `<p><strong>Anonyme Unterstuetzung:</strong> ${params.request.anonymousSupport ? 'ja' : 'nein'}</p>`,
    '<p><strong>Hinweis:</strong> Zahlung erfolgt per Rechnung.</p>',
    '<p><strong>Hinweis:</strong> Logoplatzierung erfolgt durch Headbang Handwerk.</p>',
    `<p><strong>Nachricht:</strong><br>${escapeHtml(params.request.message || 'Keine weitere Nachricht.').replace(/\n/g, '<br>')}</p>`,
    '</body></html>',
  ].join('');

  return { subject, text, html };
}

async function claimRequestEmailSend(requestId: string, now: Date, store: EventSponsoringStore) {
  const nowIso = now.toISOString();
  const claimId = randomUUID();

  return store.runTransaction(async (transaction) => {
    const request = await transaction.getRequest(requestId);
    if (!request) {
      throw new Error('REQUEST_NOT_FOUND');
    }

    const claimState = canClaimEmailSend(request, now.getTime());

    if (!claimState.allowed) {
      return { claimed: false, reason: claimState.reason, request } as const;
    }

    const nextRequest = normalizeEventSponsoringRequest({
      ...request,
      emailDelivery: {
        ...request.emailDelivery,
        state: 'sending',
        attemptCount: request.emailDelivery.attemptCount + 1,
        lastAttemptAt: nowIso,
        sendingClaimId: claimId,
        sendingClaimedAt: nowIso,
      },
    }, { existing: request, now: nowIso });

    await transaction.saveRequest(nextRequest);
    return { claimed: true, claimId, request: nextRequest } as const;
  });
}

async function finalizeRequestEmailSend(params: {
  requestId: string;
  claimId: string;
  sent: boolean;
  now: Date;
  store: EventSponsoringStore;
  providerMessageId?: string | null;
  category?: EventSponsoringRequestEmailErrorCategory;
  errorMessage?: string;
}) {
  const nowIso = params.now.toISOString();

  return params.store.runTransaction(async (transaction) => {
    const request = await transaction.getRequest(params.requestId);
    if (!request || request.emailDelivery.sendingClaimId !== params.claimId) {
      return request;
    }

    const nextRequest = normalizeEventSponsoringRequest({
      ...request,
      emailDelivery: {
        ...request.emailDelivery,
        state: params.sent ? 'sent' : 'failed',
        ...(params.sent ? { sentAt: nowIso } : {}),
        ...(params.providerMessageId ? { providerMessageId: params.providerMessageId } : {}),
        ...(params.category ? { lastErrorCategory: params.category } : {}),
        ...(params.sent ? { lastErrorMessage: undefined } : {}),
        ...(params.errorMessage ? { lastErrorMessage: params.errorMessage } : {}),
      },
    }, { existing: request, now: nowIso });

    await transaction.saveRequest(nextRequest);
    return nextRequest;
  });
}

export async function sendEventSponsoringRequestNotification(requestId: string, options?: EventSponsoringRequestDependencies) {
  const store = options?.store ?? getEventSponsoringStore();
  const now = options?.now ?? (() => new Date());
  const sendMail = options?.sendMail ?? sendMailWithMetadata;
  const readLogoFile = options?.readLogoFile ?? readEventSponsoringLogoFile;
  const claimed = await claimRequestEmailSend(requestId, now(), store);

  if (!claimed.claimed) {
    return claimed;
  }

  const event = await (options?.getEventById ? options.getEventById(claimed.request.eventId) : Promise.resolve(null));
  assertRequest(event, 'event_not_found', 'Die Veranstaltung wurde nicht gefunden.');

  const logoUpload = claimed.request.logoUploadId
    ? await store.runTransaction((transaction) => transaction.getLogoUpload(claimed.request.logoUploadId || ''))
    : null;
  let recipient = '';

  try {
    recipient = getRecipientAddress();
  } catch (error) {
    const category = categorizeEmailError(error);
    await finalizeRequestEmailSend({ requestId, claimId: claimed.claimId, sent: false, now: now(), store, category, errorMessage: getSanitizedEmailErrorMessage(error) });
    throw new EventSponsoringRequestError('recipient_not_configured', 'Die Empfaengeradresse fuer Sponsoringanfragen ist nicht gueltig konfiguriert.');
  }

  let attachments: EventSponsoringMailAttachment[] | undefined;
  let logoAttached = false;
  let logoStorageReference = logoUpload ? `${logoUpload.storageBucket || 'bucket-unbekannt'}:${logoUpload.storagePath}` : undefined;

  if (logoUpload) {
    try {
      const attachment = await readLogoFile(logoUpload);
      attachments = [{
        filename: attachment.filename,
        content: attachment.content,
        contentType: attachment.contentType,
      }];
      logoAttached = true;
      logoStorageReference = `${attachment.storageBucket}:${attachment.storagePath}`;
    } catch {
      logoAttached = false;
    }
  }

  const message = buildEmailContent({
    request: claimed.request,
    event,
    packagePriceCents: claimed.request.packagePriceCents,
    logoUpload,
    logoAttached,
    logoStorageReference,
  });

  try {
    const result = await sendMail({
      to: recipient,
      subject: message.subject,
      text: message.text,
      html: message.html,
      messageId: createEventSponsoringRequestMessageId(claimed.request),
      headers: {
        'X-Headbang-Event-Sponsoring-Request-Id': claimed.request.id,
        'X-Headbang-Event-Sponsoring-Event-Id': claimed.request.eventId,
      },
      ...(attachments ? { attachments } : {}),
    });
    await finalizeRequestEmailSend({ requestId, claimId: claimed.claimId, sent: true, now: now(), store, providerMessageId: result.messageId });
    return { status: 'sent' as const, requestId, messageId: result.messageId || null };
  } catch (error) {
    const category = categorizeEmailError(error);
    await finalizeRequestEmailSend({ requestId, claimId: claimed.claimId, sent: false, now: now(), store, category, errorMessage: getSanitizedEmailErrorMessage(error) });
    throw error;
  }
}

export async function submitEventSponsoringRequest(submission: EventSponsoringRequestSubmission, dependencies: EventSponsoringRequestDependencies) {
  const normalized = normalizeSubmission(submission);
  const store = dependencies.store;
  const now = dependencies.now ? dependencies.now() : new Date();
  const nowIso = now.toISOString();
  const uploadLogoFile = dependencies.uploadLogoFile ?? uploadEventSponsoringLogoFile;
  const deleteLogoFile = dependencies.deleteLogoFile ?? deleteEventSponsoringLogoFile;
  const event = await dependencies.getEventById(normalized.eventId);

  assertRequest(event, 'event_not_found', 'Die Veranstaltung wurde nicht gefunden.');
  assertRequest(resolveEventDetailViewMode(event) === 'sponsoring2d', 'wrong_mode', 'Diese Veranstaltung verwendet kein Sponsoring-Detail.');

  const { config, pkg } = await store.runTransaction(async (transaction) => {
    const loadedConfig = await transaction.getConfig(normalized.eventId);
    const packages = await transaction.listPackages(normalized.eventId);
    return {
      config: loadedConfig,
      pkg: packages.find((entry) => entry.id === normalized.packageId) || null,
    };
  });

  assertRequest(config?.enabled, 'config_disabled', 'Sponsoringanfragen sind fuer diese Veranstaltung aktuell nicht freigeschaltet.');
  assertRequest(pkg && pkg.active, 'package_not_found', 'Das gewaehlte Sponsoringpaket ist nicht verfuegbar.');
  assertRequest(!(pkg.kind === 'custom_request' && !config.customSponsoringEnabled), 'package_not_available', 'Individuelles Sponsoring ist aktuell nicht freigeschaltet.');
  assertRequest(!(pkg.kind === 'anonymous_support' && !config.anonymousSupportEnabled), 'package_not_available', 'Anonyme Unterstuetzung ist aktuell nicht freigeschaltet.');

  const requiresLogo = pkg.grantsBannerPlacement && pkg.logoSlotSize !== 'none';
  assertRequest(!requiresLogo || normalized.logoFile, 'logo_required', 'Fuer dieses Paket muss eine Logo-Datei hochgeladen werden.');
  assertRequest(!normalized.logoFile || normalized.logoFile.size <= 5 * 1024 * 1024, 'logo_too_large', 'Logo-Dateien duerfen maximal 5 MB gross sein.');

  const requestHash = createEventSponsoringRequestHash({
    eventId: normalized.eventId,
    packageId: normalized.packageId,
    idempotencyKey: normalized.idempotencyKey,
    companyName: normalized.companyName,
    companyWebsite: normalized.companyWebsite,
    contactFirstName: normalized.contactFirstName,
    contactLastName: normalized.contactLastName,
    email: normalized.email,
    phone: normalized.phone,
    billingStreet: normalized.billingStreet,
    billingHouseNumber: normalized.billingHouseNumber,
    billingPostalCode: normalized.billingPostalCode,
    billingCity: normalized.billingCity,
    billingCountryCode: normalized.billingCountryCode,
    message: normalized.message,
    supportTypes: normalized.supportTypes,
    publicDisplayEnabled: normalized.publicDisplayEnabled,
    acceptDataProcessing: normalized.acceptDataProcessing,
    acceptInvoicePayment: normalized.acceptInvoicePayment,
    acceptManualLogoPlacement: normalized.acceptManualLogoPlacement,
    logoFileMeta: normalized.logoFile ? { name: normalized.logoFile.name, size: normalized.logoFile.size, type: normalized.logoFile.type } : null,
  });
  const idempotencyKeyHash = sha256(normalized.idempotencyKey);

  const existing = await store.runTransaction((transaction) => transaction.getRequestByIdempotencyKeyHash(idempotencyKeyHash));

  if (existing) {
    assertRequest(existing.requestHash === requestHash, 'idempotency_conflict', 'Diese Anfrage wurde bereits mit abweichenden Daten uebermittelt.');
    return { request: existing, duplicated: true as const };
  }

  const requestId = randomUUID();
  let savedLogoUpload: EventSponsoringLogoUpload | null = null;

  if (normalized.logoFile) {
    const validatedLogo = await validateEventSponsoringLogoUpload(normalized.logoFile);
    const upload = await uploadLogoFile({
      validatedFile: validatedLogo,
      originalFileName: normalized.logoFile.name,
      eventId: normalized.eventId,
      requestId,
      logoUploadId: `logo_${requestId.replace(/-/g, '')}`,
      nowIso,
    });
    savedLogoUpload = upload.logoUpload;
  }

  const request = normalizeEventSponsoringRequest({
    id: requestId,
    eventId: normalized.eventId,
    packageId: pkg.id,
    packageKind: pkg.kind,
    packageNameSnapshot: pkg.name,
    packagePriceCents: buildPackagePriceSnapshot(pkg, config.anonymousMinimumAmountCents),
    currencyCode: pkg.currencyCode,
    companyName: normalized.companyName,
    companyWebsite: normalized.companyWebsite,
    contactFirstName: normalized.contactFirstName,
    contactLastName: normalized.contactLastName,
    contactName: `${normalized.contactFirstName} ${normalized.contactLastName}`.trim(),
    billingAddress: {
      company: normalized.companyName,
      street: normalized.billingStreet,
      houseNumber: normalized.billingHouseNumber,
      postalCode: normalized.billingPostalCode,
      city: normalized.billingCity,
      countryCode: normalized.billingCountryCode.toUpperCase(),
    },
    email: normalized.email,
    phone: normalized.phone,
    supportTypes: pkg.kind === 'custom_request' ? normalized.supportTypes : [],
    message: normalized.message,
    publicDisplayEnabled: pkg.kind === 'anonymous_support' ? false : normalized.publicDisplayEnabled,
    anonymousSupport: pkg.kind === 'anonymous_support',
    acceptDataProcessing: normalized.acceptDataProcessing,
    acceptInvoicePayment: normalized.acceptInvoicePayment,
    acceptManualLogoPlacement: normalized.acceptManualLogoPlacement,
    packageFeaturesSnapshot: [...pkg.features],
    logoUploadId: savedLogoUpload?.id,
    idempotencyKeyHash,
    requestHash,
    status: 'new',
    emailDelivery: {
      state: 'pending',
      attemptCount: 0,
    },
  }, { now: nowIso });

  try {
    await store.runTransaction(async (transaction) => {
      if (savedLogoUpload) {
        await transaction.saveLogoUpload(savedLogoUpload);
      }
      await transaction.saveRequest(request);
    });
  } catch (error) {
    if (savedLogoUpload) {
      try {
        await deleteLogoFile(savedLogoUpload);
      } catch (cleanupError) {
        console.error('Event sponsoring orphan logo cleanup failed', {
          eventId: normalized.eventId,
          requestId,
          logoUploadId: savedLogoUpload.id,
          cleanupError: cleanupError instanceof Error ? cleanupError.message : 'unknown',
        });
      }
    }

    throw error;
  }

  try {
    await sendEventSponsoringRequestNotification(request.id, {
      store,
      getEventById: dependencies.getEventById,
      now: dependencies.now,
      sendMail: dependencies.sendMail,
      readLogoFile: dependencies.readLogoFile,
    });
  } catch {
    // Anfrage bleibt gespeichert; Mailstatus wird separat als failed markiert.
  }

  return { request, duplicated: false as const };
}