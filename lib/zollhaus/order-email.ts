import { createHash, randomUUID } from 'node:crypto';
import { sendMailWithMetadata } from '@/lib/email';
import type { ZollhausCheckoutStore } from '@/lib/zollhaus/checkout';
import { normalizeZollhausOrder } from '@/lib/zollhaus/validation';
import type { ZollhausOrder, ZollhausOrderEmailErrorCategory, ZollhausOrderEmailStatus } from '@/lib/zollhaus/types';

const CLAIM_TIMEOUT_MS = 5 * 60 * 1000;

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
    messageId: string;
    headers: Record<string, string>;
  }): Promise<{ messageId?: string | null }>;
}

export interface ZollhausOrderEmailLogger {
  info(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
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

export function createZollhausOrderEmailMessageId(order: Pick<ZollhausOrder, 'id' | 'orderNumber'>) {
  const digest = createHash('sha256').update(order.id).update(':').update(order.orderNumber).digest('hex').slice(0, 24);
  return `<zollhaus-order-${digest}@${getMessageIdDomain()}>`;
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

async function claimZollhausOrderEmailSend(orderId: string, now: Date, store: ZollhausCheckoutStore) {
  const nowIso = now.toISOString();
  const claimId = randomUUID();

  return store.runTransaction(async (transaction) => {
    const order = await transaction.getOrder(orderId);

    if (!order) {
      throw new Error('ORDER_NOT_FOUND');
    }

    const claimState = canClaimEmailSend(order.email, now.getTime());

    if (!claimState.allowed) {
      return {
        claimed: false,
        reason: claimState.reason,
        order,
      } as const;
    }

    const nextOrder = normalizeZollhausOrder(
      {
        ...order,
        email: {
          ...order.email,
          state: 'sending',
          attemptCount: order.email.attemptCount + 1,
          lastAttemptAt: nowIso,
          sendingClaimId: claimId,
          sendingClaimedAt: nowIso,
        },
      },
      { existing: order, now: nowIso },
    );

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

    if (order.email.sendingClaimId !== params.claimId) {
      return order;
    }

    const nextOrder = normalizeZollhausOrder(
      {
        ...order,
        email: {
          ...order.email,
          state: params.sent ? 'sent' : 'failed',
          ...(params.sent ? { sentAt: nowIso } : {}),
          ...(params.providerMessageId ? { providerMessageId: params.providerMessageId } : {}),
          ...(params.category ? { lastErrorCategory: params.category } : {}),
          ...(!params.sent ? {} : { lastErrorCategory: undefined }),
        },
      },
      { existing: order, now: nowIso },
    );

    delete (nextOrder.email as Partial<ZollhausOrder['email']>).sendingClaimId;
    delete (nextOrder.email as Partial<ZollhausOrder['email']>).sendingClaimedAt;

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

export async function sendZollhausOrderEmail(
  orderId: string,
  options?: {
    store?: ZollhausCheckoutStore;
    transport?: ZollhausOrderEmailTransport;
    logger?: ZollhausOrderEmailLogger;
    now?: () => Date;
  },
) {
  const now = options?.now?.() ?? new Date();
  const store = await resolveStore(options?.store);
  const transport = options?.transport || getDefaultTransport();
  const logger = options?.logger || getDefaultLogger();
  const claim = await claimZollhausOrderEmailSend(orderId, now, store);

  if (!claim.claimed) {
    return {
      status: 'skipped',
      reason: claim.reason,
      order: claim.order,
    } satisfies ZollhausOrderEmailOutcome;
  }

  const recipient = await getRecipientAddress(store);

  if (!recipient || !isSmtpConfigured()) {
    const category = 'not_configured' as const;
    const failedOrder = await finalizeZollhausOrderEmailSend({
      orderId,
      claimId: claim.claimId,
      sent: false,
      now,
      store,
      category,
    });
    logger.error('Zollhaus order email failed', { orderNumber: claim.order.orderNumber, category });
    return { status: 'failed', order: failedOrder, category } satisfies ZollhausOrderEmailOutcome;
  }

  const content = buildZollhausOrderEmailContent(claim.order);
  const messageId = createZollhausOrderEmailMessageId(claim.order);

  try {
    const result = await transport.send({
      to: recipient,
      subject: content.subject,
      text: content.text,
      html: content.html,
      messageId,
      headers: {
        'X-Zollhaus-Order-Number': claim.order.orderNumber,
      },
    });

    const sentOrder = await finalizeZollhausOrderEmailSend({
      orderId,
      claimId: claim.claimId,
      sent: true,
      now,
      store,
      providerMessageId: result.messageId || messageId,
    });
    logger.info('Zollhaus order email sent', { orderNumber: claim.order.orderNumber });
    return { status: 'sent', order: sentOrder, messageId: result.messageId || messageId } satisfies ZollhausOrderEmailOutcome;
  } catch (error) {
    const category = categorizeEmailError(error);
    const failedOrder = await finalizeZollhausOrderEmailSend({
      orderId,
      claimId: claim.claimId,
      sent: false,
      now,
      store,
      category,
    });
    logger.error('Zollhaus order email failed', { orderNumber: claim.order.orderNumber, category });
    return { status: 'failed', order: failedOrder, category } satisfies ZollhausOrderEmailOutcome;
  }
}

export async function retryZollhausOrderEmail(
  orderId: string,
  options?: {
    store?: ZollhausCheckoutStore;
    transport?: ZollhausOrderEmailTransport;
    logger?: ZollhausOrderEmailLogger;
    now?: () => Date;
  },
) {
  return sendZollhausOrderEmail(orderId, options);
}