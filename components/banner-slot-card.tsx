'use client';

import { useState } from 'react';
import { X, MapPin, Ruler, Euro } from 'lucide-react';
import { BannerSlot } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface BannerSlotCardProps {
  slot: BannerSlot;
}

const availabilityMap = {
  available: { label: 'Verfügbar', variant: 'success' as const },
  reserved: { label: 'Reserviert', variant: 'warning' as const },
  sold: { label: 'Vergeben', variant: 'danger' as const },
};

export function BannerSlotCard({ slot }: BannerSlotCardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const { label, variant } = availabilityMap[slot.available];

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="w-full cursor-pointer rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-7 text-left transition-all duration-300 hover:-translate-y-1 hover:border-[color:var(--color-accent)]/40"
      >
        <div className="flex items-start justify-between mb-3">
          <h3 className="section-title text-[1.55rem]">{slot.name}</h3>
          <Badge variant={variant}>{label}</Badge>
        </div>
        <div className="space-y-2 mb-4">
          <div className="body-copy flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 flex-shrink-0 text-[color:var(--color-accent)]" />
            {slot.position}
          </div>
          <div className="body-copy flex items-center gap-2 text-sm">
            <Ruler className="h-4 w-4 flex-shrink-0 text-[color:var(--color-accent)]" />
            {slot.size}
          </div>
          <div className="body-copy flex items-center gap-2 text-sm">
            <Euro className="h-4 w-4 flex-shrink-0 text-[color:var(--color-accent)]" />
            {formatPrice(slot.price)} pro Festival
          </div>
        </div>
        <div className="link-copy cms-box-label">
          Sichtbarkeit: {slot.visibilityLevel}
        </div>
      </button>

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="section-title mb-1 text-[1.7rem]">{slot.name}</h2>
                <Badge variant={variant}>{label}</Badge>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="link-copy transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="body-copy mb-6">{slot.description}</p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="rounded-lg bg-black/30 p-3">
                <div className="body-copy mb-1 text-xs">Position</div>
                <div className="body-copy font-medium">{slot.position}</div>
              </div>
              <div className="rounded-lg bg-black/30 p-3">
                <div className="body-copy mb-1 text-xs">Größe</div>
                <div className="body-copy font-medium">{slot.size}</div>
              </div>
              <div className="rounded-lg bg-black/30 p-3">
                <div className="body-copy mb-1 text-xs">Sichtbarkeit</div>
                <div className="body-copy font-medium">{slot.visibilityLevel}</div>
              </div>
              <div className="rounded-lg bg-black/30 p-3">
                <div className="body-copy mb-1 text-xs">Preis</div>
                <div className="body-copy font-bold">{formatPrice(slot.price)}</div>
              </div>
            </div>

            {slot.available === 'available' ? (
              <Button
                href={`/kontakt?interesse=banner&slot=${slot.id}`}
                className="w-full"
                size="lg"
              >
                Jetzt buchen
              </Button>
            ) : (
              <Button href="/kontakt" variant="ghost" className="w-full" size="lg">
                Auf Warteliste setzen
              </Button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
