import { ArrowRight, Layers } from 'lucide-react';
import { Button } from './ui/button';

export function SectionBannerTeaser() {
  return (
    <section className="py-20 bg-[#0f0f0f]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-[#2a2a2a] bg-gradient-to-br from-orange-950/20 via-[#141414] to-[#141414] p-8 sm:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 text-sm font-medium mb-6">
                <Layers className="w-3.5 h-3.5" />
                3D-Standbau & Bannerflächen
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
                Euer Brand im{' '}
                <span className="text-orange-500">3D-Messestand</span>
              </h2>
              <p className="text-gray-400 leading-relaxed mb-6">
                Mietet Bannerflächen direkt an unserem mobilen Messestand. Von der Frontfläche
                bis zum Overhead-Banner – wählt euren Wunschplatz interaktiv in der 3D-Ansicht
                und bucht sofort online.
              </p>
              <ul className="space-y-2 mb-8">
                {[
                  '6 verschiedene Bannerpositionen verfügbar',
                  'Interaktive 3D-Vorschau des Standes',
                  'Sofortige Online-Buchung möglich',
                  'Personalisierter Druckservice auf Anfrage',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button href="/drei-d-stand" size="lg">
                3D-Stand ansehen <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Visual mockup */}
            <div className="relative">
              <div className="aspect-square max-w-sm mx-auto rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] flex items-center justify-center">
                <div className="text-center">
                  <Layers className="w-20 h-20 text-orange-500/30 mx-auto mb-4" />
                  <p className="text-gray-600 text-sm">3D-Vorschau</p>
                  <p className="text-gray-700 text-xs">interaktive Standkonfiguration</p>
                </div>
                {/* Banner position indicators */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-5 border border-orange-500/40 rounded bg-orange-500/10 flex items-center justify-center">
                  <span className="text-orange-400 text-xs">Front</span>
                </div>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-16 border border-orange-500/20 rounded bg-orange-500/5 flex items-center justify-center">
                  <span className="text-orange-400/50 text-xs rotate-90">Links</span>
                </div>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-16 border border-orange-500/20 rounded bg-orange-500/5 flex items-center justify-center">
                  <span className="text-orange-400/50 text-xs -rotate-90">Rechts</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
