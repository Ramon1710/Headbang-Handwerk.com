import type { Metadata } from 'next';
import { Navigation } from '@/components/navigation';
import { Footer } from '@/components/footer';
import { SponsorPackageCard } from '@/components/sponsor-package-card';
import { sponsorPackages } from '@/lib/data';
import { Check } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Sponsoren – Headbang Handwerk',
  description: 'Sponsoring-Pakete für Headbang Handwerk. Sichert euch eure Sichtbarkeit auf unseren Festivals.',
};

const benefits = [
  'Direkte Ansprache der Zielgruppe auf Festivals',
  'Logo auf Website, Banner und Social Media',
  'Auf Wunsch Spendenquittung (kein Verein, steuerlich klären)',
  'Persönliche Betreuung durch unser Team',
  'Flexibel buchbar – einzelne Festivals oder Gesamtsaison',
  'Hohes Medien- und Social-Media-Potenzial',
];

export default function SponsorenPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-[#0a0a0a] pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-14 max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl font-black text-white mb-4">
              Sponsoring{' '}
              <span className="text-orange-500">Pakete</span>
            </h1>
            <p className="text-gray-400 text-lg">
              Bringt eure Marke auf die Hauptbühne des deutschen Handwerks – inmitten der
              lautesten Festivals Europas.
            </p>
          </div>

          {/* Benefits */}
          <div className="rounded-xl border border-[#2a2a2a] bg-[#141414] p-8 mb-14">
            <h2 className="text-white font-bold text-xl mb-6">Was ihr bekommt</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {benefits.map((b) => (
                <div key={b} className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-400 text-sm">{b}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Packages */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-14">
            {sponsorPackages.map((pkg) => (
              <SponsorPackageCard key={pkg.id} pkg={pkg} />
            ))}
          </div>

          {/* Custom package note */}
          <div className="text-center rounded-xl border border-[#2a2a2a] bg-[#141414] p-8">
            <h3 className="text-white font-bold text-xl mb-2">Individuelles Paket gewünscht?</h3>
            <p className="text-gray-400 text-sm mb-6 max-w-lg mx-auto">
              Ihr habt besondere Anforderungen oder wollt etwas ganz Eigenes? Wir erstellen
              euch gerne ein maßgeschneidertes Angebot.
            </p>
            <a
              href="/kontakt"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-md border border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-black font-semibold text-sm transition-all"
            >
              Jetzt anfragen
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
