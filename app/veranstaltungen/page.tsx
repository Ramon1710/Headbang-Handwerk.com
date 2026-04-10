import type { Metadata } from 'next';
import { Navigation } from '@/components/navigation';
import { Footer } from '@/components/footer';
import { EventCard } from '@/components/event-card';
import { getCmsContent } from '@/lib/cms/storage';
import { events } from '@/lib/data';

export const metadata: Metadata = {
  title: 'Veranstaltungen – Headbang Handwerk',
  description: 'Alle Festival-Termine 2025 von Headbang Handwerk.',
};

export default async function VeranstaltungenPage() {
  const cms = await getCmsContent();
  const confirmed = events.filter((e) => e.status === 'confirmed');
  const planned = events.filter((e) => e.status === 'planned');

  return (
    <>
      <Navigation
        links={cms.site.navigationLinks}
        ctaLabel={cms.site.navigationCtaLabel}
        ctaHref={cms.site.navigationCtaHref}
      />
      <main className="min-h-screen bg-transparent pt-28 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="copy-center content-flow mb-14">
            <h1 className="text-4xl sm:text-5xl font-black text-white">
              Festival{' '}
              <span className="text-[color:var(--color-accent)]">Termine 2025</span>
            </h1>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Wir sind auf den größten Metal-Festivals Europas vertreten. Hier findet ihr alle
              aktuellen und geplanten Veranstaltungen.
            </p>
          </div>

          {confirmed.length > 0 && (
            <div className="mb-14">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center justify-center gap-3">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Bestätigt
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {confirmed.map((e) => (
                  <EventCard key={e.id} event={e} />
                ))}
              </div>
            </div>
          )}

          {planned.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center justify-center gap-3">
                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                Geplant
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {planned.map((e) => (
                  <EventCard key={e.id} event={e} />
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
