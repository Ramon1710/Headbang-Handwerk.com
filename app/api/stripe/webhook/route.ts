import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getCmsContent } from '@/lib/cms/storage';
import { formatVariantLabel, parseCartMetadata } from '@/lib/merchandise';
import { sendMail } from '@/lib/email';
import { formatPrice } from '@/lib/utils';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2026-02-25.clover',
});

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature') || '';

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 503 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature error:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.metadata?.orderKind === 'merchandise') {
        const cms = await getCmsContent();
        const cartItems = parseCartMetadata(session.metadata || {});
        const detailedItems = cartItems
          .map((item) => {
            const product = cms.site.merchandise.products.find((entry) => entry.id === item.productId);
            if (!product) {
              return null;
            }

            return {
              ...item,
              product,
            };
          })
          .filter(Boolean) as Array<{
            productId: string;
            quantity: number;
            size?: string;
            color?: string;
            product: (typeof cms.site.merchandise.products)[number];
          }>;

        const itemLines = detailedItems.map(({ product, quantity, size, color }) => {
          const variantLabel = formatVariantLabel({ size, color });
          const deliveryLabel = product.estimatedDeliveryTime ? ` | Lieferzeit: ${product.estimatedDeliveryTime}` : '';
          return `- ${product.name} | Menge: ${quantity}${variantLabel ? ` | ${variantLabel}` : ''}${deliveryLabel} | Einzelpreis: ${formatPrice(product.price)}`;
        });

        const customerName = [session.metadata?.customerFirstName, session.metadata?.customerLastName].filter(Boolean).join(' ');
        const text = [
          'Neue Merchandise-Bestellung eingegangen.',
          '',
          `Stripe Session: ${session.id}`,
          `Kunde: ${customerName}`,
          `E-Mail: ${session.customer_details?.email || session.customer_email || '-'}`,
          `Telefon: ${session.metadata?.customerPhone || session.customer_details?.phone || '-'}`,
          `Adresse: ${session.metadata?.customerStreet || '-'} ${session.metadata?.customerHouseNumber || ''}, ${session.metadata?.customerPostalCode || '-'} ${session.metadata?.customerCity || '-'}`,
          `Gesamtbetrag: ${formatPrice((session.amount_total || 0) / 100)}`,
          '',
          'Bestellte Artikel:',
          ...itemLines,
        ].join('\n');

        await sendMail({
          to: 'info@headbang-handwerk.de',
          subject: `Neue Merchandise-Bestellung ${customerName ? `von ${customerName}` : ''}`.trim(),
          text,
          html: text.replace(/\n/g, '<br />'),
        });
      }

      console.log('Payment completed:', {
        sessionId: session.id,
        amount: session.amount_total,
        orderKind: session.metadata?.orderKind,
        company: session.metadata?.company,
        packageId: session.metadata?.packageId,
      });
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
