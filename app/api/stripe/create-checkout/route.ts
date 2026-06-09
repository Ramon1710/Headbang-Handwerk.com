import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getCmsContent } from '@/lib/cms/storage';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2026-02-25.clover',
});

export async function POST(req: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
    }

    const { kind = 'sponsoring', packageId, company, email, productId, size, color, quantity } = await req.json();
    const cms = await getCmsContent();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    if (kind === 'merchandise') {
      const product = cms.site.merchandise.products.find((entry) => entry.id === productId);
      const orderQuantity = Math.max(1, Math.min(10, Number(quantity) || 1));

      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer_email: email || undefined,
        line_items: [
          {
            price_data: {
              currency: 'eur',
              unit_amount: Math.round(product.price * 100),
              product_data: {
                name: `Headbang Handwerk – ${product.name}`,
                description: [product.description, size ? `Größe: ${size}` : '', color ? `Farbe: ${color}` : ''].filter(Boolean).join(' · '),
              },
            },
            quantity: orderQuantity,
          },
        ],
        metadata: {
          orderKind: 'merchandise',
          productId: product.id,
          productName: product.name,
          size: size || '',
          color: color || '',
          quantity: String(orderQuantity),
        },
        success_url: `${appUrl}/merchandise/danke?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}/merchandise`,
      });

      return NextResponse.json({ url: session.url });
    }

    const pkg = cms.site.sponsorPackages.find((p) => p.id === packageId);
    if (!pkg) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: email || undefined,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            unit_amount: Math.round(pkg.price * 100),
            product_data: {
              name: `Headbang Handwerk – Sponsoring ${pkg.name}`,
              description: pkg.visibility,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        orderKind: 'sponsoring',
        packageId: pkg.id,
        company: company || '',
      },
      success_url: `${appUrl}/sponsoren/danke?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/sponsoren/checkout?package=${pkg.id}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
