import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { sponsorPackages } from '@/lib/data';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2026-02-25.clover',
});

export async function POST(req: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
    }

    const { packageId, company, email } = await req.json();

    const pkg = sponsorPackages.find((p) => p.id === packageId);
    if (!pkg) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

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
