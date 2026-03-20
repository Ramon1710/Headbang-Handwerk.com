import type { Metadata } from 'next';
import { Navigation } from '@/components/navigation';
import { Footer } from '@/components/footer';
import { ContactForm } from '@/components/contact-form';
import { Mail, Instagram, Facebook } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Kontakt – Headbang Handwerk',
};

export default function KontaktPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-[#0a0a0a] pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Left: Info */}
            <div className="lg:col-span-1">
              <h1 className="text-4xl font-black text-white mb-4">
                <span className="text-orange-500">Kontakt</span>
              </h1>
              <p className="text-gray-400 leading-relaxed mb-8">
                Habt ihr Fragen, wollt ihr Sponsor werden oder sucht ihr eine Bannerfläche?
                Schreibt uns – wir antworten innerhalb von 1–2 Werktagen.
              </p>

              <div className="space-y-4">
                <a
                  href="mailto:info@headbang-handwerk.com"
                  className="flex items-center gap-3 text-gray-400 hover:text-orange-400 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg border border-[#2a2a2a] flex items-center justify-center">
                    <Mail className="w-4 h-4 text-orange-500" />
                  </div>
                  info@headbang-handwerk.com
                </a>
                <a
                  href="#"
                  className="flex items-center gap-3 text-gray-400 hover:text-orange-400 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg border border-[#2a2a2a] flex items-center justify-center">
                    <Instagram className="w-4 h-4 text-orange-500" />
                  </div>
                  @headbanghandwerk
                </a>
                <a
                  href="#"
                  className="flex items-center gap-3 text-gray-400 hover:text-orange-400 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg border border-[#2a2a2a] flex items-center justify-center">
                    <Facebook className="w-4 h-4 text-orange-500" />
                  </div>
                  Headbang Handwerk
                </a>
              </div>
            </div>

            {/* Right: Form */}
            <div className="lg:col-span-2">
              <div className="rounded-xl border border-[#2a2a2a] bg-[#141414] p-8">
                <h2 className="text-white font-bold text-xl mb-6">Nachricht senden</h2>
                <ContactForm />
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
