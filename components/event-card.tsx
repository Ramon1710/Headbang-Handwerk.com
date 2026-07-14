import { Calendar, MapPin } from 'lucide-react';
import { Event } from '@/lib/types';
import type { LiveEditorContent } from '@/lib/cms/schema';
import { resolveLiveHtml } from '@/lib/cms/live-editor';
import { getEventStandHref, isExternalUrl, resolveEventCtaUrl } from '@/lib/site';
import { LiveEditableText } from './live-editable-text';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface EventCardProps {
  event: Event;
  isAdmin?: boolean;
  liveEditor?: LiveEditorContent;
  editorKeyPrefix?: string;
}

const statusMap = {
  confirmed: { label: 'Bestätigt', variant: 'success' as const },
  planned: { label: 'Geplant', variant: 'warning' as const },
  completed: { label: 'Abgeschlossen', variant: 'default' as const },
};

export function EventCard({ event, isAdmin = false, liveEditor, editorKeyPrefix }: EventCardProps) {
  const { label, variant } = statusMap[event.status];
  const resolvedKeyPrefix = editorKeyPrefix || `events.cards.${event.id}`;
  const standHref = getEventStandHref(event.id);
  const canOpenStand = Boolean(event.standEnabled);
  const ctaHref = resolveEventCtaUrl(event.ctaUrl);
  const opensExternalSite = isExternalUrl(ctaHref);

  const cardContent = (
    <>
      <div className="flex items-start justify-center mb-4">
        <Badge variant={variant}>
          <LiveEditableText
            as="span"
            className="inline"
            editorKey={`${resolvedKeyPrefix}.statusLabel`}
            initialHtml={resolveLiveHtml(liveEditor, `${resolvedKeyPrefix}.statusLabel`, label)}
            isAdmin={isAdmin}
            title={`Veranstaltung Status ${event.title}`}
          />
        </Badge>
      </div>
      <LiveEditableText
        as="h3"
        className="section-title mb-2 text-[1.7rem]"
        editorKey={`${resolvedKeyPrefix}.title`}
        initialHtml={resolveLiveHtml(liveEditor, `${resolvedKeyPrefix}.title`, event.title)}
        isAdmin={isAdmin}
        title={`Veranstaltungstitel ${event.title}`}
      />
      <LiveEditableText
        as="p"
        className="body-copy mb-4 text-sm"
        editorKey={`${resolvedKeyPrefix}.festivalName`}
        initialHtml={resolveLiveHtml(liveEditor, `${resolvedKeyPrefix}.festivalName`, event.festivalName)}
        isAdmin={isAdmin}
        title={`Festivalname ${event.title}`}
      />
      <div className="space-y-2 mb-4 max-w-xs mx-auto">
        <div className="body-copy flex items-center justify-center gap-2 text-sm">
          <Calendar className="w-4 h-4 flex-shrink-0 text-[color:var(--color-accent)]" />
          <LiveEditableText
            as="span"
            className="inline"
            editorKey={`${resolvedKeyPrefix}.date`}
            initialHtml={resolveLiveHtml(liveEditor, `${resolvedKeyPrefix}.date`, event.date)}
            isAdmin={isAdmin}
            title={`Veranstaltungsdatum ${event.title}`}
          />
        </div>
        <div className="body-copy flex items-center justify-center gap-2 text-sm">
          <MapPin className="w-4 h-4 flex-shrink-0 text-[color:var(--color-accent)]" />
          <LiveEditableText
            as="span"
            className="inline"
            editorKey={`${resolvedKeyPrefix}.location`}
            initialHtml={resolveLiveHtml(liveEditor, `${resolvedKeyPrefix}.location`, event.location)}
            isAdmin={isAdmin}
            title={`Veranstaltungsort ${event.title}`}
          />
        </div>
      </div>
      <LiveEditableText
        as="p"
        className="body-copy mb-6 mx-auto max-w-sm"
        editorKey={`${resolvedKeyPrefix}.description`}
        initialHtml={resolveLiveHtml(liveEditor, `${resolvedKeyPrefix}.description`, event.description)}
        isAdmin={isAdmin}
        title={`Veranstaltungsbeschreibung ${event.title}`}
      />
    </>
  );

  return (
    <div className="rounded-[1.8rem] bg-[linear-gradient(180deg,rgba(28,18,12,0.72)_0%,rgba(12,9,7,0.3)_100%)] p-8 text-center ring-1 ring-white/6 shadow-[0_20px_50px_rgba(0,0,0,0.22)] transition-all duration-300 hover:-translate-y-1 hover:ring-[color:var(--color-accent)]/30">
      {isAdmin || !canOpenStand ? (
        cardContent
      ) : (
        <a href={standHref} className="block rounded-[1.2rem] transition focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)] focus:ring-offset-2 focus:ring-offset-black">
          {cardContent}
        </a>
      )}
      <Button href={ctaHref} target={opensExternalSite ? '_blank' : undefined} rel={opensExternalSite ? 'noreferrer noopener' : undefined} size="sm" variant="secondary" className="w-full">
        <LiveEditableText
          as="span"
          className="inline"
          editorKey={`${resolvedKeyPrefix}.ctaText`}
          initialHtml={resolveLiveHtml(liveEditor, `${resolvedKeyPrefix}.ctaText`, event.ctaText)}
          isAdmin={isAdmin}
          title={`Veranstaltungsbutton ${event.title}`}
        />
      </Button>
    </div>
  );
}
