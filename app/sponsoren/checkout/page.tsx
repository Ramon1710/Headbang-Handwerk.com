'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navigation } from '@/components/navigation';
import { Footer } from '@/components/footer';
import { sponsorPackages } from '@/lib/data';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

function CheckoutContent() {
  const params = useSearchParams();
  const packageId = params.get('package') || 'silber';
  const pkg = sponsorPackages.find((p) => p.id === packageId) ?? sponsorPackages[1];
  const [loading, setLoading] = useState(false);
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: pkg.id, company, email }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      alert('Fehler beim Starten der Zahlung. Bitte kontaktiert uns direkt.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] pt-24 pb-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <h1 className="text-3xl font-black text-white mb-8">
          Paket <span className="text-orange-500">{pkg.name}</span> buchen
        </h1>

        <div className="rounded-xl border border-[#2a2a2a] bg-[#141414] p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-white font-bold text-xl">{pkg.name}</span>
            <span className="text-orange-500 font-black text-2xl">{formatPrice(pkg.price)}</span>
          </div>
          <ul className="space-y-2">
            {pkg.features.map((f) => (
              <li key={f} className="text-gray-400 text-sm flex items-start gap-2">
                <span className="text-orange-500 mt-0.5">✓</span> {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4 mb-8">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Unternehmensname</label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-[#0a0a0a] border border-[#2a2a2a] text-white text-sm placeholder-gray-600 focus:outline-none focus:border-orange-500 transition-colors"
              placeholder="Mustermann GmbH"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">E-Mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-[#0a0a0a] border border-[#2a2a2a] text-white text-sm placeholder-gray-600 focus:outline-none focus:border-orange-500 transition-colors"
              placeholder="rechnung@unternehmen.de"
            />
          </div>
        </div>

        <Button onClick={handleCheckout} size="lg" className="w-full" disabled={loading}>
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Weiterleitung zu Stripe...</>
          ) : (
            `Jetzt bezahlen – ${formatPrice(pkg.price)}`
          )}
        </Button>

        <p className="text-gray-600 text-xs mt-4 text-center">
          Sichere Zahlung via Stripe. Nach Zahlungseingang erhaltet ihr eine Bestätigung per E-Mail.
        </p>
      </div>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <>
      <Navigation />
      <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] pt-24 flex items-center justify-center text-gray-400">Laden...</div>}>
        <CheckoutContent />
      </Suspense>
      <Footer />
    </>
  );
}
