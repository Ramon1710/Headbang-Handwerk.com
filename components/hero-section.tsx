import Image from 'next/image';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/button';
import headbangStandImage from '../Headbang Stand Bild.png';

const bullets = [
  'Nachwuchs begeistern',
  'Handwerk erlebbar machen',
  'Unternehmen eine neue Bühne bieten',
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-transparent pt-28 pb-14 sm:pt-32 sm:pb-16">
      <div
        className="absolute inset-0 opacity-45"
        style={{
          backgroundImage:
            'radial-gradient(circle at 24% 8%, rgba(255,134,24,0.2), transparent 38%), radial-gradient(circle at 86% 18%, rgba(255,112,0,0.16), transparent 35%)',
        }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,3,2,0.78)_0%,rgba(6,3,2,0.62)_38%,rgba(6,3,2,0.74)_100%)]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <div className="text-center lg:text-center text-panel text-panel-roomy">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.05] mb-6 text-[#f6be61] drop-shadow-[0_3px_12px_rgba(0,0,0,0.65)]">
              Handwerk
              <br />
              trifft Metal.
            </h1>

            <p className="text-2xl sm:text-3xl text-[#f4ebdf] leading-tight mb-8 max-w-2xl mx-auto">
              Wir bringen das Handwerk auf die größten Metal-Festivals Europas.
            </p>

            <ul className="space-y-3 mb-9 max-w-2xl mx-auto">
              {bullets.map((text) => (
                <li key={text} className="flex items-center justify-center gap-3 text-[#f0dfca] text-xl text-center">
                  <CheckCircle2 className="w-7 h-7 text-[#ffb24e] flex-shrink-0 mt-0.5" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap justify-center gap-4">
              <Button href="/sponsoren" size="lg">
                Jetzt unterstützen
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button href="/veranstaltungen" size="lg" variant="secondary">
                Events ansehen
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-3 rounded-2xl bg-[radial-gradient(circle,rgba(255,131,24,0.35)_0%,rgba(255,131,24,0)_68%)] blur-2xl" />
            <div className="relative rounded-2xl overflow-hidden border border-[#7b4a26] shadow-[0_25px_60px_rgba(0,0,0,0.55)]">
              <Image
                src={headbangStandImage}
                alt="Headbang Handwerk Stand auf einem Festival"
                className="w-full h-auto object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </div>

      <div className="relative max-w-4xl mx-auto mt-16 px-4 sm:px-6">
        <div className="fire-divider mb-9" />
        <div className="section-shell p-8 sm:p-10 text-center">
          <div className="text-panel text-panel-tight max-w-2xl mx-auto">
            <h2 className="text-4xl sm:text-5xl text-[#f2b85d] mb-4">Werde Teil der Bewegung</h2>
            <p className="text-xl text-[#e6d5c0] mb-7">
              Unterstütze uns und bring deine Marke dorthin, wo echte Aufmerksamkeit entsteht.
            </p>
            <Button href="/sponsoren" size="lg">Jetzt unterstützen</Button>
          </div>
        </div>
      </div>
    </section>
  );
}
