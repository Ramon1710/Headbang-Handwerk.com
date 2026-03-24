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
    <section className="py-24 bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="copy-center mb-12">
          <div className="text-panel text-panel-tight">
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-6">
              Warum{' '}
              <span className="text-orange-500">Handwerk und Metal?</span>
            </h2>
            <p className="text-gray-300 text-lg leading-relaxed">
              Was auf den ersten Blick ungewöhnlich klingt, ist bei genauerem Hinsehen eine
              perfekte Symbiose: Beide Welten stehen für Passion, Können und Stolz auf das
              eigene Werk.
            </p>
          </div>
        </div>

        <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 max-w-6xl mx-auto mb-16">
          {reasons.map((reason) => (
            <li key={reason} className="section-shell px-6 py-5 text-center text-gray-200 leading-relaxed flex items-center justify-center gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500/18 flex items-center justify-center">
                <Check className="w-3.5 h-3.5 text-orange-400" />
              </div>
              <span>{reason}</span>
            </li>
          ))}
        </ul>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto text-center">
          {[
            { number: '500K+', label: 'Festivalbesucher pro Saison' },
            { number: '25–45', label: 'Durchschnittsalter der Besucher' },
            { number: '73%', label: 'Handwerklich affine Zielgruppe' },
            { number: '3×', label: 'Höhere Markenerinnerung' },
          ].map(({ number, label }) => (
            <div key={number} className="px-4 py-3">
              <div className="text-4xl font-black text-orange-400 mb-2">{number}</div>
              <div className="text-sm text-gray-400 max-w-[12rem] mx-auto leading-snug">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
