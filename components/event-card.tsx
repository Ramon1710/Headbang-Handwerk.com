import { Calendar, MapPin } from 'lucide-react';
import { Event } from '@/lib/types';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface EventCardProps {
  event: Event;
}

const statusMap = {
  confirmed: { label: 'Bestätigt', variant: 'success' as const },
  planned: { label: 'Geplant', variant: 'warning' as const },
  completed: { label: 'Abgeschlossen', variant: 'default' as const },
};

export function EventCard({ event }: EventCardProps) {
  const { label, variant } = statusMap[event.status];

  return (
    <div className="rounded-[1.8rem] bg-[linear-gradient(180deg,rgba(28,18,12,0.72)_0%,rgba(12,9,7,0.3)_100%)] p-7 text-center ring-1 ring-white/6 transition-all duration-300 shadow-[0_20px_50px_rgba(0,0,0,0.22)] hover:-translate-y-1 hover:ring-[color:var(--color-accent)]/30">
      <div className="flex items-start justify-center mb-4">
        <Badge variant={variant}>{label}</Badge>
      </div>
      <h3 className="cms-box-title mb-1 font-bold text-white">{event.title}</h3>
      <p className="cms-box-label mb-4 font-medium text-[color:var(--color-accent)]">{event.festivalName}</p>
      <div className="space-y-2 mb-4 max-w-xs mx-auto">
        <div className="cms-box-body flex items-center justify-center gap-2 text-gray-300">
          <Calendar className="w-4 h-4 flex-shrink-0 text-[color:var(--color-accent)]" />
          {event.date}
        </div>
        <div className="cms-box-body flex items-center justify-center gap-2 text-gray-300">
          <MapPin className="w-4 h-4 flex-shrink-0 text-[color:var(--color-accent)]" />
          {event.location}
        </div>
      </div>
      <p className="cms-box-body mb-6 max-w-sm mx-auto leading-relaxed text-gray-400">{event.description}</p>
      <Button href={event.ctaUrl || '/kontakt'} size="sm" variant="secondary" className="w-full">
        {event.ctaText}
      </Button>
    </div>
  );
}
