import { Check } from 'lucide-react';

const reasons = [
  'Metal-Fans sind zwischen 25–45 Jahre alt – die Kernzielgruppe von Handwerksunternehmen',
  'Über 500.000 Festivalbesucher pro Saison in Deutschland allein',
  'Emotionale Markenbindung durch außergewöhnliche Erlebnisse',
  'Metal-Fans schätzen Qualität, Authentizität und Handarbeit',
  'Nachwuchsgewinnung dort, wo junge Menschen wirklich hingehen',
  'Medienwirksame Aktionen – Fotos, Videos, Social Media Content',
  'Gemeinsame Werte: Leidenschaft, Präzision, Stolz auf das Ergebnis',
];

export function SectionWhy() {
  return (
    <section className="py-20 bg-[#0f0f0f]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text block */}
          <div>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-6">
              Warum{' '}
              <span className="text-orange-500">Handwerk und Metal?</span>
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed mb-8">
              Was auf den ersten Blick ungewöhnlich klingt, ist bei genauerem Hinsehen eine
              perfekte Symbiose: Beide Welten stehen für Passion, Können und Stolz auf das
              eigene Werk.
            </p>
            <ul className="space-y-3">
              {reasons.map((reason) => (
                <li key={reason} className="flex items-start gap-3">
                  <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center">
                    <Check className="w-3 h-3 text-orange-500" />
                  </div>
                  <span className="text-gray-300 text-sm leading-relaxed">{reason}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right: Visual */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { number: '500K+', label: 'Festivalbesucher\npro Saison' },
              { number: '25–45', label: 'Durchschnittsalter\nder Besucher' },
              { number: '73%', label: 'Handwerklich\naffine Zielgruppe' },
              { number: '3×', label: 'Höhere Marken-\nerinnerung' },
            ].map(({ number, label }) => (
              <div
                key={number}
                className="rounded-xl border border-[#2a2a2a] bg-[#141414] p-6 text-center hover:border-orange-500/40 transition-colors"
              >
                <div className="text-3xl font-black text-orange-500 mb-2">{number}</div>
                <div className="text-gray-400 text-xs leading-tight whitespace-pre-line">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
