import type { BannerSlot, Event, EventStandConfig } from '@/lib/types';

const defaultBannerSlotTemplates: BannerSlot[] = [
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

export function cloneBannerSlot(slot: BannerSlot): BannerSlot {
  return { ...slot };
}

export function getDefaultBannerSlots() {
  return defaultBannerSlotTemplates.map(cloneBannerSlot);
}

export function createDefaultEventStandConfig(): EventStandConfig {
  return {
    assetUrl: '',
    assetName: '',
    assetContentType: '',
    lead: '',
    bannerSlots: getDefaultBannerSlots(),
  };
}

export function normalizeEventStandConfig(stand?: Partial<EventStandConfig>): EventStandConfig {
  return {
    ...createDefaultEventStandConfig(),
    ...stand,
    bannerSlots: Array.isArray(stand?.bannerSlots) && stand.bannerSlots.length ? stand.bannerSlots.map(cloneBannerSlot) : getDefaultBannerSlots(),
  };
}

export function normalizeEvent(event: Event): Event {
  return {
    ...event,
    standEnabled: event.standEnabled ?? event.status === 'confirmed',
    stand: normalizeEventStandConfig(event.stand),
  };
}

export function serializeBannerSlots(slots: BannerSlot[]) {
  return slots
    .map((slot) => [slot.name, slot.position, slot.size, String(slot.price), slot.visibilityLevel, slot.available, slot.description].join(' | '))
    .join('\n');
}

export function parseBannerSlots(value: string, fallback?: BannerSlot[]) {
  const rows = value
    .split('\n')
    .map((entry) => entry.trim())
    .filter(Boolean);

  const baseSlots = fallback && fallback.length ? fallback.map(cloneBannerSlot) : getDefaultBannerSlots();

  if (!rows.length) {
    return baseSlots;
  }

  return rows.map((row, index) => {
    const [name = '', position = '', size = '', priceText = '0', visibilityLevel = '', availability = 'available', ...descriptionParts] = row.split('|').map((part) => part.trim());
    const price = Number.parseFloat(priceText.replace(',', '.'));
    const baseSlot = baseSlots[index] || getDefaultBannerSlots()[index] || {
      id: `slot-${index + 1}`,
      name: `Banner-Slot ${index + 1}`,
      position: 'Position offen',
      size: 'Maß offen',
      price: 0,
      visibilityLevel: 'Offen',
      available: 'available' as const,
      description: 'Beschreibung folgt.',
    };

    return {
      ...baseSlot,
      name: name || baseSlot.name,
      position: position || baseSlot.position,
      size: size || baseSlot.size,
      price: Number.isFinite(price) ? price : baseSlot.price,
      visibilityLevel: visibilityLevel || baseSlot.visibilityLevel,
      available: availability === 'reserved' || availability === 'sold' ? availability : 'available',
      description: descriptionParts.join(' | ') || baseSlot.description,
    } satisfies BannerSlot;
  });
}
