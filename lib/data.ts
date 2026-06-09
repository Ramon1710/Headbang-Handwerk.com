import { createDefaultEventStandConfig, getDefaultBannerSlots } from './event-stand';
import { Event, SponsorPackage, BannerSlot } from './types';

export const events: Event[] = [
  {
    id: 'wacken-2025',
    title: 'Wacken Open Air 2025',
    date: '30. Juli – 2. August 2025',
    location: 'Wacken, Schleswig-Holstein',
    festivalName: 'Wacken Open Air',
    description:
      'Das größte Metal-Festival der Welt! Headbang Handwerk präsentiert das Handwerk auf der Weltbühne des Heavy Metal – mit Live-Demos, Nachwuchsförderung und exklusivem Sponsoring.',
    status: 'confirmed',
    ctaText: 'Jetzt Sponsor werden',
    ctaUrl: '/sponsoren',
    stand: createDefaultEventStandConfig(),
  },
  {
    id: 'summer-breeze-2025',
    title: 'Summer Breeze Open Air 2025',
    date: '13.–16. August 2025',
    location: 'Dinkelsbühl, Bayern',
    festivalName: 'Summer Breeze Open Air',
    description:
      'Eines der beliebtesten Metal-Festivals Deutschlands. Hier verbinden wir Handwerk und Heavy Metal vor über 40.000 Besuchern.',
    status: 'confirmed',
    ctaText: 'Bannerfläche buchen',
    ctaUrl: '/drei-d-stand',
    stand: createDefaultEventStandConfig(),
  },
  {
    id: 'rock-am-ring-2025',
    title: 'Rock am Ring 2025',
    date: '6.–8. Juni 2025',
    location: 'Nürburgring, Rheinland-Pfalz',
    festivalName: 'Rock am Ring',
    description:
      'Deutschlands legendärstes Rock-Festival. Headbang Handwerk bringt Ihre Marke vor 90.000 begeisterte Festivalbesucher.',
    status: 'planned',
    ctaText: 'Mehr erfahren',
    ctaUrl: '/sponsoren',
    stand: createDefaultEventStandConfig(),
  },
  {
    id: 'with-full-force-2025',
    title: 'With Full Force 2025',
    date: '4.–6. Juli 2025',
    location: 'Ferropolis, Sachsen-Anhalt',
    festivalName: 'With Full Force',
    description:
      'Das Festival der Extreme in der Stadt aus Eisen – perfekte Kulisse für Handwerk trifft Metal.',
    status: 'planned',
    ctaText: 'Jetzt anfragen',
    ctaUrl: '/kontakt',
    stand: createDefaultEventStandConfig(),
  },
  {
    id: 'metaldays-2025',
    title: 'Metaldays 2025',
    date: '21.–26. Juli 2025',
    location: 'Tolmin, Slowenien',
    festivalName: 'Metaldays',
    description:
      'Internationales Metal-Festival am malerischen Soča-Fluss. Headbang Handwerk geht auf Europatournee!',
    status: 'planned',
    ctaText: 'Infos anfragen',
    ctaUrl: '/kontakt',
    stand: createDefaultEventStandConfig(),
  },
];

export const sponsorPackages: SponsorPackage[] = [
  {
    id: 'bronze',
    name: 'Bronze',
    price: 500,
    features: [
      'Logo auf Website (klein)',
      'Erwähnung in Social Media (1x)',
      'Logo auf Veranstaltungsbanner',
      'Zertifikat der Partnerschaft',
    ],
    visibility: 'Grundsichtbarkeit',
    logoSize: 'Klein',
    placement: 'Footer-Bereich',
    highlighted: false,
  },
  {
    id: 'silber',
    name: 'Silber',
    price: 1500,
    features: [
      'Logo auf Website (mittel)',
      'Erwähnung in Social Media (4x)',
      'Logo auf allen Bannern',
      'Eigener Bereich im Stand',
      'Verlinkung auf Unternehmens-Website',
      'Namensnennung bei Moderationen',
      'Spendenquittung möglich',
    ],
    visibility: 'Mittlere Sichtbarkeit',
    logoSize: 'Mittel',
    placement: 'Sponsor-Bereich prominent',
    highlighted: true,
  },
  {
    id: 'gold',
    name: 'Gold',
    price: 3000,
    features: [
      'Logo auf Website (groß)',
      'Wöchentliche Social Media Beiträge',
      'Großes Logo auf Hauptbanner',
      'Premium-Standplatz',
      'Exklusives Produktplacement',
      'Pressemitteilungen',
      'Spendenquittung',
      'Jahresbericht',
    ],
    visibility: 'Hohe Sichtbarkeit',
    logoSize: 'Groß',
    placement: 'Premium-Hauptfläche',
    highlighted: false,
  },
  {
    id: 'exklusivpartner',
    name: 'Exklusivpartner',
    price: 7500,
    features: [
      'Logo auf Website (XXL, prominent)',
      'Tägliche Social Media Präsenz',
      'Namensgebung am Stand möglich',
      'Exklusive Hauptsponsorship',
      'Eigener Messestand-Bereich',
      'VIP-Einladungen (4x)',
      'Co-Branding auf Kampagnenmaterial',
      'Pressekonferenzen',
      'Spendenquittung',
      'Persönlicher Ansprechpartner',
    ],
    visibility: 'Maximale Sichtbarkeit',
    logoSize: 'XXL',
    placement: 'Exklusivfläche – Alleinstellung',
    highlighted: false,
  },
];

export const bannerSlots: BannerSlot[] = getDefaultBannerSlots();


