import { Check, ArrowRight, Star } from 'lucide-react';
import { sponsorPackages } from '@/lib/data';
import { formatPrice } from '@/lib/utils';
import { Button } from './ui/button';
import { Card } from './ui/card';

export function SectionSponsoringPreview() {
  return (
    <section className="py-20 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
            Sponsoring{' '}
            <span className="text-orange-500">Pakete</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Sichert euch eure Sichtbarkeit auf unseren Festivals. Alle Pakete beinhalten
            eine persönliche Betreuung und auf Wunsch eine Spendenquittung.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {sponsorPackages.map((pkg) => (
            <Card
              key={pkg.id}
              hover
              className={
                pkg.highlighted
                  ? 'border-orange-500 bg-gradient-to-b from-orange-950/30 to-[#141414] relative'
                  : ''
              }
            >
              {pkg.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-orange-500 text-black text-xs font-bold">
                    <Star className="w-3 h-3" /> Beliebt
                  </span>
                </div>
              )}
              <div className="mb-4">
                <h3 className="text-white font-bold text-xl">{pkg.name}</h3>
                <div className="text-2xl font-black text-orange-500 mt-1">
                  {formatPrice(pkg.price)}
                </div>
                <div className="text-gray-500 text-xs">{pkg.visibility}</div>
              </div>
              <ul className="space-y-2 mb-6">
                {pkg.features.slice(0, 4).map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-gray-400">
                    <Check className="w-3.5 h-3.5 text-orange-500 mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
                {pkg.features.length > 4 && (
                  <li className="text-xs text-gray-500">+{pkg.features.length - 4} weitere</li>
                )}
              </ul>
              <Button href="/sponsoren" size="sm" variant={pkg.highlighted ? 'primary' : 'secondary'} className="w-full">
                Auswählen
              </Button>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button href="/sponsoren" size="lg" variant="ghost">
            Alle Details ansehen <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
