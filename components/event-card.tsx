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
    <div className="rounded-xl border border-[#2a2a2a] bg-[#141414] p-6 hover:border-orange-500/40 hover:-translate-y-1 transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <Badge variant={variant}>{label}</Badge>
      </div>
      <h3 className="text-white font-bold text-xl mb-1">{event.title}</h3>
      <p className="text-orange-500 text-sm font-medium mb-4">{event.festivalName}</p>
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <Calendar className="w-4 h-4 text-orange-500 flex-shrink-0" />
          {event.date}
        </div>
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <MapPin className="w-4 h-4 text-orange-500 flex-shrink-0" />
          {event.location}
        </div>
      </div>
      <p className="text-gray-500 text-sm leading-relaxed mb-6">{event.description}</p>
      <Button href={event.ctaUrl || '/kontakt'} size="sm" variant="secondary" className="w-full">
        {event.ctaText}
      </Button>
    </div>
  );
}
