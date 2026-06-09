import type { Metadata } from 'next';
import { SiteNavigation } from '@/components/site-navigation';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { getCmsContent } from '@/lib/cms/storage';

export const metadata: Metadata = { title: 'Danke – Headbang Handwerk' };

export default async function DankePage() {
  const cms = await getCmsContent();

  return (
    <>
      <SiteNavigation
        links={cms.site.navigationLinks}
        ctaLabel={cms.site.navigationCtaLabel}
        ctaHref={cms.site.navigationCtaHref}
      />
      <main className="min-h-screen bg-[#0a0a0a] pt-24 pb-20 flex items-center justify-center">
        <div className="content-flow body-copy text-center max-w-lg mx-auto px-4">
          <div className="text-6xl">🤘</div>
          <h1 className="page-title">
            Danke für dein{' '}
            <span>Sponsoring!</span>
          </h1>
          <p className="body-copy-lg">
            Zahlung erfolgreich! Wir freuen uns riesig über deine Unterstützung. Du erhältst in
            Kürze eine Bestätigung per E-Mail.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button href="/" size="lg">Zur Startseite</Button>
            <Button href="/kontakt" size="lg" variant="secondary">Kontakt aufnehmen</Button>
          </div>
        </div>
      </main>
      <Footer content={cms.site.footer} />
    </>
  );
}
