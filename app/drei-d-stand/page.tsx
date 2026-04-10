import type { Metadata } from 'next';
import { Navigation } from '@/components/navigation';
import { Footer } from '@/components/footer';
import { BannerSlotCard } from '@/components/banner-slot-card';
import { getCmsContent } from '@/lib/cms/storage';
import { bannerSlots } from '@/lib/data';
import { Layers } from 'lucide-react';

export const metadata: Metadata = {
  title: '3D-Stand & Bannerflächen – Headbang Handwerk',
  description: 'Bucht Bannerflächen an unserem 3D-Messestand auf Metal-Festivals.',
};

export default async function DreiDStandPage() {
  const cms = await getCmsContent();
  const available = bannerSlots.filter((s) => s.available === 'available');
  const reserved = bannerSlots.filter((s) => s.available !== 'available');

  return (
    <>
      <Navigation
        links={cms.site.navigationLinks}
        ctaLabel={cms.site.navigationCtaLabel}
        ctaHref={cms.site.navigationCtaHref}
      />
      <main className="min-h-screen bg-[#0a0a0a] pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="content-flow mb-14">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[color:var(--color-accent)]/30 bg-[color:var(--color-accent)]/10 px-3 py-1.5 text-sm font-medium text-[color:var(--color-accent-soft)]">
              <Layers className="w-3.5 h-3.5" />
              Messestand-Konfiguration
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-white">
              3D-Stand &{' '}
              <span className="text-[color:var(--color-accent)]">Bannerflächen</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl">
              Wählt eure Wunschposition am Stand und sichert euch maximale Sichtbarkeit auf
              unseren Festivals. Klickt auf eine Fläche für Details.
            </p>
          </div>

          {/* Stand visualization */}
          <div className="rounded-2xl border border-[#2a2a2a] bg-[#141414] p-8 mb-14">
            <h2 className="text-white font-bold text-lg mb-6">Stand-Übersicht (Schematisch)</h2>
            <div className="relative aspect-video max-w-2xl mx-auto bg-[#0a0a0a] rounded-xl border border-[#2a2a2a] flex items-center justify-center">
              <div className="text-center">
                <Layers className="mx-auto mb-4 h-24 w-24 text-[color:var(--color-accent)]/20" />
                <p className="text-gray-600 text-sm">Interaktive 3D-Ansicht</p>
                <p className="text-gray-700 text-xs">folgt in Kürze</p>
              </div>
              {/* Position labels */}
              <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded-full border border-[color:var(--color-accent)]/40 bg-[color:var(--color-accent)]/10 px-4 py-1.5 text-xs text-[color:var(--color-accent-soft)]">
                Frontbanner (3×2m) – €800
              </div>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 border border-gray-700/40 rounded-full bg-gray-900/10 text-gray-600 text-xs">
                Rückbanner (4×1m) – €350
              </div>
              <div className="absolute left-4 top-1/2 -translate-y-1/2 px-2 py-1 border border-gray-700/40 rounded bg-gray-900/10 text-gray-600 text-xs">
                Links
              </div>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 px-2 py-1 border border-yellow-700/40 rounded bg-yellow-900/10 text-yellow-600 text-xs">
                Rechts ⚡
              </div>
            </div>
          </div>

          {/* Available slots */}
          {available.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Verfügbare Flächen
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {available.map((slot) => (
                  <BannerSlotCard key={slot.id} slot={slot} />
                ))}
              </div>
            </div>
          )}

          {reserved.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                Reserviert / Vergeben
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {reserved.map((slot) => (
                  <BannerSlotCard key={slot.id} slot={slot} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer content={cms.site.footer} />
    </>
  );
}
