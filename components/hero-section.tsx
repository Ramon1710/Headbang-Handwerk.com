import { ArrowRight, ChevronDown, Zap, Users, Building2 } from 'lucide-react';
import { Button } from './ui/button';

const stats = [
  { value: '5+', label: 'Festivals 2025' },
  { value: '200.000+', label: 'Besucher gesamt' },
  { value: '20+', label: 'Partner & Sponsoren' },
];

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-[#0a0a0a]">
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, #1a1a1a 0px, #1a1a1a 1px, transparent 1px, transparent 60px)',
        }}
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-950/30 via-transparent to-transparent" />
      <div className="absolute top-1/3 -left-32 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
        <div className="max-w-4xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 text-sm font-medium mb-8">
            <Zap className="w-3.5 h-3.5" />
            Festival Season 2025 – Jetzt dabei sein!
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-tight mb-6">
            Handwerk
            <br />
            trifft{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-400">
              Metal.
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl text-gray-400 leading-relaxed mb-10 max-w-2xl">
            Wir bringen das Handwerk auf die lautesten Festivals Europas – für Nachwuchs,
            Sichtbarkeit und ein unvergessliches Erlebnis.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4 mb-16">
            <Button href="/sponsoren" size="lg">
              Jetzt unterstützen
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button href="/veranstaltungen" size="lg" variant="secondary">
              Nächste Veranstaltungen
            </Button>
            <Button href="/kontakt" size="lg" variant="ghost">
              Sponsor werden
            </Button>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-8">
            {stats.map(({ value, label }) => (
              <div key={label}>
                <div className="text-3xl font-black text-orange-500">{value}</div>
                <div className="text-sm text-gray-500 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-gray-600 animate-bounce">
        <ChevronDown className="w-5 h-5" />
      </div>
    </section>
  );
}
