import type { Event } from '@/lib/types';
import type { CmsContent } from '@/lib/cms/schema';
import { BannerSlotCard } from '@/components/banner-slot-card';
import { EditablePageShell } from '@/components/editable-page-shell';
import { LiveEditableText } from '@/components/live-editable-text';
import { LiveResizableBox } from '@/components/live-resizable-box';
import { resolveLiveBoxStyle, resolveLiveHtml } from '@/lib/cms/live-editor';
import { normalizeEventStandConfig } from '@/lib/event-stand';
import { Layers } from 'lucide-react';

function getStandEditorKey(eventId: string | undefined, field: string) {
  return eventId ? `events.${eventId}.stand.${field}` : `stand.${field}`;
}

function getStandBoxKey(eventId: string | undefined, field: string) {
  return eventId ? `events.${eventId}.stand.${field}.box` : `stand.${field}.box`;
}

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

interface StandPageContentProps {
  cms: CmsContent;
  isAdmin: boolean;
  event?: Event;
}

export function StandPageContent({ cms, isAdmin, event }: StandPageContentProps) {
  const stand = cms.site.stand;
  const eventStand = normalizeEventStandConfig(event?.stand);
  const eventId = event?.id;
  const liveEditor = cms.site.liveEditor;
  const activeLead = eventStand.lead || stand.lead;
  const activeAssetUrl = eventStand.assetUrl || stand.assetUrl;
  const activeAssetName = eventStand.assetName || stand.assetName;
  const activeAssetContentType = eventStand.assetContentType || stand.assetContentType;
  const activeBannerSlots = event ? eventStand.bannerSlots : eventStand.bannerSlots.length ? eventStand.bannerSlots : [];
  const activeBadge = event ? `Festivalstand ${event.festivalName}` : stand.badge;
  const activeTitle = event ? event.festivalName : stand.title;
  const activeAccentWord = event ? '3D-Stand & Bannerflächen' : stand.accentWord;
  const activeOverviewTitle = event ? `Standansicht für ${event.festivalName}` : stand.overviewTitle;
  const activeAvailableTitle = event ? `Freie Flächen bei ${event.festivalName}` : stand.availableTitle;
  const activeReservedTitle = event ? `Reserviert / Vergeben bei ${event.festivalName}` : stand.reservedTitle;
  const available = activeBannerSlots.filter((s) => s.available === 'available');
  const reserved = activeBannerSlots.filter((s) => s.available !== 'available');
  const hasStandAsset = Boolean(activeAssetUrl);
  const standAssetKind = hasStandAsset ? getStandAssetKind(activeAssetUrl, activeAssetContentType) : 'file';

  return (
    <EditablePageShell cms={cms} isAdmin={isAdmin} mainClassName="min-h-screen bg-[#0a0a0a] pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {event ? (
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <a
              href="/veranstaltungen"
              className="inline-flex items-center gap-2 self-start rounded-xl border border-[color:var(--color-border)]/70 bg-black/15 px-4 py-2 text-sm font-semibold text-[color:var(--color-accent-soft)] transition hover:border-[color:var(--color-accent)] hover:text-white"
            >
              Zuruck zu Veranstaltungen
            </a>
            <div className="rounded-full border border-[color:var(--color-accent)]/30 bg-[color:var(--color-accent)]/10 px-4 py-2 text-sm font-semibold text-[color:var(--color-accent-soft)]">
              Aktiver Festival-Stand: {event.festivalName}
            </div>
          </div>
        ) : null}

        <LiveResizableBox boxKey={getStandBoxKey(eventId, 'header')} initialStyle={resolveLiveBoxStyle(liveEditor, getStandBoxKey(eventId, 'header'))} isAdmin={isAdmin} className="content-flow mb-14">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[color:var(--color-accent)]/30 bg-[color:var(--color-accent)]/10 px-3 py-1.5 text-sm font-medium text-[color:var(--color-accent-soft)]">
            <Layers className="w-3.5 h-3.5" />
            <LiveEditableText as="span" className="inline" editorKey={getStandEditorKey(eventId, 'badge')} initialHtml={resolveLiveHtml(liveEditor, getStandEditorKey(eventId, 'badge'), activeBadge)} isAdmin={isAdmin} title="3D-Stand Badge" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white">
            <LiveEditableText as="span" className="inline" editorKey={getStandEditorKey(eventId, 'title')} initialHtml={resolveLiveHtml(liveEditor, getStandEditorKey(eventId, 'title'), activeTitle)} isAdmin={isAdmin} title="3D-Stand Titel" />{' '}
            <LiveEditableText as="span" className="inline text-[color:var(--color-accent)]" editorKey={getStandEditorKey(eventId, 'accentWord')} initialHtml={resolveLiveHtml(liveEditor, getStandEditorKey(eventId, 'accentWord'), activeAccentWord)} isAdmin={isAdmin} title="3D-Stand Hervorhebung" />
          </h1>
          {event ? <p className="text-lg font-semibold text-[color:var(--color-accent-soft)]">Festival: {event.title}</p> : null}
          <LiveEditableText as="p" className="max-w-2xl text-lg text-gray-400" editorKey={getStandEditorKey(eventId, 'lead')} initialHtml={resolveLiveHtml(liveEditor, getStandEditorKey(eventId, 'lead'), activeLead)} isAdmin={isAdmin} title="3D-Stand Einleitung" />
        </LiveResizableBox>

        <LiveResizableBox boxKey={getStandBoxKey(eventId, 'visualization')} initialStyle={resolveLiveBoxStyle(liveEditor, getStandBoxKey(eventId, 'visualization'))} isAdmin={isAdmin} className="rounded-2xl border border-[#2a2a2a] bg-[#141414] p-8 mb-14">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <LiveEditableText as="h2" className="text-lg font-bold text-white" editorKey={getStandEditorKey(eventId, 'overviewTitle')} initialHtml={resolveLiveHtml(liveEditor, getStandEditorKey(eventId, 'overviewTitle'), activeOverviewTitle)} isAdmin={isAdmin} title="3D-Stand Übersichtstitel" />
            {hasStandAsset ? (
              <a
                href={activeAssetUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-xl border border-[color:var(--color-accent)]/60 bg-[color:var(--color-accent)]/10 px-4 py-2 text-sm font-semibold text-[color:var(--color-accent-soft)] transition hover:bg-[color:var(--color-accent)]/16"
              >
                {activeAssetName || '3D-Stand-Datei öffnen'}
              </a>
            ) : null}
          </div>
          <div className="relative aspect-video max-w-4xl mx-auto overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#0a0a0a]">
            {hasStandAsset ? (
              standAssetKind === 'pdf' ? (
                <iframe src={activeAssetUrl} title={activeAssetName || stand.overviewTitle} className="h-full w-full" />
              ) : standAssetKind === 'image' ? (
                <img src={activeAssetUrl} alt={activeAssetName || stand.overviewTitle} className="h-full w-full object-contain" />
              ) : standAssetKind === 'video' ? (
                <video src={activeAssetUrl} controls className="h-full w-full bg-black object-contain" />
              ) : (
                <div className="flex h-full items-center justify-center p-8 text-center">
                  <div>
                    <Layers className="mx-auto mb-4 h-16 w-16 text-[color:var(--color-accent)]/25" />
                    <p className="text-base font-semibold text-white">{activeAssetName || '3D-Stand-Datei'}</p>
                    <LiveEditableText as="p" className="mt-2 text-sm text-gray-400" editorKey={getStandEditorKey(eventId, 'assetFallbackText')} initialHtml={resolveLiveHtml(liveEditor, getStandEditorKey(eventId, 'assetFallbackText'), 'Diese Datei kann direkt geöffnet oder heruntergeladen werden.')} isAdmin={isAdmin} title="3D-Stand Datei Hinweis" />
                  </div>
                </div>
              )
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <Layers className="mx-auto mb-4 h-24 w-24 text-[color:var(--color-accent)]/20" />
                  <LiveEditableText as="p" className="text-sm text-gray-600" editorKey={getStandEditorKey(eventId, 'overviewPlaceholderTitle')} initialHtml={resolveLiveHtml(liveEditor, getStandEditorKey(eventId, 'overviewPlaceholderTitle'), stand.overviewPlaceholderTitle)} isAdmin={isAdmin} title="3D-Stand Placeholder Titel" />
                  <LiveEditableText as="p" className="text-xs text-gray-700" editorKey={getStandEditorKey(eventId, 'overviewPlaceholderText')} initialHtml={resolveLiveHtml(liveEditor, getStandEditorKey(eventId, 'overviewPlaceholderText'), stand.overviewPlaceholderText)} isAdmin={isAdmin} title="3D-Stand Placeholder Text" />
                </div>
                <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded-full border border-[color:var(--color-accent)]/40 bg-[color:var(--color-accent)]/10 px-4 py-1.5 text-xs text-[color:var(--color-accent-soft)]">
                  <LiveEditableText as="span" className="inline" editorKey={getStandEditorKey(eventId, 'frontBannerLabel')} initialHtml={resolveLiveHtml(liveEditor, getStandEditorKey(eventId, 'frontBannerLabel'), stand.frontBannerLabel)} isAdmin={isAdmin} title="3D-Stand Frontlabel" />
                </div>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 border border-gray-700/40 rounded-full bg-gray-900/10 text-gray-600 text-xs">
                  <LiveEditableText as="span" className="inline" editorKey={getStandEditorKey(eventId, 'backBannerLabel')} initialHtml={resolveLiveHtml(liveEditor, getStandEditorKey(eventId, 'backBannerLabel'), stand.backBannerLabel)} isAdmin={isAdmin} title="3D-Stand Rücklabel" />
                </div>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 px-2 py-1 border border-gray-700/40 rounded bg-gray-900/10 text-gray-600 text-xs">
                  <LiveEditableText as="span" className="inline" editorKey={getStandEditorKey(eventId, 'leftLabel')} initialHtml={resolveLiveHtml(liveEditor, getStandEditorKey(eventId, 'leftLabel'), stand.leftLabel)} isAdmin={isAdmin} title="3D-Stand Linkes Label" />
                </div>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 px-2 py-1 border border-yellow-700/40 rounded bg-yellow-900/10 text-yellow-600 text-xs">
                  <LiveEditableText as="span" className="inline" editorKey={getStandEditorKey(eventId, 'rightLabel')} initialHtml={resolveLiveHtml(liveEditor, getStandEditorKey(eventId, 'rightLabel'), stand.rightLabel)} isAdmin={isAdmin} title="3D-Stand Rechtes Label" />
                </div>
              </div>
            )}
          </div>
        </LiveResizableBox>

        {available.length > 0 && (
          <div className="mb-12">
            <LiveResizableBox boxKey={getStandBoxKey(eventId, 'availableHeading')} initialStyle={resolveLiveBoxStyle(liveEditor, getStandBoxKey(eventId, 'availableHeading'))} isAdmin={isAdmin} className="mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <LiveEditableText as="span" className="inline" editorKey={getStandEditorKey(eventId, 'availableTitle')} initialHtml={resolveLiveHtml(liveEditor, getStandEditorKey(eventId, 'availableTitle'), activeAvailableTitle)} isAdmin={isAdmin} title="3D-Stand Verfügbar Titel" />
              </h2>
            </LiveResizableBox>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {available.map((slot, index) => (
                <LiveResizableBox key={slot.id} boxKey={eventId ? `events.${eventId}.stand.available.${index}.box` : `stand.available.${index}.box`} initialStyle={resolveLiveBoxStyle(liveEditor, eventId ? `events.${eventId}.stand.available.${index}.box` : `stand.available.${index}.box`)} isAdmin={isAdmin} className="h-full">
                  <BannerSlotCard slot={slot} />
                </LiveResizableBox>
              ))}
            </div>
          </div>
        )}

        {reserved.length > 0 && (
          <div>
            <LiveResizableBox boxKey={getStandBoxKey(eventId, 'reservedHeading')} initialStyle={resolveLiveBoxStyle(liveEditor, getStandBoxKey(eventId, 'reservedHeading'))} isAdmin={isAdmin} className="mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                <LiveEditableText as="span" className="inline" editorKey={getStandEditorKey(eventId, 'reservedTitle')} initialHtml={resolveLiveHtml(liveEditor, getStandEditorKey(eventId, 'reservedTitle'), activeReservedTitle)} isAdmin={isAdmin} title="3D-Stand Reserviert Titel" />
              </h2>
            </LiveResizableBox>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {reserved.map((slot, index) => (
                <LiveResizableBox key={slot.id} boxKey={eventId ? `events.${eventId}.stand.reserved.${index}.box` : `stand.reserved.${index}.box`} initialStyle={resolveLiveBoxStyle(liveEditor, eventId ? `events.${eventId}.stand.reserved.${index}.box` : `stand.reserved.${index}.box`)} isAdmin={isAdmin} className="h-full">
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