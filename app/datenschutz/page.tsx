import type { Metadata } from 'next';
import { Navigation } from '@/components/navigation';
import { Footer } from '@/components/footer';

export const metadata: Metadata = { title: 'Datenschutz – Headbang Handwerk' };

export default function DatenschutzPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-transparent pt-28 pb-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h1 className="text-4xl font-black text-white mb-10 text-center">Datenschutzerklärung</h1>
          <div className="legal-copy text-gray-300 space-y-8">
            <section>
              <h2 className="text-white text-xl font-bold mb-3">1. Datenschutz auf einen Blick</h2>
              <p className="text-sm leading-relaxed">
                Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren
                personenbezogenen Daten passiert, wenn Sie diese Website besuchen.
              </p>
            </section>
            <section>
              <h2 className="text-white text-xl font-bold mb-3">2. Datenerfassung auf dieser Website</h2>
              <p className="text-sm leading-relaxed">
                Wir erheben Daten, die Sie uns aktiv mitteilen (z.B. über das Kontaktformular).
                Diese werden ausschließlich zur Bearbeitung Ihrer Anfrage verwendet und nicht
                an Dritte weitergegeben.
              </p>
            </section>
            <section>
              <h2 className="text-white text-xl font-bold mb-3">3. Hosting</h2>
              <p className="text-sm leading-relaxed">
                Diese Website wird bei Vercel Inc. gehostet. Details entnehmen Sie der
                Datenschutzerklärung von Vercel: https://vercel.com/legal/privacy-policy
              </p>
            </section>
            <section>
              <h2 className="text-white text-xl font-bold mb-3">4. Kontakt</h2>
              <p className="text-sm leading-relaxed">
                Bei Fragen zum Datenschutz wenden Sie sich bitte an:
                info@headbang-handwerk.com
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
