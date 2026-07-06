import type { Metadata } from 'next';
import { SiteNavigation } from '@/components/site-navigation';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { getCmsContent } from '@/lib/cms/storage';
import { MERCHANDISE_SUPPORT_TEXT } from '@/lib/merchandise';
import { MerchandiseCheckoutSuccessReset } from './success-reset';

export const metadata: Metadata = { title: 'Danke für deine Bestellung – Headbang Handwerk' };

export default async function MerchandiseDankePage() {
  const cms = await getCmsContent();

  return (
    <>
      <MerchandiseCheckoutSuccessReset />
      <SiteNavigation links={cms.site.navigationLinks} ctaLabel={cms.site.navigationCtaLabel} ctaHref={cms.site.navigationCtaHref} />
      <main className="min-h-screen bg-[#0a0a0a] pt-24 pb-20 flex items-center justify-center">
        <div className="content-flow body-copy text-center max-w-lg mx-auto px-4">
          <div className="text-6xl">🛒</div>
          <h1 className="page-title">
            Danke für deine <span>Bestellung!</span>
          </h1>
          <p className="body-copy-lg">
            Deine Merchandise-Bestellung wurde erfolgreich ausgelöst. Du erhältst in Kürze eine Bestätigung per E-Mail.
          </p>
          <p className="body-copy rounded-[1.2rem] border border-[color:var(--color-border)]/80 bg-black/20 px-5 py-4 text-sm">
            {MERCHANDISE_SUPPORT_TEXT}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button href="/merchandise" size="lg">Zurück zum Shop</Button>
            <Button href="/kontakt" size="lg" variant="secondary">Kontakt aufnehmen</Button>
          </div>
        </div>
      </main>
      <Footer content={cms.site.footer} />
    </>
  );
}