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
        'relative rounded-[1.8rem] p-7 flex flex-col transition-all duration-300 text-center',
        pkg.highlighted
          ? 'bg-[linear-gradient(180deg,rgba(84,36,8,0.48)_0%,rgba(18,12,8,0.34)_100%)] ring-1 ring-orange-400/35 shadow-[0_22px_56px_rgba(255,120,0,0.12)]'
          : 'bg-[linear-gradient(180deg,rgba(28,18,12,0.72)_0%,rgba(12,9,7,0.3)_100%)] ring-1 ring-white/6 hover:ring-orange-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.22)]',
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
        <p className="text-gray-400 text-sm max-w-xs mx-auto">{pkg.visibility}</p>
      </div>

      <ul className="space-y-2.5 mb-8 flex-1">
        {pkg.features.map((feature) => (
          <li key={feature} className="flex items-start justify-center gap-2.5 text-sm text-gray-200 text-center">
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
