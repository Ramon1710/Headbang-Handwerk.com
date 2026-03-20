import type { Metadata } from 'next';
import { Navigation } from '@/components/navigation';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Heart, Target, Rocket } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Über uns – Headbang Handwerk',
};

const values = [
  { icon: Heart, title: 'Leidenschaft', desc: 'Wir lieben Metal und Handwerk gleichermaßen – und das spürt man bei allem, was wir tun.' },
  { icon: Target, title: 'Mission', desc: 'Nachwuchs fürs Handwerk gewinnen, dort wo die Jugend wirklich ist: auf Festivals.' },
  { icon: Rocket, title: 'Vision', desc: 'Headbang Handwerk europaweit auf allen großen Metal-Festivals etablieren.' },
];

export default function UeberUnsPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-[#0a0a0a] pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-16">
            <h1 className="text-4xl sm:text-5xl font-black text-white mb-6">
              Über{' '}
              <span className="text-orange-500">uns</span>
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed mb-6">
              Headbang Handwerk wurde mit einer einfachen Idee gegründet: Das Handwerk braucht
              neue Wege, um junge Menschen zu begeistern. Und Festivals sind genau der richtige
              Ort dafür.
            </p>
            <p className="text-gray-400 leading-relaxed">
              Wir sind ein Team aus Handwerksbegeisterten und Metal-Fans, das glaubt: Wer
              einmal live gesehen hat, wie eine Klinge geschmiedet wird oder wie ein
              Zimmermann arbeitet, der vergisst das nicht mehr. Genau das wollen wir zeigen –
              laut, lebendig, unvergesslich.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {values.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-xl border border-[#2a2a2a] bg-[#141414] p-6">
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-orange-500" />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* Team placeholder */}
          <div className="rounded-xl border border-[#2a2a2a] bg-[#141414] p-8 mb-12">
            <h2 className="text-white font-bold text-2xl mb-6">Das Team</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {['Gründer & Projektleitung', 'Marketing & Social Media', 'Technik & Aufbau'].map((role) => (
                <div key={role} className="text-center">
                  <div className="w-20 h-20 rounded-full bg-[#2a2a2a] mx-auto mb-3 flex items-center justify-center text-gray-600 text-2xl">
                    👤
                  </div>
                  <p className="text-gray-500 text-sm">{role}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center">
            <Button href="/kontakt" size="lg">Kontakt aufnehmen</Button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
