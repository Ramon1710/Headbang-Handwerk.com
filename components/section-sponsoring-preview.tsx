import { Check, ArrowRight, Star } from 'lucide-react';
import { sponsorPackages } from '@/lib/data';
import { formatPrice } from '@/lib/utils';
import { Button } from './ui/button';
import { Card } from './ui/card';

export function SectionSponsoringPreview() {
  return (
    <section className="py-24 bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="copy-center mb-14">
          <div className="text-panel text-panel-tight">
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
              Sponsoring{' '}
              <span className="text-orange-500">Pakete</span>
            </h2>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Sichert euch eure Sichtbarkeit auf unseren Festivals. Alle Pakete beinhalten
              eine persönliche Betreuung und auf Wunsch eine Spendenquittung.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {sponsorPackages.map((pkg) => (
            <Card
              key={pkg.id}
              hover
              className={
                pkg.highlighted
                  ? 'relative ring-orange-400/35 bg-[linear-gradient(180deg,rgba(84,36,8,0.46)_0%,rgba(18,12,8,0.32)_100%)]'
                  : 'text-center'
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
                <h3 className="text-white font-bold text-xl text-center">{pkg.name}</h3>
                <div className="text-2xl font-black text-orange-500 mt-1">
                  {formatPrice(pkg.price)}
                </div>
                <div className="text-gray-400 text-xs text-center">{pkg.visibility}</div>
              </div>
              <ul className="space-y-2 mb-6">
                {pkg.features.slice(0, 4).map((f) => (
                  <li key={f} className="flex items-start justify-center gap-2 text-xs text-gray-300 text-center">
                    <Check className="w-3.5 h-3.5 text-orange-500 mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
                {pkg.features.length > 4 && (
                  <li className="text-xs text-gray-500 text-center">+{pkg.features.length - 4} weitere</li>
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
