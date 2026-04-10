'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { sponsorPackages } from '@/lib/data';
import { formatPrice } from '@/lib/utils';

export function CheckoutClient() {
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
      <div className="content-flow mx-auto max-w-2xl px-4 sm:px-6">
        <h1 className="text-3xl font-black text-white">
          Paket <span className="text-[color:var(--color-accent)]">{pkg.name}</span> buchen
        </h1>

        <div className="mb-8 rounded-xl border border-[#2a2a2a] bg-[#141414] p-6">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xl font-bold text-white">{pkg.name}</span>
            <span className="text-2xl font-black text-[color:var(--color-accent)]">{formatPrice(pkg.price)}</span>
          </div>
          <ul className="space-y-2">
            {pkg.features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-gray-400">
                <span className="mt-0.5 text-[color:var(--color-accent)]">✓</span> {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="mb-8 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm text-gray-400">Unternehmensname</label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full rounded-lg border border-[color:var(--color-border)] bg-black/30 px-4 py-2.5 text-sm text-white placeholder-gray-600 transition-colors focus:border-[color:var(--color-accent)] focus:outline-none"
              placeholder="Mustermann GmbH"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-gray-400">E-Mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-[color:var(--color-border)] bg-black/30 px-4 py-2.5 text-sm text-white placeholder-gray-600 transition-colors focus:border-[color:var(--color-accent)] focus:outline-none"
              placeholder="rechnung@unternehmen.de"
            />
          </div>
        </div>

        <Button onClick={handleCheckout} size="lg" className="w-full" disabled={loading}>
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Weiterleitung zu Stripe...</>
          ) : (
            `Jetzt bezahlen – ${formatPrice(pkg.price)}`
          )}
        </Button>

        <p className="text-center text-xs text-gray-600">
          Sichere Zahlung via Stripe. Nach Zahlungseingang erhaltet ihr eine Bestätigung per E-Mail.
        </p>
      </div>
    </main>
  );
}