import type { Metadata } from 'next';
import { Navigation } from '@/components/navigation';
import { Footer } from '@/components/footer';
import { BannerSlotCard } from '@/components/banner-slot-card';
import { getCmsContent } from '@/lib/cms/storage';
import { bannerSlots } from '@/lib/data';
import { Layers } from 'lucide-react';

function getStandAssetKind(url: string, contentType: string) {
  const lowerUrl = url.toLowerCase();
  const lowerType = contentType.toLowerCase();

  if (lowerType.includes('pdf') || lowerUrl.endsWith('.pdf')) {
    return 'pdf';
  }

  if (lowerType.startsWith('image/') || /(\.png|\.jpe?g|\.webp|\.svg)$/.test(lowerUrl)) {
    return 'image';
  }

  if (lowerType.startsWith('video/') || /(\.mp4|\.mov|\.webm)$/.test(lowerUrl)) {
    return 'video';
  }

  return 'file';
}

export const metadata: Metadata = {
  title: '3D-Stand & Bannerflächen – Headbang Handwerk',
  description: 'Bucht Bannerflächen an unserem 3D-Messestand auf Metal-Festivals.',
};

export default async function DreiDStandPage() {
  const cms = await getCmsContent();
  const stand = cms.site.stand;
  const available = bannerSlots.filter((s) => s.available === 'available');
  const reserved = bannerSlots.filter((s) => s.available !== 'available');
  const hasStandAsset = Boolean(stand.assetUrl);
  const standAssetKind = hasStandAsset ? getStandAssetKind(stand.assetUrl, stand.assetContentType) : 'file';

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
              {stand.badge}
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-white">
              {stand.title}{' '}
              <span className="text-[color:var(--color-accent)]">{stand.accentWord}</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl">
              {stand.lead}
            </p>
          </div>

          {/* Stand visualization */}
          <div className="rounded-2xl border border-[#2a2a2a] bg-[#141414] p-8 mb-14">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <h2 className="text-white font-bold text-lg">{stand.overviewTitle}</h2>
              {hasStandAsset ? (
                <a
                  href={stand.assetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-xl border border-[color:var(--color-accent)]/60 bg-[color:var(--color-accent)]/10 px-4 py-2 text-sm font-semibold text-[color:var(--color-accent-soft)] transition hover:bg-[color:var(--color-accent)]/16"
                >
                  {stand.assetName || '3D-Stand-Datei öffnen'}
                </a>
              ) : null}
            </div>
            <div className="relative aspect-video max-w-4xl mx-auto overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#0a0a0a]">
              {hasStandAsset ? (
                standAssetKind === 'pdf' ? (
                  <iframe src={stand.assetUrl} title={stand.assetName || stand.overviewTitle} className="h-full w-full" />
                ) : standAssetKind === 'image' ? (
                  <img src={stand.assetUrl} alt={stand.assetName || stand.overviewTitle} className="h-full w-full object-contain" />
                ) : standAssetKind === 'video' ? (
                  <video src={stand.assetUrl} controls className="h-full w-full bg-black object-contain" />
                ) : (
                  <div className="flex h-full items-center justify-center p-8 text-center">
                    <div>
                      <Layers className="mx-auto mb-4 h-16 w-16 text-[color:var(--color-accent)]/25" />
                      <p className="text-base font-semibold text-white">{stand.assetName || '3D-Stand-Datei'}</p>
                      <p className="mt-2 text-sm text-gray-400">Diese Datei kann direkt geöffnet oder heruntergeladen werden.</p>
                    </div>
                  </div>
                )
              ) : (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <Layers className="mx-auto mb-4 h-24 w-24 text-[color:var(--color-accent)]/20" />
                    <p className="text-gray-600 text-sm">{stand.overviewPlaceholderTitle}</p>
                    <p className="text-gray-700 text-xs">{stand.overviewPlaceholderText}</p>
                  </div>
                  <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded-full border border-[color:var(--color-accent)]/40 bg-[color:var(--color-accent)]/10 px-4 py-1.5 text-xs text-[color:var(--color-accent-soft)]">
                    {stand.frontBannerLabel}
                  </div>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 border border-gray-700/40 rounded-full bg-gray-900/10 text-gray-600 text-xs">
                    {stand.backBannerLabel}
                  </div>
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 px-2 py-1 border border-gray-700/40 rounded bg-gray-900/10 text-gray-600 text-xs">
                    {stand.leftLabel}
                  </div>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 px-2 py-1 border border-yellow-700/40 rounded bg-yellow-900/10 text-yellow-600 text-xs">
                    {stand.rightLabel}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Available slots */}
          {available.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                {stand.availableTitle}
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
                {stand.reservedTitle}
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
