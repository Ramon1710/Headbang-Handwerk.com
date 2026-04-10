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
        className="w-full cursor-pointer rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:border-[color:var(--color-accent)]/40"
      >
        <div className="flex items-start justify-between mb-3">
          <h3 className="cms-box-title font-bold text-white">{slot.name}</h3>
          <Badge variant={variant}>{label}</Badge>
        </div>
        <div className="space-y-2 mb-4">
          <div className="cms-box-body flex items-center gap-2 text-gray-400">
            <MapPin className="h-4 w-4 flex-shrink-0 text-[color:var(--color-accent)]" />
            {slot.position}
          </div>
          <div className="cms-box-body flex items-center gap-2 text-gray-400">
            <Ruler className="h-4 w-4 flex-shrink-0 text-[color:var(--color-accent)]" />
            {slot.size}
          </div>
          <div className="cms-box-body flex items-center gap-2 text-gray-400">
            <Euro className="h-4 w-4 flex-shrink-0 text-[color:var(--color-accent)]" />
            {formatPrice(slot.price)} pro Festival
          </div>
        </div>
        <div className="cms-box-label text-[color:var(--color-accent-soft)]">
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
                <h2 className="cms-box-title mb-1 font-bold text-white">{slot.name}</h2>
                <Badge variant={variant}>{label}</Badge>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="cms-box-body mb-6 leading-relaxed text-gray-400">{slot.description}</p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="rounded-lg bg-black/30 p-3">
                <div className="cms-box-label mb-1 text-gray-500">Position</div>
                <div className="cms-box-body font-medium text-white">{slot.position}</div>
              </div>
              <div className="rounded-lg bg-black/30 p-3">
                <div className="cms-box-label mb-1 text-gray-500">Größe</div>
                <div className="cms-box-body font-medium text-white">{slot.size}</div>
              </div>
              <div className="rounded-lg bg-black/30 p-3">
                <div className="cms-box-label mb-1 text-gray-500">Sichtbarkeit</div>
                <div className="cms-box-body font-medium text-white">{slot.visibilityLevel}</div>
              </div>
              <div className="rounded-lg bg-black/30 p-3">
                <div className="cms-box-label mb-1 text-gray-500">Preis</div>
                <div className="cms-box-title font-bold text-[color:var(--color-accent)]">{formatPrice(slot.price)}</div>
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
