import { Event, SponsorPackage, BannerSlot, MerchandiseProduct } from './types';

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
      'Co-Branding auf Merchandise',
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

export const bannerSlots: BannerSlot[] = [
  {
    id: 'front-main',
    name: 'Frontbanner Hauptfläche',
    position: 'Vorne / Mitte',
    size: '3 × 2 m',
    price: 800,
    visibilityLevel: 'Sehr hoch',
    available: 'available',
    description:
      'Die Premiumfläche direkt an der Frontseite des Standes – maximale Sichtbarkeit für alle Passanten. Ideal für Ihr Logo oder eine Markenbotschaft.',
  },
  {
    id: 'side-left',
    name: 'Seitenbanner Links',
    position: 'Seite / Links',
    size: '2 × 1,5 m',
    price: 400,
    visibilityLevel: 'Mittel',
    available: 'available',
    description:
      'Gut sichtbare Seitenfläche links des Standes. Perfekt für Firmenlogos oder Produktvorstellungen.',
  },
  {
    id: 'side-right',
    name: 'Seitenbanner Rechts',
    position: 'Seite / Rechts',
    size: '2 × 1,5 m',
    price: 400,
    visibilityLevel: 'Mittel',
    available: 'reserved',
    description:
      'Gut sichtbare Seitenfläche rechts des Standes. Bereits für Summer Breeze reserviert.',
  },
  {
    id: 'back-banner',
    name: 'Rückbanner',
    position: 'Rückseite',
    size: '4 × 1 m',
    price: 350,
    visibilityLevel: 'Niedrig',
    available: 'available',
    description:
      'Breites Banner an der Rückseite des Standes. Ideal für lange Markenbotschaften oder Slogans.',
  },
  {
    id: 'counter-banner',
    name: 'Thekenbanner',
    position: 'Theke / Augenhöhe',
    size: '1 × 0,5 m',
    price: 250,
    visibilityLevel: 'Sehr hoch (Augenhöhe)',
    available: 'available',
    description:
      'Kleines Banner direkt an der Standtheke – auf Augenhöhe der Besucher. Perfekt für direkte Ansprache.',
  },
  {
    id: 'ceiling-hanger',
    name: 'Dachhänger',
    position: 'Decke / Oben',
    size: '1 × 2 m',
    price: 600,
    visibilityLevel: 'Sehr hoch (Überkopf)',
    available: 'available',
    description:
      'Hängendes Banner über dem Stand – weithin sichtbar aus der Entfernung. Zieht Blicke auf sich.',
  },
];

export const merchandiseProducts: MerchandiseProduct[] = [
  {
    id: 'tshirt-hammer-headbang',
    name: 'T-Shirt "Hammer & Headbang"',
    price: 29.9,
    category: 'Kleidung',
    images: [],
    description:
      'Hochwertiges Baumwoll-T-Shirt mit dem ikonischen Hammer & Headbang Design. Zeig die Verbindung von Handwerk und Metal!',
    variants: {
      size: ['S', 'M', 'L', 'XL', 'XXL'],
      color: ['Schwarz', 'Anthrazit'],
    },
    inStock: true,
    badge: 'Bestseller',
  },
  {
    id: 'hoodie-headbang-handwerk',
    name: 'Hoodie "Headbang Handwerk"',
    price: 49.9,
    category: 'Kleidung',
    images: [],
    description:
      'Warmer Festival-Hoodie mit großem Backprint. Der perfekte Begleiter für Herbst-Festivals.',
    variants: {
      size: ['S', 'M', 'L', 'XL', 'XXL'],
      color: ['Schwarz', 'Dunkelgrau'],
    },
    inStock: true,
  },
  {
    id: 'cap-hh-skull',
    name: 'Cap "HH Skull"',
    price: 24.9,
    category: 'Accessoires',
    images: [],
    description:
      'Snapback Cap mit gesticktem HH-Skull Logo. One-size-fits-most Verschluss.',
    variants: {
      color: ['Schwarz', 'Camo'],
    },
    inStock: true,
  },
  {
    id: 'sticker-set',
    name: 'Aufkleber-Set (5 Stück)',
    price: 8.9,
    category: 'Accessoires',
    images: [],
    description:
      '5 hochwertige Vinyl-Aufkleber mit verschiedenen Headbang Handwerk Designs. Wetterfest und UV-beständig.',
    variants: {},
    inStock: true,
    badge: 'Neu',
  },
  {
    id: 'festival-banner',
    name: 'Festival-Banner',
    price: 39.9,
    category: 'Deko',
    images: [],
    description:
      'Hochwertiger Polyester-Banner für zu Hause oder die Werkstatt. 60 × 90 cm mit Ösen.',
    variants: {},
    inStock: true,
  },
  {
    id: 'patch-set',
    name: 'Patch-Set "Handwerk & Metal"',
    price: 14.9,
    category: 'Accessoires',
    images: [],
    description:
      'Set aus 3 bestickten Patches – perfekt für Jacken, Taschen oder Werkzeugkoffer.',
    variants: {},
    inStock: true,
    badge: 'Limitiert',
  },
];
