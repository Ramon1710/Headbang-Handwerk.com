import type { Metadata } from 'next';
import { Footer } from '@/components/footer';
import { SiteNavigation } from '@/components/site-navigation';
import { getCmsContent } from '@/lib/cms/storage';
import { GameClient } from './game-client';

export const metadata: Metadata = {
  title: 'Game – Der Baustellen-Rocker',
  description: 'Das Headbang-Handwerk Minigame: Werkzeuge und Biere fangen, Nägeln ausweichen und bis zum Feierabend durchhalten.',
};

export default async function GamePage() {
  const cms = await getCmsContent();

  return (
    <>
      <SiteNavigation
        links={cms.site.navigationLinks}
        ctaLabel={cms.site.navigationCtaLabel}
        ctaHref={cms.site.navigationCtaHref}
      />
      <main className="min-h-screen bg-transparent">
        <GameClient />
      </main>
      <Footer content={cms.site.footer} />
    </>
  );
}