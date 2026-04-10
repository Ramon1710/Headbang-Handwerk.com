import { Calendar, MapPin } from 'lucide-react';
import { Event } from '@/lib/types';
import type { LiveEditorContent } from '@/lib/cms/schema';
import { resolveLiveHtml } from '@/lib/cms/live-editor';
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

  return (
    <div className="rounded-[1.8rem] bg-[linear-gradient(180deg,rgba(28,18,12,0.72)_0%,rgba(12,9,7,0.3)_100%)] p-7 text-center ring-1 ring-white/6 transition-all duration-300 shadow-[0_20px_50px_rgba(0,0,0,0.22)] hover:-translate-y-1 hover:ring-[color:var(--color-accent)]/30">
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
        className="cms-box-title mb-1 font-bold text-white"
        editorKey={`${resolvedKeyPrefix}.title`}
        initialHtml={resolveLiveHtml(liveEditor, `${resolvedKeyPrefix}.title`, event.title)}
        isAdmin={isAdmin}
        title={`Veranstaltungstitel ${event.title}`}
      />
      <LiveEditableText
        as="p"
        className="cms-box-label mb-4 font-medium text-[color:var(--color-accent)]"
        editorKey={`${resolvedKeyPrefix}.festivalName`}
        initialHtml={resolveLiveHtml(liveEditor, `${resolvedKeyPrefix}.festivalName`, event.festivalName)}
        isAdmin={isAdmin}
        title={`Festivalname ${event.title}`}
      />
      <div className="space-y-2 mb-4 max-w-xs mx-auto">
        <div className="cms-box-body flex items-center justify-center gap-2 text-gray-300">
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
        <div className="cms-box-body flex items-center justify-center gap-2 text-gray-300">
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
        className="cms-box-body mb-6 max-w-sm mx-auto leading-relaxed text-gray-400"
        editorKey={`${resolvedKeyPrefix}.description`}
        initialHtml={resolveLiveHtml(liveEditor, `${resolvedKeyPrefix}.description`, event.description)}
        isAdmin={isAdmin}
        title={`Veranstaltungsbeschreibung ${event.title}`}
      />
      <Button href={event.ctaUrl || '/kontakt'} size="sm" variant="secondary" className="w-full">
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
