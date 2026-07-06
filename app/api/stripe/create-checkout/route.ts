import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getCmsContent } from '@/lib/cms/storage';
import { buildCartMetadata, validateCheckoutCustomer } from '@/lib/merchandise';
import type { MerchandiseCartItem, MerchandiseCheckoutCustomer } from '@/lib/types';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2026-02-25.clover',
});

export async function POST(req: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
    }

    const { kind = 'sponsoring', packageId, company, email, productId, size, color, quantity, items, customer } = await req.json();
    const cms = await getCmsContent();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    if (kind === 'merchandise') {
      const rawItems = Array.isArray(items)
        ? (items as MerchandiseCartItem[])
        : productId
          ? [{ productId, size, color, quantity: Math.max(1, Math.min(10, Number(quantity) || 1)) } satisfies MerchandiseCartItem]
          : [];

      if (rawItems.length === 0) {
        return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
      }

      const customerValidation = validateCheckoutCustomer((customer || {}) as MerchandiseCheckoutCustomer);
      if (!customerValidation.valid) {
        return NextResponse.json({ error: customerValidation.message }, { status: 400 });
      }

      const sanitizedItems = rawItems.map((item) => ({
        productId: String(item.productId || ''),
        quantity: Math.max(1, Math.min(10, Number(item.quantity) || 1)),
        size: item.size ? String(item.size) : undefined,
        color: item.color ? String(item.color) : undefined,
      }));

      const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

      for (const item of sanitizedItems) {
        const product = cms.site.merchandise.products.find((entry) => entry.id === item.productId);

        if (!product) {
          return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        if (product.stripePriceId) {
          lineItems.push({
            price: product.stripePriceId,
            quantity: item.quantity,
          });
          continue;
        }

        lineItems.push({
          price_data: {
            currency: 'eur',
            unit_amount: Math.round(product.price * 100),
            product_data: {
              name: `Headbang Handwerk – ${product.name}`,
              description: [
                product.description,
                item.size ? `Größe: ${item.size}` : '',
                item.color ? `Farbe: ${item.color}` : '',
                product.estimatedDeliveryTime ? `Lieferzeit: ${product.estimatedDeliveryTime}` : '',
              ]
                .filter(Boolean)
                .join(' · '),
            },
          },
          quantity: item.quantity,
        });
      }

      const validatedCustomer = customerValidation.customer;

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer_creation: 'always',
        customer_email: validatedCustomer.email,
        billing_address_collection: 'required',
        phone_number_collection: { enabled: true },
        line_items: lineItems,
        metadata: {
          orderKind: 'merchandise',
          customerFirstName: validatedCustomer.firstName,
          customerLastName: validatedCustomer.lastName,
          customerStreet: validatedCustomer.street,
          customerHouseNumber: validatedCustomer.houseNumber,
          customerPostalCode: validatedCustomer.postalCode,
          customerCity: validatedCustomer.city,
          customerPhone: validatedCustomer.phone,
          ...buildCartMetadata(sanitizedItems),
        },
        success_url: `${appUrl}/merchandise/danke?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}/merchandise/checkout`,
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
