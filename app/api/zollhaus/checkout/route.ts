import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { hasTrustedRequestOrigin } from '@/lib/cms/auth';
import {
  ZOLLHAUS_CHECKOUT_HONEYPOT_FIELD,
  ZOLLHAUS_CHECKOUT_MAX_CART_ITEMS,
  ZOLLHAUS_CHECKOUT_MAX_TOTAL_QUANTITY,
  ZollhausCheckoutError,
} from '@/lib/zollhaus/checkout';
import { createZollhausConfirmationToken } from '@/lib/zollhaus/confirmation-token';
import { sendZollhausOrderEmails } from '@/lib/zollhaus/order-email';
import { assertZollhausOrderAllowed, getPublicOrderClientIp, recordZollhausOrderAttempt } from '@/lib/zollhaus/public-order-rate-limit';
import { submitPublicZollhausCheckout } from '@/lib/zollhaus/checkout-store';

function revalidateSuccessfulZollhausCheckout(productIds: string[]) {
  revalidatePath('/zollhaus');
  revalidatePath('/zollhaus/bestellen');
  revalidatePath('/zollhaus/admin');

  for (const productId of new Set(productIds.map((value) => value.trim()).filter(Boolean))) {
    revalidatePath(`/zollhaus/produkt/${encodeURIComponent(productId)}`);
  }
}

export async function POST(request: Request) {
  if (!hasTrustedRequestOrigin(request)) {
    return NextResponse.json({ error: 'Die Anfrage konnte nicht bestaetigt werden.' }, { status: 403 });
  }

  const rateLimit = await assertZollhausOrderAllowed(getPublicOrderClientIp(request));

  if (!rateLimit.allowed) {
    return NextResponse.json({ error: 'Zu viele Bestellversuche. Bitte spaeter erneut versuchen.' }, { status: 429 });
  }

  await recordZollhausOrderAttempt(rateLimit.store, rateLimit.key);

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Die Bestellung konnte nicht gelesen werden.' }, { status: 400 });
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Die Bestellung ist ungueltig.' }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;

  if (String(payload[ZOLLHAUS_CHECKOUT_HONEYPOT_FIELD] || '').trim()) {
    return NextResponse.json({ error: 'Die Bestellung konnte nicht bestaetigt werden.' }, { status: 400 });
  }

  const items = Array.isArray(payload.items) ? payload.items : [];
  const totalQuantity = items.reduce((sum, entry) => sum + Number((entry as Record<string, unknown>)?.quantity || 0), 0);

  if (items.length > ZOLLHAUS_CHECKOUT_MAX_CART_ITEMS || totalQuantity > ZOLLHAUS_CHECKOUT_MAX_TOTAL_QUANTITY) {
    return NextResponse.json({ error: 'Der Warenkorb ist zu gross.' }, { status: 400 });
  }

  try {
    const result = await submitPublicZollhausCheckout({
      idempotencyKey: String(payload.idempotencyKey || ''),
      customer: payload.customer as never,
      items: items as never,
    });

    revalidateSuccessfulZollhausCheckout(result.items.map((item) => item.productId));

    if (result.created) {
      try {
        await sendZollhausOrderEmails(result.orderId);
      } catch {
        console.error('Zollhaus order email dispatch failed unexpectedly', { orderNumber: result.orderNumber, category: 'unknown' });
      }
    }

    return NextResponse.json({
      ok: true,
      orderNumber: result.orderNumber,
      confirmationToken: createZollhausConfirmationToken({ orderId: result.orderId, orderNumber: result.orderNumber }),
    });
  } catch (error) {
    if (error instanceof ZollhausCheckoutError) {
      const status = error.code === 'idempotency_conflict' ? 409 : error.code === 'duplicate_request' ? 202 : 400;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Die Bestellung konnte gerade nicht gespeichert werden.' }, { status: 500 });
  }
}