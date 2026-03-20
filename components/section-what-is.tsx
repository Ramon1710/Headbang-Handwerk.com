import { Wrench, Users, Handshake } from 'lucide-react';
import { Card } from './ui/card';

const features = [
  {
    icon: Wrench,
    title: 'Handwerk zeigen',
    description:
      'Live-Demos und Ausstellungen direkt auf dem Festivalgelände. Zeigt tausenden Besuchern, was Handwerk bedeutet und was es kann.',
  },
  {
    icon: Users,
    title: 'Nachwuchs gewinnen',
    description:
      'Begeistert junge Menschen für eine Karriere im Handwerk – dort, wo sie ihre Freizeit verbringen und offen für neue Eindrücke sind.',
  },
  {
    icon: Handshake,
    title: 'Sponsoren verbinden',
    description:
      'Bringt Handwerksbetriebe und Hersteller mit einer kaufkräftigen, engagierten Zielgruppe zusammen.',
  },
];

export function SectionWhatIs() {
  return (
    <section className="py-20 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
            Was ist{' '}
            <span className="text-orange-500">Headbang Handwerk?</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Headbang Handwerk ist eine Plattform, die das deutsche Handwerk auf die größten
            Metal-Festivals bringt – ungewöhnlich, unvergesslich und wirkungsvoll.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, description }) => (
            <Card key={title} hover className="text-center">
              <div className="w-14 h-14 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto mb-5">
                <Icon className="w-7 h-7 text-orange-500" />
              </div>
              <h3 className="text-white font-bold text-lg mb-3">{title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
