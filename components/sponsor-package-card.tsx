import { Check, Star } from 'lucide-react';
import { SponsorPackage } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import { Button } from './ui/button';

interface SponsorPackageCardProps {
  pkg: SponsorPackage;
}

export function SponsorPackageCard({ pkg }: SponsorPackageCardProps) {
  return (
    <div
      className={[
        'relative rounded-xl border p-6 flex flex-col transition-all duration-300',
        pkg.highlighted
          ? 'border-orange-500 bg-gradient-to-b from-orange-950/30 to-[#141414] shadow-xl shadow-orange-500/10'
          : 'border-[#2a2a2a] bg-[#141414] hover:border-orange-500/40',
      ].join(' ')}
    >
      {pkg.highlighted && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-orange-500 text-black text-xs font-bold">
            <Star className="w-3 h-3 fill-black" /> Beliebt
          </span>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-white font-black text-2xl mb-1">{pkg.name}</h3>
        <div className="text-3xl font-black text-orange-500 mb-1">
          {formatPrice(pkg.price)}
        </div>
        <p className="text-gray-500 text-sm">{pkg.visibility}</p>
      </div>

      <ul className="space-y-2.5 mb-8 flex-1">
        {pkg.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-sm text-gray-300">
            <Check className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
            {feature}
          </li>
        ))}
      </ul>

      <Button
        href={`/sponsoren/checkout?package=${pkg.id}`}
        variant={pkg.highlighted ? 'primary' : 'secondary'}
        className="w-full"
        size="lg"
      >
        Paket wählen
      </Button>
    </div>
  );
}
