import type { Metadata } from 'next';
import { Navigation } from '@/components/navigation';
import { Footer } from '@/components/footer';
import { getCmsContent } from '@/lib/cms/storage';

export const metadata: Metadata = { title: 'Impressum – Headbang Handwerk' };

export default async function ImpressumPage() {
  const cms = await getCmsContent();

  return (
    <>
      <Navigation
        links={cms.site.navigationLinks}
        ctaLabel={cms.site.navigationCtaLabel}
        ctaHref={cms.site.navigationCtaHref}
      />
      <main className="min-h-screen bg-transparent pt-28 pb-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h1 className="text-4xl font-black text-white mb-10 text-center">Impressum</h1>
          <div className="legal-copy content-flow text-gray-300">
            <h2 className="text-white text-xl font-bold">Angaben gemäß § 5 TMG</h2>
            <p>
              Headbang Handwerk<br />
              [Vorname Nachname]<br />
              [Straße Nr.]<br />
              [PLZ Ort]
            </p>
            <h2 className="text-white text-xl font-bold">Kontakt</h2>
            <p>
              E-Mail: info@headbang-handwerk.com
            </p>
            <h2 className="text-white text-xl font-bold">Haftung für Inhalte</h2>
            <p>
              Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen
              Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir
              als Diensteanbieter jedoch nicht unter der Verpflichtung, übermittelte oder
              gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen,
              die auf eine rechtswidrige Tätigkeit hinweisen.
            </p>
            <p className="text-xs text-gray-500">
              Bitte ersetze die Platzhalter [Vorname Nachname], [Straße Nr.] und [PLZ Ort] mit
              deinen echten Angaben.
            </p>
          </div>
        </div>
      </main>
      <Footer content={cms.site.footer} />
    </>
  );
}
