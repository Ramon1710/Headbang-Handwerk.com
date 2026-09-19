import { createHash, randomUUID } from 'node:crypto';
import { sendMailWithMetadata } from '@/lib/email';
import type { ZollhausCheckoutStore } from '@/lib/zollhaus/checkout';
import { normalizeZollhausOrder } from '@/lib/zollhaus/validation';
import type { ZollhausOrder, ZollhausOrderEmailErrorCategory, ZollhausOrderEmailStatus } from '@/lib/zollhaus/types';

const CLAIM_TIMEOUT_MS = 5 * 60 * 1000;
const ZOLLHAUS_CUSTOMER_REPLY_TO = 'info@zollhaus-leer.com';

type ZollhausOrderEmailKind = 'internal' | 'customer';

export type ZollhausOrderEmailOutcome =
  | { status: 'sent'; order: ZollhausOrder; messageId: string | null }
  | { status: 'failed'; order: ZollhausOrder; category: ZollhausOrderEmailErrorCategory }
  | { status: 'skipped'; reason: 'already-sent' | 'already-sending'; order: ZollhausOrder };

export interface ZollhausOrderEmailTransport {
  send(input: {
    to: string;
    subject: string;
    text: string;
    html: string;
    from?: string;
    replyTo?: string;
    messageId: string;
    headers: Record<string, string>;
  }): Promise<{ messageId?: string | null }>;
}

export interface ZollhausOrderEmailLogger {
  info(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}

interface ZollhausOrderEmailContent {
  subject: string;
  text: string;
  html: string;
  from?: string;
  replyTo?: string;
}

interface ZollhausOrderEmailSendOptions {
  store?: ZollhausCheckoutStore;
  transport?: ZollhausOrderEmailTransport;
  logger?: ZollhausOrderEmailLogger;
  now?: () => Date;
}

function getDefaultTransport(): ZollhausOrderEmailTransport {
  return {
    async send(input) {
      return sendMailWithMetadata(input);
    },
  };
}

function getDefaultLogger(): ZollhausOrderEmailLogger {
  return {
    info(message, meta) {
      console.info(message, meta || {});
    },
    error(message, meta) {
      console.error(message, meta || {});
    },
  };
}

async function getRecipientAddress(store?: ZollhausCheckoutStore) {
  const explicitRecipient = String(process.env.ZOLLHAUS_ORDER_EMAIL || '').trim();

  if (explicitRecipient) {
    return explicitRecipient;
  }

  try {
    if (store) {
      const settings = await store.runTransaction(async (transaction) => transaction.getSettings());
      return String(settings?.supportEmail || '').trim();
    }

    const { getResolvedZollhausShopSettings } = await import('@/lib/zollhaus/settings');
    const settings = await getResolvedZollhausShopSettings();
    return String(settings.supportEmail || '').trim();
  } catch {
    return '';
  }
}

function sanitizeEmailHeaderValue(value: string, label: string) {
  const normalized = sanitizeHeaderValue(value);

  if (!normalized) {
    throw new Error(`${label} fehlt.`);
  }

  if (/[\r\n]/.test(value)) {
    throw new Error(`${label} ist ungueltig.`);
  }

  return normalized;
}

function isValidEmailAddress(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function sanitizeEmailAddress(value: string, label: string) {
  const normalized = sanitizeEmailHeaderValue(value, label);

  if (!isValidEmailAddress(normalized)) {
    throw new Error(`${label} ist ungueltig.`);
  }

  return normalized;
}

function extractConfiguredSenderAddress() {
  const configured = String(process.env.SMTP_FROM || process.env.SMTP_USER || '').trim();
  const match = configured.match(/<([^>]+)>/);
  const candidate = match?.[1] || configured;
  return sanitizeEmailAddress(candidate, 'Absenderadresse');
}

function buildDisplaySender(displayName: string) {
  const safeDisplayName = sanitizeHeaderValue(displayName).replace(/[<>]/g, '');
  const address = extractConfiguredSenderAddress();
  return `${safeDisplayName} <${address}>`;
}

function isSmtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function sanitizeHeaderValue(value: string) {
  return value.replace(/[\r\n]+/g, ' ').trim();
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatEuro(value: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value / 100);
}

function getMessageIdDomain() {
  const from = String(process.env.SMTP_FROM || process.env.SMTP_USER || 'localhost').trim();
  const domainCandidate = from.includes('@') ? from.slice(from.lastIndexOf('@') + 1).replace(/[>\s].*$/, '') : 'localhost';
  const normalized = domainCandidate.toLowerCase().replace(/[^a-z0-9.-]/g, '');
  return normalized || 'localhost';
}

function categorizeEmailError(error: unknown): ZollhausOrderEmailErrorCategory {
  const message = error instanceof Error ? error.message : String(error || '');

  if (message.includes('SMTP is not configured') || message.includes('recipient-not-configured')) {
    return 'not_configured';
  }

  if (message.includes('Empfaengeradresse ist ungueltig') || message.includes('Kundenadresse ist ungueltig') || message.includes('Reply-To ist ungueltig') || message.includes('Absenderadresse ist ungueltig')) {
    return 'invalid_recipient';
  }

  if (message) {
    return 'transport_error';
  }

  return 'unknown';
}

async function resolveStore(store?: ZollhausCheckoutStore) {
  if (store) {
    return store;
  }

  const module = await import('@/lib/zollhaus/checkout-store');
  return module.getZollhausCheckoutStore();
}

function canClaimEmailSend(email: ZollhausOrderEmailStatus, nowMs: number) {
  if (email.state === 'sent') {
    return { allowed: false as const, reason: 'already-sent' as const };
  }

  if (email.state === 'sending' && email.sendingClaimedAt) {
    const claimedAt = new Date(email.sendingClaimedAt).getTime();

    if (!Number.isNaN(claimedAt) && nowMs - claimedAt < CLAIM_TIMEOUT_MS) {
      return { allowed: false as const, reason: 'already-sending' as const };
    }
  }

  return { allowed: true as const };
}

function getEmailStatusForKind(order: ZollhausOrder, kind: ZollhausOrderEmailKind) {
  return kind === 'internal' ? order.email : order.customerEmail;
}

function getSafeEmailErrorMessage(category: ZollhausOrderEmailErrorCategory) {
  switch (category) {
    case 'not_configured':
      return 'Mailversand ist nicht konfiguriert.';
    case 'invalid_recipient':
      return 'Empfaengeradresse ist ungueltig.';
    case 'transport_error':
      return 'Mailversand fehlgeschlagen.';
    default:
      return 'Unbekannter Mailfehler.';
  }
}

function applyEmailStatusForKind(order: ZollhausOrder, kind: ZollhausOrderEmailKind, emailStatus: ZollhausOrderEmailStatus) {
  return kind === 'internal'
    ? { ...order, email: emailStatus }
    : { ...order, customerEmail: emailStatus };
}

export function createZollhausOrderEmailMessageId(order: Pick<ZollhausOrder, 'id' | 'orderNumber'>, kind: ZollhausOrderEmailKind = 'internal') {
  const digest = createHash('sha256').update(order.id).update(':').update(order.orderNumber).update(':').update(kind).digest('hex').slice(0, 24);
  return `<zollhaus-order-${kind}-${digest}@${getMessageIdDomain()}>`;
}

export function buildZollhausOrderEmailContent(order: ZollhausOrder) {
  const subject = sanitizeHeaderValue(`Neue Zollhaus-Bestellung – ${order.orderNumber}`);
  const orderDate = new Date(order.createdAt).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' });
  const text = [
    `Bestellnummer: ${order.orderNumber}`,
    `Bestelldatum: ${orderDate}`,
    `Vorname: ${order.customer.firstName}`,
    `Nachname: ${order.customer.lastName}`,
    `Strasse: ${order.customer.street}`,
    `Hausnummer: ${order.customer.houseNumber}`,
    `Postleitzahl: ${order.customer.postalCode}`,
    `Ort: ${order.customer.city}`,
    `E-Mail-Adresse: ${order.customer.email}`,
    `Telefonnummer: ${order.customer.phone}`,
    '',
    'Bestellte Artikel:',
    ...order.items.map((item) => `- ${item.productSnapshot.name} | Menge: ${item.quantity} | Einzelpreis: ${formatEuro(item.unitPriceCents)}`),
    '',
    `Gesamtpreis: ${formatEuro(order.totalPriceCents)}`,
    'Hinweis: Bestellung auf Rechnung',
    `Aktueller Bestellstatus: ${order.status}`,
  ].join('\n');

  const html = [
    '<!doctype html>',
    '<html><body style="font-family:Segoe UI,Arial,sans-serif;color:#111827;line-height:1.5;">',
    `<h1 style="font-size:24px;margin:0 0 16px;">${escapeHtml(subject)}</h1>`,
    '<table style="border-collapse:collapse;margin:0 0 20px;">',
    `<tr><td style="padding:4px 12px 4px 0;"><strong>Bestellnummer</strong></td><td>${escapeHtml(order.orderNumber)}</td></tr>`,
    `<tr><td style="padding:4px 12px 4px 0;"><strong>Bestelldatum</strong></td><td>${escapeHtml(orderDate)}</td></tr>`,
    `<tr><td style="padding:4px 12px 4px 0;"><strong>Vorname</strong></td><td>${escapeHtml(order.customer.firstName)}</td></tr>`,
    `<tr><td style="padding:4px 12px 4px 0;"><strong>Nachname</strong></td><td>${escapeHtml(order.customer.lastName)}</td></tr>`,
    `<tr><td style="padding:4px 12px 4px 0;"><strong>Strasse</strong></td><td>${escapeHtml(order.customer.street)}</td></tr>`,
    `<tr><td style="padding:4px 12px 4px 0;"><strong>Hausnummer</strong></td><td>${escapeHtml(order.customer.houseNumber)}</td></tr>`,
    `<tr><td style="padding:4px 12px 4px 0;"><strong>Postleitzahl</strong></td><td>${escapeHtml(order.customer.postalCode)}</td></tr>`,
    `<tr><td style="padding:4px 12px 4px 0;"><strong>Ort</strong></td><td>${escapeHtml(order.customer.city)}</td></tr>`,
    `<tr><td style="padding:4px 12px 4px 0;"><strong>E-Mail-Adresse</strong></td><td>${escapeHtml(order.customer.email)}</td></tr>`,
    `<tr><td style="padding:4px 12px 4px 0;"><strong>Telefonnummer</strong></td><td>${escapeHtml(order.customer.phone)}</td></tr>`,
    `<tr><td style="padding:4px 12px 4px 0;"><strong>Bestellstatus</strong></td><td>${escapeHtml(order.status)}</td></tr>`,
    '</table>',
    '<p style="margin:0 0 12px;"><strong>Hinweis:</strong> Bestellung auf Rechnung</p>',
    '<table style="border-collapse:collapse;width:100%;max-width:760px;">',
    '<thead><tr><th align="left" style="padding:8px 10px;border-bottom:2px solid #9ca3af;">Artikel</th><th align="left" style="padding:8px 10px;border-bottom:2px solid #9ca3af;">Menge</th><th align="left" style="padding:8px 10px;border-bottom:2px solid #9ca3af;">Einzelpreis</th></tr></thead>',
    '<tbody>',
    ...order.items.map(
      (item) => `<tr><td style="padding:8px 10px;border-bottom:1px solid #d1d5db;">${escapeHtml(item.productSnapshot.name)}</td><td style="padding:8px 10px;border-bottom:1px solid #d1d5db;">${item.quantity}</td><td style="padding:8px 10px;border-bottom:1px solid #d1d5db;">${escapeHtml(formatEuro(item.unitPriceCents))}</td></tr>`,
    ),
    '</tbody>',
    '</table>',
    `<p style="margin:16px 0 0;"><strong>Gesamtpreis:</strong> ${escapeHtml(formatEuro(order.totalPriceCents))}</p>`,
    '</body></html>',
  ].join('');

  return { subject, text, html };
}

function getOptionalItemVariant(item: ZollhausOrder['items'][number]) {
  const itemRecord = item as unknown as Record<string, unknown>;
  const snapshotRecord = item.productSnapshot as unknown as Record<string, unknown>;
  const candidates = [
    itemRecord.variantLabel,
    itemRecord.variant,
    snapshotRecord.variantLabel,
    snapshotRecord.variant,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }

  return null;
}

function buildCustomerOrderConfirmationContent(order: ZollhausOrder): ZollhausOrderEmailContent {
  const subject = sanitizeHeaderValue(`Bestellbestätigung – Bestellung ${order.orderNumber}`);
  const orderDate = new Date(order.createdAt).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' });
  const replyTo = sanitizeEmailAddress(ZOLLHAUS_CUSTOMER_REPLY_TO, 'Reply-To');
  const from = buildDisplaySender('Zollhaus Shop');
  const itemLines = order.items.map((item) => {
    const variant = getOptionalItemVariant(item);
    const lineTotal = formatEuro(item.unitPriceCents * item.quantity);
    return {
      name: item.productName,
      variant,
      quantity: String(item.quantity),
      unitPrice: formatEuro(item.unitPriceCents),
      lineTotal,
    };
  });

  const customerDetails = [
    ['Vorname', order.customer.firstName],
    ['Nachname', order.customer.lastName],
    ['E-Mail-Adresse', order.customer.email],
    ['Telefonnummer', order.customer.phone],
    ['Straße', order.customer.street],
    ['Hausnummer', order.customer.houseNumber],
    ['Postleitzahl', order.customer.postalCode],
    ['Ort', order.customer.city],
  ].filter(([, value]) => Boolean(String(value || '').trim()));

  const text = [
    `Guten Tag ${order.customer.firstName} ${order.customer.lastName},`,
    '',
    'vielen Dank für Ihre Bestellung im Zollhaus-Shop. Das Zollhaus-Team bedankt sich für Ihr Vertrauen.',
    '',
    'Wir haben den Eingang Ihrer Bestellung bestätigt. Das Zollhaus-Team wird Ihre Bestellung nun bearbeiten, die Rechnung erstellen und Ihnen diese in Kürze separat per E-Mail zusenden.',
    '',
    'Bitte verwenden Sie für die Zahlung ausschließlich die Zahlungsinformationen aus der Rechnung, die Sie direkt vom Zollhaus-Team erhalten. Nach Eingang Ihrer Zahlung wird die Ware durch das Zollhaus-Team an die von Ihnen angegebene Lieferadresse versandt.',
    '',
    'Nachfolgend finden Sie eine Zusammenfassung Ihrer Bestellung.',
    '',
    `Bestellnummer: ${order.orderNumber}`,
    `Bestelldatum: ${orderDate}`,
    '',
    'Bestellübersicht',
    ...itemLines.flatMap((item) => [
      `- Produktname: ${item.name}`,
      ...(item.variant ? [`  Variante: ${item.variant}`] : []),
      `  Menge: ${item.quantity}`,
      `  Einzelpreis: ${item.unitPrice}`,
      `  Positionssumme: ${item.lineTotal}`,
    ]),
    `Zwischensumme: ${formatEuro(order.totalPriceCents)}`,
    `Gesamtsumme: ${formatEuro(order.totalPriceCents)}`,
    '',
    'Ihre Angaben',
    ...customerDetails.map(([label, value]) => `${label}: ${value}`),
    '',
    'Bitte beachten Sie: Diese E-Mail bestätigt ausschließlich den Eingang Ihrer Bestellung. Sie ist keine Rechnung und enthält noch keine Zahlungsaufforderung. Die Rechnung wird Ihnen separat durch das Zollhaus-Team zugesandt.',
    '',
    'Vielen Dank für Ihre Bestellung.',
    '',
    'Ihr Zollhaus-Team',
    '',
    'Falls Sie diese E-Mail irrtümlich erhalten haben, bitten wir Sie um eine kurze Rückmeldung an info@zollhaus-leer.com. Löschen Sie diese Nachricht anschließend bitte.',
  ].join('\n');

  const html = [
    '<!doctype html>',
    '<html><body style="margin:0;padding:24px;background:#f4fbfd;color:#1f2528;font-family:Segoe UI,Arial,sans-serif;line-height:1.6;">',
    '<div style="max-width:720px;margin:0 auto;background:#ffffff;border:1px solid #d7e9ef;border-radius:20px;overflow:hidden;">',
    '<div style="height:6px;background:linear-gradient(90deg,#ffd54d,#c7f1d8,#d9f0ff);"></div>',
    '<div style="padding:28px 24px;">',
    `<h1 style="margin:0 0 18px;font-size:28px;line-height:1.2;color:#1f2528;">${escapeHtml(subject)}</h1>`,
    `<p style="margin:0 0 16px;">Guten Tag ${escapeHtml(order.customer.firstName)} ${escapeHtml(order.customer.lastName)},</p>`,
    '<p style="margin:0 0 16px;">vielen Dank für Ihre Bestellung im Zollhaus-Shop. Das Zollhaus-Team bedankt sich für Ihr Vertrauen.</p>',
    '<p style="margin:0 0 16px;">Wir haben den Eingang Ihrer Bestellung bestätigt. Das Zollhaus-Team wird Ihre Bestellung nun bearbeiten, die Rechnung erstellen und Ihnen diese in Kürze separat per E-Mail zusenden.</p>',
    '<p style="margin:0 0 20px;">Bitte verwenden Sie für die Zahlung ausschließlich die Zahlungsinformationen aus der Rechnung, die Sie direkt vom Zollhaus-Team erhalten. Nach Eingang Ihrer Zahlung wird die Ware durch das Zollhaus-Team an die von Ihnen angegebene Lieferadresse versandt.</p>',
    '<p style="margin:0 0 20px;">Nachfolgend finden Sie eine Zusammenfassung Ihrer Bestellung.</p>',
    '<div style="border:1px solid #d7e9ef;border-radius:16px;padding:16px 18px;background:#f9fcff;margin:0 0 20px;">',
    `<p style="margin:0 0 8px;"><strong>Bestellnummer:</strong> ${escapeHtml(order.orderNumber)}</p>`,
    `<p style="margin:0;"><strong>Bestelldatum:</strong> ${escapeHtml(orderDate)}</p>`,
    '</div>',
    '<h2 style="margin:0 0 12px;font-size:20px;">Bestellübersicht</h2>',
    '<div style="overflow-x:auto;margin:0 0 20px;">',
    '<table style="width:100%;border-collapse:collapse;min-width:520px;">',
    '<thead><tr><th align="left" style="padding:10px;border-bottom:2px solid #cfe4ef;">Produkt</th><th align="left" style="padding:10px;border-bottom:2px solid #cfe4ef;">Menge</th><th align="left" style="padding:10px;border-bottom:2px solid #cfe4ef;">Einzelpreis</th><th align="left" style="padding:10px;border-bottom:2px solid #cfe4ef;">Positionssumme</th></tr></thead>',
    '<tbody>',
    ...itemLines.map((item) => `<tr><td style="padding:10px;border-bottom:1px solid #e3eef2;overflow-wrap:anywhere;"><strong>${escapeHtml(item.name)}</strong>${item.variant ? `<div style="margin-top:4px;color:#5a6d73;">Variante: ${escapeHtml(item.variant)}</div>` : ''}</td><td style="padding:10px;border-bottom:1px solid #e3eef2;">${escapeHtml(item.quantity)}</td><td style="padding:10px;border-bottom:1px solid #e3eef2;">${escapeHtml(item.unitPrice)}</td><td style="padding:10px;border-bottom:1px solid #e3eef2;">${escapeHtml(item.lineTotal)}</td></tr>`),
    `<tr><td colspan="3" style="padding:12px 10px;border-bottom:1px solid #e3eef2;"><strong>Zwischensumme</strong></td><td style="padding:12px 10px;border-bottom:1px solid #e3eef2;"><strong>${escapeHtml(formatEuro(order.totalPriceCents))}</strong></td></tr>`,
    `<tr><td colspan="3" style="padding:12px 10px;"><strong>Gesamtsumme</strong></td><td style="padding:12px 10px;"><strong>${escapeHtml(formatEuro(order.totalPriceCents))}</strong></td></tr>`,
    '</tbody></table></div>',
    '<h2 style="margin:0 0 12px;font-size:20px;">Ihre Angaben</h2>',
    '<div style="border:1px solid #d7e9ef;border-radius:16px;padding:16px 18px;background:#f9fcff;margin:0 0 20px;">',
    ...customerDetails.map(([label, value]) => `<p style="margin:0 0 8px;overflow-wrap:anywhere;"><strong>${escapeHtml(label)}:</strong> ${escapeHtml(String(value))}</p>`),
    '</div>',
    '<div style="border:1px solid #f1d7b8;border-radius:16px;padding:16px 18px;background:#fff7ef;margin:0 0 20px;">',
    '<strong>Bitte beachten Sie:</strong> Diese E-Mail bestätigt ausschließlich den Eingang Ihrer Bestellung. Sie ist keine Rechnung und enthält noch keine Zahlungsaufforderung. Die Rechnung wird Ihnen separat durch das Zollhaus-Team zugesandt.',
    '</div>',
    '<p style="margin:0 0 6px;">Vielen Dank für Ihre Bestellung.</p>',
    '<p style="margin:0 0 18px;">Ihr Zollhaus-Team</p>',
    '<p style="margin:0;color:#5a6d73;font-size:14px;">Falls Sie diese E-Mail irrtümlich erhalten haben, bitten wir Sie um eine kurze Rückmeldung an <a href="mailto:info@zollhaus-leer.com" style="color:#2b6f8f;">info@zollhaus-leer.com</a>. Löschen Sie diese Nachricht anschließend bitte.</p>',
    '</div></div></body></html>',
  ].join('');

  return { subject, text, html, from, replyTo };
}

async function claimZollhausOrderEmailSend(orderId: string, kind: ZollhausOrderEmailKind, now: Date, store: ZollhausCheckoutStore) {
  const nowIso = now.toISOString();
  const claimId = randomUUID();

  return store.runTransaction(async (transaction) => {
    const order = await transaction.getOrder(orderId);

    if (!order) {
      throw new Error('ORDER_NOT_FOUND');
    }

    const currentEmailStatus = getEmailStatusForKind(order, kind);
    const claimState = canClaimEmailSend(currentEmailStatus, now.getTime());

    if (!claimState.allowed) {
      return {
        claimed: false,
        reason: claimState.reason,
        order,
      } as const;
    }

    const nextEmailStatus: ZollhausOrderEmailStatus = {
      ...currentEmailStatus,
      state: 'sending',
      attemptCount: currentEmailStatus.attemptCount + 1,
      lastAttemptAt: nowIso,
      sendingClaimId: claimId,
      sendingClaimedAt: nowIso,
    };

    const nextOrder = normalizeZollhausOrder(applyEmailStatusForKind(order, kind, nextEmailStatus), {
      existing: order,
      now: nowIso,
      tolerateInvalidCustomerEmail: true,
    });

    await transaction.saveOrder(nextOrder);

    return {
      claimed: true,
      claimId,
      order: nextOrder,
    } as const;
  });
}

async function finalizeZollhausOrderEmailSend(params: {
  orderId: string;
  kind: ZollhausOrderEmailKind;
  claimId: string;
  sent: boolean;
  now: Date;
  store: ZollhausCheckoutStore;
  providerMessageId?: string | null;
  category?: ZollhausOrderEmailErrorCategory;
}) {
  const nowIso = params.now.toISOString();

  return params.store.runTransaction(async (transaction) => {
    const order = await transaction.getOrder(params.orderId);

    if (!order) {
      throw new Error('ORDER_NOT_FOUND');
    }

    const currentEmailStatus = getEmailStatusForKind(order, params.kind);

    if (currentEmailStatus.sendingClaimId !== params.claimId) {
      return order;
    }

    const nextEmailStatus: ZollhausOrderEmailStatus = {
      ...currentEmailStatus,
      state: params.sent ? 'sent' : 'failed',
      ...(params.sent ? { sentAt: nowIso } : {}),
      ...(params.providerMessageId ? { providerMessageId: params.providerMessageId } : {}),
      ...(params.category ? { lastErrorCategory: params.category } : {}),
      ...(params.category ? { lastErrorMessage: getSafeEmailErrorMessage(params.category) } : {}),
      ...(!params.sent ? {} : { lastErrorCategory: undefined, lastErrorMessage: undefined }),
    };

    delete (nextEmailStatus as Partial<ZollhausOrderEmailStatus>).sendingClaimId;
    delete (nextEmailStatus as Partial<ZollhausOrderEmailStatus>).sendingClaimedAt;

    const nextOrder = normalizeZollhausOrder(applyEmailStatusForKind(order, params.kind, nextEmailStatus), {
      existing: order,
      now: nowIso,
      tolerateInvalidCustomerEmail: true,
    });

    await transaction.saveOrder(nextOrder);
    return nextOrder;
  });
}

export async function getZollhausOrderEmailStatus(orderId: string) {
  const store = await resolveStore();
  return store.runTransaction(async (transaction) => {
    const order = await transaction.getOrder(orderId);
    return order?.email || null;
  });
}

export async function isZollhausOrderEmailSent(orderId: string) {
  const email = await getZollhausOrderEmailStatus(orderId);
  return email?.state === 'sent';
}

async function sendZollhausOrderEmailByKind(
  kind: ZollhausOrderEmailKind,
  orderId: string,
  options: ZollhausOrderEmailSendOptions | undefined,
  resolveRecipient: (order: ZollhausOrder, store: ZollhausCheckoutStore) => Promise<string>,
  buildContent: (order: ZollhausOrder) => ZollhausOrderEmailContent,
) {
  const now = options?.now?.() ?? new Date();
  const store = await resolveStore(options?.store);
  const transport = options?.transport || getDefaultTransport();
  const logger = options?.logger || getDefaultLogger();
  const claim = await claimZollhausOrderEmailSend(orderId, kind, now, store);

  if (!claim.claimed) {
    return {
      status: 'skipped',
      reason: claim.reason,
      order: claim.order,
    } satisfies ZollhausOrderEmailOutcome;
  }

  let recipient = '';

  try {
    recipient = await resolveRecipient(claim.order, store);
  } catch (error) {
    const category = categorizeEmailError(error);
    const failedOrder = await finalizeZollhausOrderEmailSend({
      orderId,
      kind,
      claimId: claim.claimId,
      sent: false,
      now,
      store,
      category,
    });
    logger.error(`Zollhaus ${kind} email failed`, { orderNumber: claim.order.orderNumber, category });
    return { status: 'failed', order: failedOrder, category } satisfies ZollhausOrderEmailOutcome;
  }

  if (!recipient || !isSmtpConfigured()) {
    const category = 'not_configured' as const;
    const failedOrder = await finalizeZollhausOrderEmailSend({
      orderId,
      kind,
      claimId: claim.claimId,
      sent: false,
      now,
      store,
      category,
    });
    logger.error(`Zollhaus ${kind} email failed`, { orderNumber: claim.order.orderNumber, category });
    return { status: 'failed', order: failedOrder, category } satisfies ZollhausOrderEmailOutcome;
  }

  const content = buildContent(claim.order);
  const messageId = createZollhausOrderEmailMessageId(claim.order, kind);

  try {
    const result = await transport.send({
      to: sanitizeEmailAddress(recipient, kind === 'internal' ? 'Empfaengeradresse' : 'Kundenadresse'),
      subject: content.subject,
      text: content.text,
      html: content.html,
      ...(content.from ? { from: sanitizeEmailHeaderValue(content.from, 'Absenderadresse') } : {}),
      ...(content.replyTo ? { replyTo: sanitizeEmailAddress(content.replyTo, 'Reply-To') } : {}),
      messageId,
      headers: {
        'X-Zollhaus-Order-Number': claim.order.orderNumber,
        'X-Zollhaus-Mail-Kind': kind,
      },
    });

    const sentOrder = await finalizeZollhausOrderEmailSend({
      orderId,
      kind,
      claimId: claim.claimId,
      sent: true,
      now,
      store,
      providerMessageId: result.messageId || messageId,
    });
    logger.info(`Zollhaus ${kind} email sent`, { orderNumber: claim.order.orderNumber });
    return { status: 'sent', order: sentOrder, messageId: result.messageId || messageId } satisfies ZollhausOrderEmailOutcome;
  } catch (error) {
    const category = categorizeEmailError(error);
    const failedOrder = await finalizeZollhausOrderEmailSend({
      orderId,
      kind,
      claimId: claim.claimId,
      sent: false,
      now,
      store,
      category,
    });
    logger.error(`Zollhaus ${kind} email failed`, { orderNumber: claim.order.orderNumber, category });
    return { status: 'failed', order: failedOrder, category } satisfies ZollhausOrderEmailOutcome;
  }
}

export async function getZollhausCustomerOrderEmailStatus(orderId: string) {
  const store = await resolveStore();
  return store.runTransaction(async (transaction) => {
    const order = await transaction.getOrder(orderId);
    return order?.customerEmail || null;
  });
}

async function getRequiredOrder(store: ZollhausCheckoutStore, orderId: string) {
  const order = await store.runTransaction(async (transaction) => transaction.getOrder(orderId));

  if (!order) {
    throw new Error('ORDER_NOT_FOUND');
  }

  return order;
}

export async function sendZollhausOrderEmail(orderId: string, options?: ZollhausOrderEmailSendOptions) {
  return sendZollhausOrderEmailByKind(
    'internal',
    orderId,
    options,
    async (_, store) => getRecipientAddress(store),
    buildZollhausOrderEmailContent,
  );
}

export async function sendZollhausCustomerOrderConfirmation(orderId: string, options?: ZollhausOrderEmailSendOptions) {
  return sendZollhausOrderEmailByKind(
    'customer',
    orderId,
    options,
    async (order) => sanitizeEmailAddress(order.customer.email, 'Kundenadresse'),
    buildCustomerOrderConfirmationContent,
  );
}

export async function sendZollhausOrderEmails(
  orderId: string,
  options?: {
    store?: ZollhausCheckoutStore;
    internalTransport?: ZollhausOrderEmailTransport;
    customerTransport?: ZollhausOrderEmailTransport;
    logger?: ZollhausOrderEmailLogger;
    now?: () => Date;
  },
) {
  const logger = options?.logger || getDefaultLogger();

  let internal: ZollhausOrderEmailOutcome;
  try {
    internal = await sendZollhausOrderEmail(orderId, {
      store: options?.store,
      transport: options?.internalTransport,
      logger,
      now: options?.now,
    });
  } catch {
    logger.error('Zollhaus internal email failed unexpectedly', {});
    internal = { status: 'failed', order: await getRequiredOrder(await resolveStore(options?.store), orderId), category: 'unknown' };
  }

  let customer: ZollhausOrderEmailOutcome;
  try {
    customer = await sendZollhausCustomerOrderConfirmation(orderId, {
      store: options?.store,
      transport: options?.customerTransport,
      logger,
      now: options?.now,
    });
  } catch {
    logger.error('Zollhaus customer email failed unexpectedly', {});
    customer = { status: 'failed', order: await getRequiredOrder(await resolveStore(options?.store), orderId), category: 'unknown' };
  }

  return { internal, customer };
}

export async function retryZollhausOrderEmail(
  orderId: string,
  options?: ZollhausOrderEmailSendOptions,
) {
  return sendZollhausOrderEmail(orderId, options);
}

export async function retryZollhausCustomerOrderConfirmation(
  orderId: string,
  options?: ZollhausOrderEmailSendOptions,
) {
  return sendZollhausCustomerOrderConfirmation(orderId, options);
}