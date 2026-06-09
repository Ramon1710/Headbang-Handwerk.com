'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SponsorPackage } from '@/lib/types';
import { formatPrice } from '@/lib/utils';

interface CheckoutClientProps {
  sponsorPackages: SponsorPackage[];
}

export function CheckoutClient({ sponsorPackages }: CheckoutClientProps) {
  const params = useSearchParams();
  const packageId = params.get('package') || 'silber';
  const fallbackPackage = sponsorPackages.find((pkg) => pkg.highlighted) ?? sponsorPackages[0];
  const pkg = sponsorPackages.find((p) => p.id === packageId) ?? fallbackPackage;
  const [loading, setLoading] = useState(false);
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');

  if (!pkg) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] pt-24 pb-20">
        <div className="content-flow body-copy mx-auto max-w-2xl px-4 text-center sm:px-6">
          <h1 className="page-title text-[2.4rem]">Derzeit sind keine Sponsoring-Pakete verfügbar.</h1>
          <p>Bitte kontaktiert uns direkt, damit wir euch ein individuelles Angebot erstellen können.</p>
          <Button href="/kontakt" size="lg" className="mx-auto w-full max-w-sm">Kontakt aufnehmen</Button>
        </div>
      </main>
    );
  }

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
        <h1 className="page-title text-[2.4rem]">
          Paket <span>{pkg.name}</span> buchen
        </h1>

        <div className="content-box mb-8 rounded-xl border border-[#2a2a2a] bg-[#141414]">
          <div className="mb-4 flex items-center justify-between">
            <span className="section-title text-[1.5rem]">{pkg.name}</span>
            <span className="body-copy text-lg font-black">{formatPrice(pkg.price)}</span>
          </div>
          <ul className="space-y-2">
            {pkg.features.map((f) => (
              <li key={f} className="body-copy flex items-start gap-2 text-sm">
                <span className="mt-0.5 text-[color:var(--color-accent)]">✓</span> {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="mb-8 space-y-4">
          <div>
            <label className="body-copy mb-1.5 block text-sm">Unternehmensname</label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="body-copy w-full rounded-lg border border-[color:var(--color-border)] bg-black/30 px-4 py-2.5 text-sm transition-colors placeholder:text-[#9b8570] focus:border-[color:var(--color-accent)] focus:outline-none"
              placeholder="Mustermann GmbH"
            />
          </div>
          <div>
            <label className="body-copy mb-1.5 block text-sm">E-Mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="body-copy w-full rounded-lg border border-[color:var(--color-border)] bg-black/30 px-4 py-2.5 text-sm transition-colors placeholder:text-[#9b8570] focus:border-[color:var(--color-accent)] focus:outline-none"
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

        <p className="body-copy text-center text-xs">
          Sichere Zahlung via Stripe. Nach Zahlungseingang erhaltet ihr eine Bestätigung per E-Mail.
        </p>
      </div>
    </main>
  );
}