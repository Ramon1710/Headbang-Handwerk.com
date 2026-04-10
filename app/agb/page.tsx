import type { Metadata } from 'next';
import { SiteNavigation } from '@/components/site-navigation';
import { Footer } from '@/components/footer';
import { getCmsContent } from '@/lib/cms/storage';

export const metadata: Metadata = { title: 'AGB – Headbang Handwerk' };

export default async function AGBPage() {
  const cms = await getCmsContent();

  return (
    <>
      <SiteNavigation
        links={cms.site.navigationLinks}
        ctaLabel={cms.site.navigationCtaLabel}
        ctaHref={cms.site.navigationCtaHref}
      />
      <main className="min-h-screen bg-transparent pt-28 pb-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h1 className="text-4xl font-black text-white mb-10 text-center">
            Allgemeine Geschäftsbedingungen
          </h1>
          <div className="legal-copy content-flow text-gray-300">
            <section>
              <h2 className="text-white text-xl font-bold mb-3">§ 1 Geltungsbereich</h2>
              <p className="text-sm leading-relaxed">
                Diese Allgemeinen Geschäftsbedingungen gelten für alle Verträge, die über die
                Website headbang-handwerk.com abgeschlossen werden.
              </p>
            </section>
            <section>
              <h2 className="text-white text-xl font-bold mb-3">§ 2 Vertragsschluss</h2>
              <p className="text-sm leading-relaxed">
                Mit der Buchung eines Sponsoring-Pakets oder einer Bannerfläche kommt ein
                verbindlicher Vertrag zwischen dem Kunden und Headbang Handwerk zustande.
              </p>
            </section>
            <section>
              <h2 className="text-white text-xl font-bold mb-3">§ 3 Zahlung</h2>
              <p className="text-sm leading-relaxed">
                Die Zahlung erfolgt per Stripe (Kreditkarte, SEPA). Die Zahlungsabwicklung
                unterliegt den AGB von Stripe Inc.
              </p>
            </section>
            <section>
              <h2 className="text-white text-xl font-bold mb-3">§ 4 Spendenquittung</h2>
              <p className="text-sm leading-relaxed">
                <strong className="text-white">Hinweis:</strong> Headbang Handwerk ist kein
                eingetragener gemeinnütziger Verein. Spendenquittungen im steuerrechtlichen
                Sinne können daher nicht ausgestellt werden. Auf Wunsch wird eine
                Zahlungsbestätigung ausgestellt.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer content={cms.site.footer} />
    </>
  );
}
