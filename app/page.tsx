import Image from 'next/image';
import { Hammer, Flame, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Navigation } from '@/components/navigation';
import { Button } from '@/components/ui/button';
import headbangLogo from '../Headbang Handwerk e.V. Logo.png';
import headbangStandImage from '../Headbang Stand Bild.png';
import wackenBackgroundImage from '../Wacken Hintergrund Bild.png';

const goals = [
  'Nachwuchs begeistern',
  'Handwerk sichtbar machen',
  'Unternehmen eine neue Bühne bieten',
];

export default function HomePage() {
  return (
    <>
      <Navigation />
      <main
        className="relative isolate min-h-screen overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(rgba(6, 3, 2, 0.82), rgba(6, 3, 2, 0.95)), url(${wackenBackgroundImage.src})`,
          backgroundPosition: 'center top, center top',
          backgroundRepeat: 'no-repeat, no-repeat',
          backgroundSize: 'cover, cover',
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_14%,rgba(255,136,32,0.18)_0%,transparent_32%),radial-gradient(circle_at_86%_18%,rgba(255,168,76,0.14)_0%,transparent_26%),linear-gradient(180deg,rgba(8,5,3,0.26)_0%,rgba(8,5,3,0.84)_100%)]" />
        <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] [background-size:120px_120px]" />

        <div className="relative z-10 px-4 pb-20 pt-28 sm:px-6 sm:pt-32 lg:px-8 lg:pb-28">
          <section className="mx-auto grid max-w-7xl grid-cols-1 gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-start lg:gap-14">
            <div className="relative">
              <div className="absolute -left-10 top-4 hidden h-40 w-40 rounded-full bg-orange-500/12 blur-3xl lg:block" />

              <div className="relative text-panel text-panel-roomy sm:p-10 lg:p-12">
                <div className="mb-8 flex items-center gap-4">
                  <div className="rounded-2xl bg-[linear-gradient(180deg,rgba(34,23,17,0.92)_0%,rgba(16,11,8,0.72)_100%)] px-4 py-3 ring-1 ring-[#8b572f]/55 shadow-[0_16px_32px_rgba(0,0,0,0.22)]">
                    <Image
                      src={headbangLogo}
                      alt="Headbang Handwerk e.V. Logo"
                      priority
                      className="h-auto w-24 sm:w-28"
                    />
                  </div>
                  <div className="hidden h-px flex-1 bg-[linear-gradient(90deg,rgba(255,165,76,0.55)_0%,rgba(255,165,76,0)_100%)] sm:block" />
                </div>

                <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#7e4d2a] bg-[#1b120d]/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#f4c481] backdrop-blur-sm sm:text-sm">
                  <Flame className="h-4 w-4 text-[#ff9b39]" />
                  Festival. Handwerk. Haltung.
                </div>

                <h1 className="max-w-4xl text-5xl font-black leading-[0.98] text-[#fbf1e4] sm:text-6xl lg:text-[4.7rem] xl:text-[5.2rem]">
                  Handwerk trifft Metal. Leidenschaft trifft Zukunft.
                </h1>

                <div className="mt-10 space-y-7 text-base leading-8 text-[#e6d7c2] sm:text-lg sm:leading-9">
                  <div className="border-l-2 border-[#ff8f2a]/65 pl-5 sm:pl-6">
                    <p>
                      Wir bringen das Handwerk dorthin, wo Energie, Gemeinschaft und Begeisterung aufeinandertreffen – auf die größten Metal-Festivals Europas.
                    </p>
                  </div>

                  <div className="text-panel text-panel-tight bg-[linear-gradient(180deg,rgba(26,17,12,0.68)_0%,rgba(15,10,8,0.24)_100%)]">
                    <p>
                      Mit Headbang Handwerk e.V. schaffen wir eine Plattform, die zeigt, wie modern, vielseitig und kraftvoll das Handwerk wirklich ist. Zwischen Bühne, Feuer und tausenden Festivalbesuchern entsteht ein Ort, an dem echtes Können erlebbar wird: live, zum Anfassen und zum Mitmachen.
                    </p>
                  </div>

                  <div className="rounded-[1.75rem] border border-[#734624]/55 bg-[linear-gradient(180deg,rgba(41,24,14,0.84)_0%,rgba(18,11,8,0.5)_100%)] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.22)] sm:p-7">
                    <div className="mb-5 flex items-center gap-3 text-[#ffc97a]">
                      <Hammer className="h-5 w-5 text-[#ff9d3c]" />
                      <p className="text-lg font-bold tracking-[0.04em]">Unser Ziel ist klar:</p>
                    </div>
                    <ul className="grid gap-3 sm:grid-cols-3 sm:gap-4">
                      {goals.map((goal) => (
                        <li
                          key={goal}
                          className="group flex items-center gap-3 rounded-2xl bg-[linear-gradient(180deg,rgba(255,150,56,0.12)_0%,rgba(255,150,56,0.02)_100%)] px-4 py-4 ring-1 ring-[#8c542b]/45 transition-all duration-200 hover:-translate-y-0.5 hover:ring-[#c87835]"
                        >
                          <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-[#ffad56]" />
                          <span className="text-sm font-semibold text-[#f7e7d3] sm:text-base">{goal}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid gap-6 lg:grid-cols-1 xl:grid-cols-2">
                    <div className="rounded-[1.5rem] bg-black/18 px-5 py-5 ring-1 ring-white/6 backdrop-blur-sm">
                      <p>
                        Gemeinsam mit Partnern aus der Wirtschaft, Innungen und Betrieben präsentieren wir das Handwerk nicht als Pflicht – sondern als Erlebnis.
                      </p>
                    </div>
                    <div className="rounded-[1.5rem] bg-black/18 px-5 py-5 ring-1 ring-white/6 backdrop-blur-sm">
                      <p>
                        Ob durch interaktive Aktionen, Live-Demonstrationen oder innovative Standkonzepte: Wir zeigen, dass Handwerk genauso laut, ehrlich und leidenschaftlich ist wie die Musik, die diese Festivals prägt.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:sticky lg:top-28">
              <div className="relative mx-auto max-w-2xl lg:max-w-none">
                <div className="absolute -inset-6 rounded-[2.2rem] bg-[radial-gradient(circle,rgba(255,128,26,0.25)_0%,rgba(255,128,26,0.04)_48%,rgba(255,128,26,0)_72%)] blur-2xl" />
                <div className="absolute -right-4 top-8 hidden h-36 w-36 rounded-full bg-orange-500/16 blur-3xl sm:block" />

                <div className="relative overflow-hidden rounded-[2.1rem] border border-[#8f562b]/55 bg-[linear-gradient(180deg,rgba(34,22,15,0.96)_0%,rgba(14,10,8,0.94)_100%)] p-3 shadow-[0_32px_90px_rgba(0,0,0,0.52)] sm:p-4">
                  <div className="absolute left-5 top-5 z-10 inline-flex items-center gap-2 rounded-full bg-black/55 px-3 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[#f8c887] ring-1 ring-[#936038]/65 backdrop-blur-sm sm:text-xs">
                    <Sparkles className="h-3.5 w-3.5 text-[#ffab4e]" />
                    Live am Stand
                  </div>

                  <div className="relative overflow-hidden rounded-[1.55rem] ring-1 ring-white/8">
                    <Image
                      src={headbangStandImage}
                      alt="Headbang Handwerk Stand auf einem Festival"
                      priority
                      className="h-auto w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,4,2,0.03)_0%,rgba(7,4,2,0.32)_100%)]" />
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl bg-[#120d0a]/90 px-4 py-4 text-center ring-1 ring-white/6">
                      <p className="text-2xl font-black text-[#ffb14d]">Metal</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[#cbb59a]">Atmosphäre</p>
                    </div>
                    <div className="rounded-2xl bg-[#120d0a]/90 px-4 py-4 text-center ring-1 ring-white/6">
                      <p className="text-2xl font-black text-[#ffb14d]">Handwerk</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[#cbb59a]">Erlebbar</p>
                    </div>
                    <div className="rounded-2xl bg-[#120d0a]/90 px-4 py-4 text-center ring-1 ring-white/6">
                      <p className="text-2xl font-black text-[#ffb14d]">Energie</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[#cbb59a]">Direkt vor Ort</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mx-auto mt-14 max-w-7xl lg:mt-18">
            <div className="section-shell overflow-hidden rounded-[2rem] p-6 sm:p-8 lg:p-10">
              <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,153,51,0.9),transparent)]" />
              <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-10">
                <div>
                  <p className="mb-4 text-xl font-bold tracking-[0.02em] text-[#f0b86a] sm:text-2xl">
                    🤘 Werde Teil der Bewegung
                  </p>
                  <p className="max-w-4xl text-lg leading-8 text-[#eadbc7] sm:text-xl sm:leading-9">
                    Unterstütze uns dabei, das Handwerk neu zu denken und sichtbar zu machen. Als Partner, Sponsor oder Unterstützer bringst du deine Marke dorthin, wo echte Aufmerksamkeit entsteht – mitten ins Leben.
                  </p>
                  <p className="mt-6 max-w-4xl text-2xl font-black leading-tight text-[#fff2de] sm:text-3xl">
                    Headbang Handwerk – weil echtes Handwerk keine Bühne braucht. Wir bauen sie einfach.
                  </p>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row lg:flex-col xl:flex-row">
                  <Button href="#" size="lg">
                    Jetzt Unterstützen
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button href="#" size="lg" variant="secondary">
                    Sponsor werden
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
