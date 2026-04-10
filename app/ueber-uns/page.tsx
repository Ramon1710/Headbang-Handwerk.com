import type { Metadata } from 'next';
import { Navigation } from '@/components/navigation';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { getCmsContent } from '@/lib/cms/storage';
import { Heart, Target, Rocket } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Über uns – Headbang Handwerk',
};

const values = [
  { icon: Heart, title: 'Leidenschaft', desc: 'Wir lieben Metal und Handwerk gleichermaßen – und das spürt man bei allem, was wir tun.' },
  { icon: Target, title: 'Mission', desc: 'Nachwuchs fürs Handwerk gewinnen, dort wo die Jugend wirklich ist: auf Festivals.' },
  { icon: Rocket, title: 'Vision', desc: 'Headbang Handwerk europaweit auf allen großen Metal-Festivals etablieren.' },
];

export default async function UeberUnsPage() {
  const cms = await getCmsContent();
  const about = cms.site.about;

  return (
    <>
      <Navigation
        links={cms.site.navigationLinks}
        ctaLabel={cms.site.navigationCtaLabel}
        ctaHref={cms.site.navigationCtaHref}
      />
      <main className="min-h-screen bg-transparent pt-28 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="copy-center content-flow mb-16">
            <h1 className="text-4xl sm:text-5xl font-black text-white mb-6">
              {about.title}{' '}
              <span className="text-[color:var(--color-accent)]">{about.accentWord}</span>
            </h1>
            {about.introParagraphs.map((paragraph, index) => (
              <p key={`${index}-${paragraph.slice(0, 24)}`} className={index === 0 ? 'text-gray-400 text-lg leading-relaxed' : 'text-gray-400 leading-relaxed'}>
                {paragraph}
              </p>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {values.map(({ icon: Icon }, index) => {
              const value = about.values[index];

              return (
              <div key={title} className="section-shell p-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--color-accent)]/10 ring-1 ring-[color:var(--color-accent)]/20">
                  <Icon className="h-6 w-6 text-[color:var(--color-accent)]" />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">{value?.title}</h3>
                <p className="text-gray-300 text-sm leading-relaxed max-w-xs mx-auto">{value?.description}</p>
              </div>
              );
            })}
          </div>

          <div className="section-shell p-8 mb-12 text-center">
            <h2 className="text-white font-bold text-2xl mb-6">{about.teamTitle}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {about.teamRoles.map((role) => (
                <div key={role} className="text-center">
                  <div className="w-20 h-20 rounded-full bg-[linear-gradient(180deg,rgba(42,31,24,0.95)_0%,rgba(21,15,11,0.86)_100%)] ring-1 ring-white/6 mx-auto mb-3 flex items-center justify-center text-gray-600 text-2xl">
                    👤
                  </div>
                  <p className="text-gray-400 text-sm">{role}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center">
            <Button href={about.ctaHref} size="lg">{about.ctaLabel}</Button>
          </div>
        </div>
      </main>
      <Footer content={cms.site.footer} />
    </>
  );
}
