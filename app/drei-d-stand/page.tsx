import type { Metadata } from 'next';
import { BannerSlotCard } from '@/components/banner-slot-card';
import { EditablePageShell } from '@/components/editable-page-shell';
import { LiveEditableText } from '@/components/live-editable-text';
import { LiveResizableBox } from '@/components/live-resizable-box';
import { isAdminAuthenticated } from '@/lib/cms/auth';
import { resolveLiveBoxStyle, resolveLiveHtml } from '@/lib/cms/live-editor';
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

export default async function DreiDStandPage({
  searchParams,
}: {
  searchParams?: Promise<{ view?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const cms = await getCmsContent();
  const isAuthenticatedAdmin = await isAdminAuthenticated();
  const isAdmin = isAuthenticatedAdmin && params?.view !== 'user';
  const stand = cms.site.stand;
  const liveEditor = cms.site.liveEditor;
  const available = bannerSlots.filter((s) => s.available === 'available');
  const reserved = bannerSlots.filter((s) => s.available !== 'available');
  const hasStandAsset = Boolean(stand.assetUrl);
  const standAssetKind = hasStandAsset ? getStandAssetKind(stand.assetUrl, stand.assetContentType) : 'file';

  return (
    <EditablePageShell cms={cms} isAdmin={isAdmin} mainClassName="min-h-screen bg-[#0a0a0a] pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <LiveResizableBox boxKey="stand.header.box" initialStyle={resolveLiveBoxStyle(liveEditor, 'stand.header.box')} isAdmin={isAdmin} className="content-flow mb-14">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[color:var(--color-accent)]/30 bg-[color:var(--color-accent)]/10 px-3 py-1.5 text-sm font-medium text-[color:var(--color-accent-soft)]">
              <Layers className="w-3.5 h-3.5" />
              <LiveEditableText as="span" className="inline" editorKey="stand.badge" initialHtml={resolveLiveHtml(liveEditor, 'stand.badge', stand.badge)} isAdmin={isAdmin} title="3D-Stand Badge" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-white">
              <LiveEditableText as="span" className="inline" editorKey="stand.title" initialHtml={resolveLiveHtml(liveEditor, 'stand.title', stand.title)} isAdmin={isAdmin} title="3D-Stand Titel" />{' '}
              <LiveEditableText as="span" className="inline text-[color:var(--color-accent)]" editorKey="stand.accentWord" initialHtml={resolveLiveHtml(liveEditor, 'stand.accentWord', stand.accentWord)} isAdmin={isAdmin} title="3D-Stand Hervorhebung" />
            </h1>
            <LiveEditableText as="p" className="max-w-2xl text-lg text-gray-400" editorKey="stand.lead" initialHtml={resolveLiveHtml(liveEditor, 'stand.lead', stand.lead)} isAdmin={isAdmin} title="3D-Stand Einleitung" />
          </LiveResizableBox>

          <LiveResizableBox boxKey="stand.visualization.box" initialStyle={resolveLiveBoxStyle(liveEditor, 'stand.visualization.box')} isAdmin={isAdmin} className="rounded-2xl border border-[#2a2a2a] bg-[#141414] p-8 mb-14">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <LiveEditableText as="h2" className="text-lg font-bold text-white" editorKey="stand.overviewTitle" initialHtml={resolveLiveHtml(liveEditor, 'stand.overviewTitle', stand.overviewTitle)} isAdmin={isAdmin} title="3D-Stand Übersichtstitel" />
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
                      <LiveEditableText as="p" className="mt-2 text-sm text-gray-400" editorKey="stand.assetFallbackText" initialHtml={resolveLiveHtml(liveEditor, 'stand.assetFallbackText', 'Diese Datei kann direkt geöffnet oder heruntergeladen werden.')} isAdmin={isAdmin} title="3D-Stand Datei Hinweis" />
                    </div>
                  </div>
                )
              ) : (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <Layers className="mx-auto mb-4 h-24 w-24 text-[color:var(--color-accent)]/20" />
                    <LiveEditableText as="p" className="text-sm text-gray-600" editorKey="stand.overviewPlaceholderTitle" initialHtml={resolveLiveHtml(liveEditor, 'stand.overviewPlaceholderTitle', stand.overviewPlaceholderTitle)} isAdmin={isAdmin} title="3D-Stand Placeholder Titel" />
                    <LiveEditableText as="p" className="text-xs text-gray-700" editorKey="stand.overviewPlaceholderText" initialHtml={resolveLiveHtml(liveEditor, 'stand.overviewPlaceholderText', stand.overviewPlaceholderText)} isAdmin={isAdmin} title="3D-Stand Placeholder Text" />
                  </div>
                  <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded-full border border-[color:var(--color-accent)]/40 bg-[color:var(--color-accent)]/10 px-4 py-1.5 text-xs text-[color:var(--color-accent-soft)]">
                    <LiveEditableText as="span" className="inline" editorKey="stand.frontBannerLabel" initialHtml={resolveLiveHtml(liveEditor, 'stand.frontBannerLabel', stand.frontBannerLabel)} isAdmin={isAdmin} title="3D-Stand Frontlabel" />
                  </div>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 border border-gray-700/40 rounded-full bg-gray-900/10 text-gray-600 text-xs">
                    <LiveEditableText as="span" className="inline" editorKey="stand.backBannerLabel" initialHtml={resolveLiveHtml(liveEditor, 'stand.backBannerLabel', stand.backBannerLabel)} isAdmin={isAdmin} title="3D-Stand Rücklabel" />
                  </div>
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 px-2 py-1 border border-gray-700/40 rounded bg-gray-900/10 text-gray-600 text-xs">
                    <LiveEditableText as="span" className="inline" editorKey="stand.leftLabel" initialHtml={resolveLiveHtml(liveEditor, 'stand.leftLabel', stand.leftLabel)} isAdmin={isAdmin} title="3D-Stand Linkes Label" />
                  </div>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 px-2 py-1 border border-yellow-700/40 rounded bg-yellow-900/10 text-yellow-600 text-xs">
                    <LiveEditableText as="span" className="inline" editorKey="stand.rightLabel" initialHtml={resolveLiveHtml(liveEditor, 'stand.rightLabel', stand.rightLabel)} isAdmin={isAdmin} title="3D-Stand Rechtes Label" />
                  </div>
                </div>
              )}
            </div>
          </LiveResizableBox>

          {available.length > 0 && (
            <div className="mb-12">
              <LiveResizableBox boxKey="stand.availableHeading.box" initialStyle={resolveLiveBoxStyle(liveEditor, 'stand.availableHeading.box')} isAdmin={isAdmin} className="mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <LiveEditableText as="span" className="inline" editorKey="stand.availableTitle" initialHtml={resolveLiveHtml(liveEditor, 'stand.availableTitle', stand.availableTitle)} isAdmin={isAdmin} title="3D-Stand Verfügbar Titel" />
              </h2>
              </LiveResizableBox>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {available.map((slot, index) => (
                  <LiveResizableBox key={slot.id} boxKey={`stand.available.${index}.box`} initialStyle={resolveLiveBoxStyle(liveEditor, `stand.available.${index}.box`)} isAdmin={isAdmin} className="h-full">
                    <BannerSlotCard slot={slot} />
                  </LiveResizableBox>
                ))}
              </div>
            </div>
          )}

          {reserved.length > 0 && (
            <div>
              <LiveResizableBox boxKey="stand.reservedHeading.box" initialStyle={resolveLiveBoxStyle(liveEditor, 'stand.reservedHeading.box')} isAdmin={isAdmin} className="mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                <LiveEditableText as="span" className="inline" editorKey="stand.reservedTitle" initialHtml={resolveLiveHtml(liveEditor, 'stand.reservedTitle', stand.reservedTitle)} isAdmin={isAdmin} title="3D-Stand Reserviert Titel" />
              </h2>
              </LiveResizableBox>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {reserved.map((slot, index) => (
                  <LiveResizableBox key={slot.id} boxKey={`stand.reserved.${index}.box`} initialStyle={resolveLiveBoxStyle(liveEditor, `stand.reserved.${index}.box`)} isAdmin={isAdmin} className="h-full">
                    <BannerSlotCard slot={slot} />
                  </LiveResizableBox>
                ))}
              </div>
            </div>
          )}
        </div>
    </EditablePageShell>
  );
}
