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
        'relative flex flex-col rounded-[1.8rem] p-8 text-center transition-all duration-300',
        pkg.highlighted
          ? 'bg-[linear-gradient(180deg,rgba(84,36,8,0.48)_0%,rgba(18,12,8,0.34)_100%)] ring-1 ring-[color:var(--color-accent)]/35 shadow-[0_22px_56px_color-mix(in_srgb,var(--color-accent)_12%,transparent)]'
          : 'bg-[linear-gradient(180deg,rgba(28,18,12,0.72)_0%,rgba(12,9,7,0.3)_100%)] ring-1 ring-white/6 hover:ring-[color:var(--color-accent)]/30 shadow-[0_20px_50px_rgba(0,0,0,0.22)]',
      ].join(' ')}
    >
      {pkg.highlighted && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--color-surface)] px-3 py-1 text-xs font-bold text-[color:var(--text-link)] ring-1 ring-[color:var(--color-accent)]/40">
            <Star className="w-3 h-3 fill-black" /> Beliebt
          </span>
        </div>
      )}

      <div className="mb-6">
        <h3 className="section-title mb-2 text-[clamp(1.45rem,2.1vw,1.85rem)] leading-[1.02] [text-wrap:balance] [hyphens:auto]">{pkg.name}</h3>
        <div className="body-copy mb-1 text-lg font-bold">
          {formatPrice(pkg.price)}
        </div>
        <p className="body-copy mx-auto max-w-xs">{pkg.visibility}</p>
        <p className="body-copy mt-2 text-sm">Logo: {pkg.logoSize}</p>
        <p className="body-copy text-sm">Platzierung: {pkg.placement}</p>
      </div>

      <ul className="space-y-2.5 mb-8 flex-1">
        {pkg.features.map((feature) => (
          <li key={feature} className="body-copy flex items-start justify-center gap-2.5 text-center text-sm">
            <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[color:var(--color-accent)]" />
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
