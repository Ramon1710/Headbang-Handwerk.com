import { NextRequest, NextResponse } from 'next/server';

/**
 * RECHTLICHER HINWEIS:
 * Headbang Handwerk ist kein eingetragener gemeinnütziger Verein (e.V.).
 * Steuerlich absetzbare Spendenquittungen gemäß § 10b EStG können daher
 * nicht ausgestellt werden. Diese Route erstellt nur eine einfache
 * Zahlungsbestätigung für Buchhaltungszwecke.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { paymentId, companyName, address, amount } = body;

    if (!paymentId || !companyName || !amount) {
      return NextResponse.json({ error: 'Pflichtfelder fehlen' }, { status: 400 });
    }

    const receiptNumber = `HH-${Date.now()}`;

    const receipt = {
      receiptNumber,
      paymentId,
      companyName,
      address: address || '',
      amount,
      date: new Date().toLocaleDateString('de-DE'),
      purpose: 'Sponsoring – Headbang Handwerk Festival-Saison 2025',
      disclaimer:
        'Diese Zahlungsbestätigung ist keine steuerlich absetzbare Spendenquittung im Sinne des § 10b EStG. Headbang Handwerk ist kein eingetragener gemeinnütziger Verein.',
    };

    // TODO: Generate PDF and send via email
    console.log('Receipt generated:', receipt);

    return NextResponse.json({ success: true, receipt });
  } catch (err) {
    console.error('Receipt error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
