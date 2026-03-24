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
    <div className="rounded-[1.8rem] bg-[linear-gradient(180deg,rgba(28,18,12,0.72)_0%,rgba(12,9,7,0.3)_100%)] p-7 text-center ring-1 ring-white/6 hover:-translate-y-1 hover:ring-orange-500/30 transition-all duration-300 shadow-[0_20px_50px_rgba(0,0,0,0.22)]">
      <div className="flex items-start justify-center mb-4">
        <Badge variant={variant}>{label}</Badge>
      </div>
      <h3 className="text-white font-bold text-xl mb-1">{event.title}</h3>
      <p className="text-orange-500 text-sm font-medium mb-4">{event.festivalName}</p>
      <div className="space-y-2 mb-4 max-w-xs mx-auto">
        <div className="flex items-center justify-center gap-2 text-gray-300 text-sm">
          <Calendar className="w-4 h-4 text-orange-500 flex-shrink-0" />
          {event.date}
        </div>
        <div className="flex items-center justify-center gap-2 text-gray-300 text-sm">
          <MapPin className="w-4 h-4 text-orange-500 flex-shrink-0" />
          {event.location}
        </div>
      </div>
      <p className="text-gray-400 text-sm leading-relaxed mb-6 max-w-sm mx-auto">{event.description}</p>
      <Button href={event.ctaUrl || '/kontakt'} size="sm" variant="secondary" className="w-full">
        {event.ctaText}
      </Button>
    </div>
  );
}
