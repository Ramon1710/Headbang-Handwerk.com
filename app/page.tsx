import Image from 'next/image';
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Flame,
  Hammer,
  MapPin,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from 'lucide-react';
import { Navigation } from '@/components/navigation';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { events, sponsorPackages } from '@/lib/data';
import { formatPrice } from '@/lib/utils';
import headbangStandImage from '../Headbang Stand Bild.png';
import wackenBackgroundImage from '../Wacken Hintergrund Bild.png';

const promiseCards = [
  {
    title: 'Sichtbarkeit mit Haltung',
    text: 'Wir bringen Marken, Betriebe und Innungen in einen Kontext, der auffällt und glaubwürdig wirkt.',
    icon: Flame,
  },
  {
    title: 'Nachwuchs, der wirklich hinschaut',
    text: 'Festivalumfelder schaffen Aufmerksamkeit, Nähe und echte Gespräche statt austauschbarer Werbekontakte.',
    icon: Users,
  },
  {
    title: 'Handwerk zum Anfassen',
    text: 'Live-Demos, Mitmachaktionen und Standkonzepte machen Können sichtbar, nicht nur behauptet.',
    icon: Hammer,
  },
];

const processSteps = [
  {
    number: '01',
    title: 'Projekt auswählen',
    text: 'Du entscheidest, ob du Wacken 2027, kommende Festivals oder einzelne Aktivierungen unterstützen willst.',
  },
  {
    number: '02',
    title: 'Passendes Paket finden',
    text: 'Von sichtbarer Grundpräsenz bis zur prominenten Partnerrolle stimmen wir die Beteiligung auf dein Ziel ab.',
  },
  {
    number: '03',
    title: 'Aktivierung gemeinsam planen',
    text: 'Wir übersetzen Marke, Gewerk und Botschaft in einen Auftritt, der im Festival funktioniert.',
  },
  {
    number: '04',
    title: 'Vor Ort Wirkung erzeugen',
    text: 'Am Stand entstehen Erlebnisse, Gespräche, Content und Kontakte, die weit über das Festival hinaus wirken.',
  },
];

const focusPoints = [
  'Wacken 2027 als nächster großer Meilenstein',
  'Partner, Sponsoren und Betriebe als sichtbarer Teil des Projekts',
  'Interaktive Formate statt statischer Werbeflächen',
  'Klare Ansprache für Nachwuchs, Öffentlichkeit und Branche',
];

const highlightStats = [
  { value: '2027', label: 'Zieljahr für den nächsten großen Wacken-Auftritt' },
  { value: '3+', label: 'Festivalformate bereits in Planung oder Vorbereitung' },
  { value: '4', label: 'Sponsoring-Stufen für unterschiedliche Partnerziele' },
  { value: '100%', label: 'Fokus auf echtes Erleben statt austauschbarer Werbung' },
];

const featuredEvents = events.slice(0, 3);
const featuredPackages = sponsorPackages.slice(0, 3);

const statusLabels: Record<(typeof featuredEvents)[number]['status'], string> = {
  confirmed: 'Bestätigt',
  planned: 'Geplant',
  completed: 'Abgeschlossen',
};

export default function HomePage() {
  return (
    <>
      <Navigation />
      <main
        className="relative isolate overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(rgba(5, 3, 2, 0.78), rgba(5, 3, 2, 0.96)), url(${wackenBackgroundImage.src})`,
          backgroundPosition: 'center top, center top',
          backgroundRepeat: 'no-repeat, no-repeat',
          backgroundSize: 'cover, cover',
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_10%,rgba(255,143,42,0.22)_0%,transparent_32%),radial-gradient(circle_at_88%_14%,rgba(255,168,76,0.15)_0%,transparent_26%),linear-gradient(180deg,rgba(8,5,3,0.18)_0%,rgba(8,5,3,0.82)_100%)]" />
        <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:120px_120px]" />

        <div className="relative z-10 px-4 pb-32 pt-12 sm:px-6 lg:px-8 lg:pb-48 lg:pt-16">
          <section className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16 lg:pt-8">
            <div className="relative">
              <div className="absolute -left-10 top-6 hidden h-44 w-44 rounded-full bg-orange-500/14 blur-3xl lg:block" />

              <div className="relative rounded-[1.75rem] border border-white/8 bg-[linear-gradient(180deg,rgba(18,12,9,0.18)_0%,rgba(18,12,9,0.05)_100%)] shadow-[0_16px_40px_rgba(0,0,0,0.12)] backdrop-blur-[10px] sm:p-11 lg:p-14">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#80502b]/60 bg-[#1b120d]/32 px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[#f4c481] backdrop-blur-sm sm:text-xs">
                  <Sparkles className="h-4 w-4 text-[#ff9b39]" />
                  Startseite mit klarem Projektfokus
                </div>

                <h1 className="mt-8 max-w-4xl text-5xl font-black leading-[0.95] text-[#fbf1e4] sm:text-6xl lg:text-[4.65rem] xl:text-[5.15rem]">
                  Handwerk sichtbar machen.
                  <br />
                  Dort, wo Energie entsteht.
                </h1>

                <p className="mt-8 max-w-3xl text-lg leading-8 text-[#e9dac6] sm:text-[1.18rem] sm:leading-9">
                  Headbang Handwerk bringt Betriebe, Marken und Nachwuchs in ein Umfeld, das Aufmerksamkeit nicht erkauft, sondern erzeugt. Auf den größten Metal-Festivals Europas wird Handwerk live erlebbar, modern inszeniert und glaubwürdig vermittelt.
                </p>

                <div className="mt-16 flex flex-col gap-4 sm:flex-row lg:mt-20">
                  <Button href="/sponsoren" size="lg" className="min-w-56 justify-center">
                    Jetzt Partner werden
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button href="/veranstaltungen" size="lg" variant="secondary" className="min-w-56 justify-center">
                    Veranstaltungen ansehen
                  </Button>
                </div>

                <div className="mt-[4.5rem] grid gap-6 sm:grid-cols-3 lg:mt-[6rem]">
                  <div className="rounded-2xl bg-[linear-gradient(180deg,rgba(255,155,57,0.08)_0%,rgba(255,155,57,0.015)_100%)] px-6 py-6 ring-1 ring-[#92592f]/28 backdrop-blur-[6px]">
                    <p className="text-2xl font-black text-[#ffbe6f]">Wacken 2027</p>
                    <p className="mt-1 text-sm leading-6 text-[#dbc4aa]">Nächster großer Meilenstein im Projekt</p>
                  </div>
                  <div className="rounded-2xl bg-[linear-gradient(180deg,rgba(255,155,57,0.08)_0%,rgba(255,155,57,0.015)_100%)] px-6 py-6 ring-1 ring-[#92592f]/28 backdrop-blur-[6px]">
                    <p className="text-2xl font-black text-[#ffbe6f]">Live-Demos</p>
                    <p className="mt-1 text-sm leading-6 text-[#dbc4aa]">Handwerk als Erlebnis statt nur als Botschaft</p>
                  </div>
                  <div className="rounded-2xl bg-[linear-gradient(180deg,rgba(255,155,57,0.08)_0%,rgba(255,155,57,0.015)_100%)] px-6 py-6 ring-1 ring-[#92592f]/28 backdrop-blur-[6px]">
                    <p className="text-2xl font-black text-[#ffbe6f]">Partnernetzwerk</p>
                    <p className="mt-1 text-sm leading-6 text-[#dbc4aa]">Betriebe, Innungen und Unterstützer an einem Ort</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative lg:pt-10">
              <div className="absolute -inset-6 rounded-[2.4rem] bg-[radial-gradient(circle,rgba(255,128,26,0.24)_0%,rgba(255,128,26,0.04)_48%,rgba(255,128,26,0)_72%)] blur-2xl" />
              <div className="relative rounded-[2.2rem] border border-[#8f562b]/32 bg-[linear-gradient(180deg,rgba(30,20,14,0.26)_0%,rgba(13,9,7,0.14)_100%)] p-3 pb-5 shadow-[0_24px_60px_rgba(0,0,0,0.18)] backdrop-blur-[10px] sm:p-4 sm:pb-6">
                <div className="absolute left-5 top-5 z-10 inline-flex items-center gap-2 rounded-full bg-black/24 px-3 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[#f8c887] ring-1 ring-[#936038]/45 backdrop-blur-sm sm:text-xs">
                  <Flame className="h-3.5 w-3.5 text-[#ffab4e]" />
                  Live am Stand
                </div>

                <div className="relative overflow-hidden rounded-[1.7rem] ring-1 ring-white/8">
                  <Image
                    src={headbangStandImage}
                    alt="Headbang Handwerk Stand auf einem Festival"
                    priority
                    className="h-auto w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,4,2,0.02)_0%,rgba(7,4,2,0.34)_100%)]" />
                </div>

                <div className="mt-6 grid gap-4 pb-1">
                  <div className="rounded-[1.6rem] bg-[#120d0a]/26 px-5 py-5 ring-1 ring-white/8 backdrop-blur-[8px]">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[#ffbf76]">Projektfokus</p>
                        <p className="mt-2 text-2xl font-black text-[#fff0da]">Wacken Open Air 2027</p>
                      </div>
                      <Target className="mt-1 h-5 w-5 flex-shrink-0 text-[#ff9d3c]" />
                    </div>
                    <p className="mt-4 text-sm leading-7 text-[#dcc8b0] sm:text-[0.98rem]">
                      Der nächste große Schritt ist ein eigener Stand mit starken Partnern, sichtbaren Aktionen und einer klaren Botschaft: Handwerk gehört mitten ins Leben und auf große Bühnen.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl bg-[#120d0a]/22 px-5 py-4 ring-1 ring-white/8 backdrop-blur-[8px]">
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#caa985]">Ansprache</p>
                      <p className="mt-2 pb-1 text-lg font-black leading-[1.2] text-[#ffb14d]">Laut. Echt. Nahbar.</p>
                    </div>
                    <div className="rounded-2xl bg-[#120d0a]/22 px-5 py-4 ring-1 ring-white/8 backdrop-blur-[8px]">
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#caa985]">Wirkung</p>
                      <p className="mt-2 pb-1 text-lg font-black leading-[1.2] text-[#ffb14d]">Erlebnis statt Bannerdenken</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mx-auto mt-[4.5rem] max-w-7xl py-8 lg:mt-[6rem] lg:py-[3.5rem]">
            <div className="overflow-hidden rounded-[1.7rem] border border-[#704321]/30 bg-[linear-gradient(90deg,rgba(30,18,12,0.2)_0%,rgba(16,10,8,0.08)_50%,rgba(30,18,12,0.2)_100%)] shadow-[0_14px_34px_rgba(0,0,0,0.1)] backdrop-blur-[10px]">
              <div className="grid gap-6 px-5 py-5 sm:px-6 sm:py-6 lg:grid-cols-4 lg:gap-7 lg:px-8">
                {highlightStats.map((item) => (
                  <div key={item.label} className="rounded-2xl bg-black/8 px-5 py-5 ring-1 ring-white/8 backdrop-blur-[6px]">
                    <p className="text-3xl font-black text-[#ffd08f]">{item.value}</p>
                    <p className="mt-2 text-sm leading-6 text-[#e5d5c0]">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div aria-hidden="true" className="h-16 lg:h-28 xl:h-36" />

          <section className="mx-auto max-w-7xl py-12 lg:py-[6rem]">
            <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-[4.5rem]">
              <div className="rounded-[1.75rem] border border-white/8 bg-[linear-gradient(180deg,rgba(18,12,9,0.16)_0%,rgba(18,12,9,0.05)_100%)] px-8 py-8 shadow-[0_16px_40px_rgba(0,0,0,0.1)] backdrop-blur-[10px] sm:px-10 sm:py-10 lg:px-12 lg:py-12">
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#ffbf76]">Was wir hier eigentlich bauen</p>
                <h2 className="mt-5 text-4xl font-black leading-tight text-[#fff0da] sm:text-[3rem]">
                  Kein Messestand wie jeder andere.
                </h2>
                <p className="mt-6 text-lg leading-8 text-[#e7d8c4] sm:text-[1.08rem] sm:leading-9">
                  Headbang Handwerk verbindet Festivalenergie mit echter Handwerkskompetenz. Das Prinzip dahinter ist einfach: erst Aufmerksamkeit, dann Nähe, dann Relevanz. So wird aus Sichtbarkeit konkrete Bindung.
                </p>
                <ul className="mt-8 space-y-4">
                  {focusPoints.map((point) => (
                    <li key={point} className="flex items-start gap-3 text-[#eedfcb]">
                      <CheckCircle2 className="mt-1 h-5 w-5 flex-shrink-0 text-[#ffad56]" />
                      <span className="leading-7">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid gap-8 pt-6 md:grid-cols-3 lg:gap-10 lg:pt-12">
                {promiseCards.map(({ title, text, icon: Icon }) => (
                  <div
                    key={title}
                    className="rounded-[1.7rem] border border-[#714422]/26 bg-[linear-gradient(180deg,rgba(27,17,12,0.18)_0%,rgba(14,10,8,0.06)_100%)] p-7 shadow-[0_14px_32px_rgba(0,0,0,0.08)] backdrop-blur-[10px]"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,rgba(255,155,57,0.09)_0%,rgba(255,155,57,0.02)_100%)] ring-1 ring-[#a76737]/28 backdrop-blur-[6px]">
                      <Icon className="h-5 w-5 text-[#ffab4e]" />
                    </div>
                    <h3 className="mt-5 text-xl font-black text-[#fff0da]">{title}</h3>
                    <p className="mt-4 text-sm leading-7 text-[#d9c3a8] sm:text-[0.97rem]">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div aria-hidden="true" className="h-20 lg:h-32 xl:h-40" />

          <section className="mx-auto max-w-7xl py-[3.5rem] lg:py-[7rem]">
            <div className="grid gap-16 lg:grid-cols-[0.92fr_1.08fr] lg:items-start lg:gap-24">
              <div className="max-w-3xl lg:pt-2">
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#ffbf76]">So funktioniert die Beteiligung</p>
                <h2 className="mt-5 text-4xl font-black leading-[0.96] text-[#fff0da] sm:text-[3rem] lg:text-[3.4rem]">Vom Interesse bis zur Festivalpräsenz.</h2>
              </div>
              <p className="max-w-2xl text-base leading-8 text-[#dcc8b0] sm:text-[1.04rem] sm:leading-9 lg:pt-6">
                Die Startseite führt jetzt klarer durch das Projekt: zuerst der Nutzen, dann der Ablauf, danach die konkreten Einstiegspunkte für Sponsoren und Unterstützer.
              </p>
            </div>

            <div className="mt-24 grid gap-10 lg:grid-cols-4 lg:gap-x-10 lg:gap-y-16 xl:gap-x-12">
              {processSteps.map((step) => (
                <div
                  key={step.number}
                  className="rounded-[1.75rem] border border-[#734624]/24 bg-[linear-gradient(180deg,rgba(27,17,12,0.14)_0%,rgba(12,8,6,0.05)_100%)] px-7 py-8 shadow-[0_14px_30px_rgba(0,0,0,0.08)] backdrop-blur-[10px]"
                >
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#ffbf76]">{step.number}</p>
                  <h3 className="mt-4 text-[1.7rem] font-black leading-tight text-[#fff0da]">{step.title}</h3>
                  <p className="mt-5 text-base leading-8 text-[#dbc4aa]">{step.text}</p>
                </div>
              ))}
            </div>
          </section>

          <div aria-hidden="true" className="h-20 lg:h-32 xl:h-40" />

          <section className="mx-auto max-w-7xl py-[3.5rem] lg:py-[7rem]">
            <div className="grid gap-16 lg:grid-cols-[1.03fr_0.97fr] lg:gap-20 xl:gap-24">
              <div className="rounded-[2rem] border border-[#734624]/28 bg-[linear-gradient(180deg,rgba(37,23,14,0.18)_0%,rgba(15,10,8,0.05)_100%)] p-9 shadow-[0_14px_34px_rgba(0,0,0,0.08)] backdrop-blur-[10px] sm:p-10 lg:p-12">
                <div className="flex items-center gap-3 text-[#ffc97a]">
                  <ShieldCheck className="h-5 w-5 text-[#ff9d3c]" />
                  <p className="text-sm font-semibold uppercase tracking-[0.24em]">Warum das funktioniert</p>
                </div>
                <h2 className="mt-5 text-4xl font-black leading-tight text-[#fff0da] sm:text-[2.8rem]">
                  Handwerk wird nicht erklärt. Es wird erlebt.
                </h2>
                <p className="mt-6 text-lg leading-8 text-[#ead9c3] sm:text-[1.08rem] sm:leading-9">
                  Genau darin liegt das Prinzip dieser Startseite: Sie stellt nicht zuerst Details aus, sondern das Ergebnis. Wer hier landet, versteht direkt, worum es geht, warum das Projekt relevant ist und wie man konkret Teil davon wird.
                </p>
                <div className="mt-[4.5rem] grid gap-8 sm:grid-cols-2 lg:gap-10">
                  <div className="rounded-[1.6rem] bg-black/8 px-7 py-7 ring-1 ring-white/8 backdrop-blur-[6px]">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#caa985]">Für Betriebe</p>
                    <p className="mt-2 text-base leading-7 text-[#f0e1cf]">Mehr Sichtbarkeit, stärkere Differenzierung und neue Gesprächsanlässe.</p>
                  </div>
                  <div className="rounded-[1.6rem] bg-black/8 px-7 py-7 ring-1 ring-white/8 backdrop-blur-[6px]">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#caa985]">Für Nachwuchs</p>
                    <p className="mt-2 text-base leading-7 text-[#f0e1cf]">Ein direkter, ungezwungener Zugang zu Berufen, Menschen und echtem Können.</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] border border-[#704321]/26 bg-[linear-gradient(180deg,rgba(24,16,11,0.16)_0%,rgba(12,8,6,0.05)_100%)] p-9 shadow-[0_14px_34px_rgba(0,0,0,0.08)] backdrop-blur-[10px] sm:p-10 lg:p-12">
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#ffbf76]">Aktuelle Information</p>
                <h3 className="mt-4 text-3xl font-black text-[#ffd08f] sm:text-[2.3rem]">Wacken 2027 steht im Fokus.</h3>
                <div className="mt-6 space-y-5 text-base leading-8 text-[#ead9c3]">
                  <p>Headbang Handwerk plant den nächsten großen Schritt: einen eigenen Stand auf dem Wacken Open Air 2027.</p>
                  <p>Mit Live-Demos, Mitmach-Aktionen und starken Partnern entsteht ein Format, das Handwerk nicht kleiner erklärt, sondern größer inszeniert.</p>
                  <p>Gesucht werden Unternehmen, Unterstützer und Branchenpartner, die früh Teil dieses Projekts werden wollen.</p>
                </div>
                <div className="mt-[4.5rem] flex flex-col gap-5 sm:flex-row sm:gap-6">
                  <Button href="/sponsoren" size="lg" className="justify-center">
                    Sponsoring ansehen
                  </Button>
                  <Button href="/kontakt" size="lg" variant="secondary" className="justify-center">
                    Kontakt aufnehmen
                  </Button>
                </div>
              </div>
            </div>
          </section>

          <div aria-hidden="true" className="h-20 lg:h-32 xl:h-40" />

          <section className="mx-auto max-w-7xl py-[3.5rem] lg:py-[7rem]">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#ffbf76]">Nächste Anlässe</p>
                <h2 className="mt-4 text-4xl font-black text-[#fff0da] sm:text-[3rem]">Veranstaltungen mit echter Bühne für das Handwerk.</h2>
              </div>
              <Button href="/veranstaltungen" variant="secondary" size="lg">
                Alle Termine ansehen
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-24 grid gap-10 lg:grid-cols-3 lg:gap-y-16 xl:gap-x-12">
              {featuredEvents.map((event) => (
                <div
                  key={event.id}
                  className="rounded-[1.7rem] border border-[#6e4325]/24 bg-[linear-gradient(180deg,rgba(26,17,12,0.16)_0%,rgba(13,9,7,0.05)_100%)] p-6 shadow-[0_14px_30px_rgba(0,0,0,0.08)] backdrop-blur-[10px]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="inline-flex rounded-full border border-[#84502c]/50 bg-[#1b120d]/28 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[#ffbf76] backdrop-blur-[6px]">
                      {statusLabels[event.status]}
                    </span>
                    <Calendar className="h-4 w-4 flex-shrink-0 text-[#ff9d3c]" />
                  </div>
                  <h3 className="mt-5 text-2xl font-black text-[#fff0da]">{event.festivalName}</h3>
                  <div className="mt-5 space-y-3 text-sm text-[#dbc4aa]">
                    <div className="flex items-center gap-2 leading-6">
                      <Calendar className="h-4 w-4 flex-shrink-0 text-[#ff9d3c]" />
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center gap-2 leading-6">
                      <MapPin className="h-4 w-4 flex-shrink-0 text-[#ff9d3c]" />
                      <span>{event.location}</span>
                    </div>
                  </div>
                  <p className="mt-5 text-sm leading-7 text-[#e8d8c3]">{event.description}</p>
                  <div className="mt-6">
                    <Button href={event.ctaUrl || '/kontakt'} size="sm" variant="secondary" className="w-full justify-center">
                      {event.ctaText}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div aria-hidden="true" className="h-20 lg:h-32 xl:h-40" />

          <section className="mx-auto max-w-7xl py-[3.5rem] lg:py-[7rem]">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#ffbf76]">Einstieg für Partner</p>
                <h2 className="mt-4 text-4xl font-black text-[#fff0da] sm:text-[3rem]">Sponsoring-Pakete mit klarer Staffelung.</h2>
              </div>
              <Button href="/sponsoren" variant="ghost" size="lg">
                Alle Pakete im Detail
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-24 grid gap-10 lg:grid-cols-3 lg:gap-y-16 xl:gap-x-12">
              {featuredPackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`rounded-[1.8rem] border p-6 shadow-[0_14px_30px_rgba(0,0,0,0.08)] backdrop-blur-[10px] ${
                    pkg.highlighted
                      ? 'border-[#d07a34]/45 bg-[linear-gradient(180deg,rgba(86,40,11,0.2)_0%,rgba(19,13,9,0.08)_100%)]'
                      : 'border-[#6e4325]/24 bg-[linear-gradient(180deg,rgba(26,17,12,0.16)_0%,rgba(13,9,7,0.05)_100%)]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-2xl font-black text-[#fff0da]">{pkg.name}</p>
                      <p className="mt-2 text-3xl font-black text-[#ffbe6f]">{formatPrice(pkg.price)}</p>
                    </div>
                    {pkg.highlighted ? (
                      <span className="inline-flex rounded-full bg-[#ff9d3c]/78 px-3 py-1 text-[0.7rem] font-black uppercase tracking-[0.18em] text-black backdrop-blur-[6px]">
                        Empfohlen
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-3 text-sm uppercase tracking-[0.18em] text-[#caa985]">{pkg.visibility}</p>
                  <ul className="mt-6 space-y-3">
                    {pkg.features.slice(0, 4).map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm leading-6 text-[#ead9c3]">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#ffad56]" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6">
                    <Button href="/sponsoren" variant={pkg.highlighted ? 'primary' : 'secondary'} size="sm" className="w-full justify-center">
                      Paket ansehen
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div aria-hidden="true" className="h-20 lg:h-32 xl:h-44" />

          <section className="mx-auto max-w-7xl py-[4rem] lg:py-[8rem]">
            <div className="border-t border-[#9b5a2c]/70 px-2 pt-20 sm:px-4 sm:pt-20 lg:px-0 lg:pt-28">
              <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-16">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#ffbf76]">Letzter Abschnitt, klare Handlung</p>
                  <h2 className="mt-5 max-w-4xl text-4xl font-black leading-tight text-[#fff2de] sm:text-[3rem]">
                    Wenn das Handwerk dorthin soll, wo echte Aufmerksamkeit entsteht, dann beginnt es genau hier.
                  </h2>
                  <p className="mt-6 max-w-4xl text-lg leading-8 text-[#eadbc7] sm:text-xl sm:leading-9">
                    Unterstütze Headbang Handwerk als Partner, Sponsor oder Unterstützer und positioniere deine Marke in einem Projekt, das Haltung, Erlebnis und Sichtbarkeit zusammenbringt.
                  </p>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row lg:flex-col xl:flex-row">
                  <Button href="/sponsoren" size="lg">
                    Jetzt unterstützen
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button href="/kontakt" size="lg" variant="secondary">
                    Ansprechpartner kontaktieren
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
