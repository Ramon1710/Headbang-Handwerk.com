import { ArrowRight, Calendar, MapPin } from 'lucide-react';
import { events } from '@/lib/data';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

export function SectionEventsPreview() {
  const upcoming = events.slice(0, 3);
  const statusMap = {
    confirmed: { label: 'Bestätigt', variant: 'success' as const },
    planned: { label: 'Geplant', variant: 'warning' as const },
    completed: { label: 'Abgeschlossen', variant: 'default' as const },
  };

  return (
    <section className="py-20 bg-[#0f0f0f]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-12 gap-4">
          <div>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">
              Nächste{' '}
              <span className="text-orange-500">Veranstaltungen</span>
            </h2>
            <p className="text-gray-400">Festival-Saison 2025 – Wir sind dabei!</p>
          </div>
          <Button href="/veranstaltungen" variant="secondary">
            Alle Termine <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {upcoming.map((event) => {
            const { label, variant } = statusMap[event.status];
            return (
              <div
                key={event.id}
                className="rounded-xl border border-[#2a2a2a] bg-[#141414] p-6 hover:border-orange-500/40 hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <Badge variant={variant}>{label}</Badge>
                </div>
                <h3 className="text-white font-bold text-lg mb-3">{event.festivalName}</h3>
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
                <p className="text-gray-500 text-xs leading-relaxed mb-5 line-clamp-2">
                  {event.description}
                </p>
                <Button href={event.ctaUrl || '/kontakt'} size="sm" variant="secondary" className="w-full">
                  {event.ctaText}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
