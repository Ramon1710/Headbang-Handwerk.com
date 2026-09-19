import { resolveEventDetailViewMode } from '@/lib/events';
import { formatEuroCents } from '@/lib/event-sponsoring/money';
import type {
  EventSponsoringConfig,
  EventSponsoringPackage,
} from '@/lib/event-sponsoring/types';
import type { Event } from '@/lib/types';

export type EventSponsoringPublicReason =
  | 'wrong-mode'
  | 'missing-config'
  | 'disabled-config'
  | 'missing-packages';

export interface EventSponsoringPublicPackageView {
  id: string;
  kind: EventSponsoringPackage['kind'];
  name: string;
  description: string;
  features: string[];
  priceLabel: string;
  logoSizeLabel?: string;
  actionLabel: string;
  actionHref?: string;
  actionEnabled: boolean;
}

export interface EventSponsoringPublicPageView {
  event: {
    id: string;
    title: string;
    festivalName: string;
    date: string;
    location: string;
  };
  isAdminPreview: boolean;
  previewReason?: EventSponsoringPublicReason;
  title: string;
  description: string;
  packages: EventSponsoringPublicPackageView[];
  processSteps: string[];
}

function getLogoSizeLabel(size: EventSponsoringPackage['logoSlotSize']) {
  if (size === 'small') {
    return 'Kleines Logo';
  }

  if (size === 'medium') {
    return 'Mittleres Logo';
  }

  return 'Großes Logo';
}

function sortPackages(packages: EventSponsoringPackage[]) {
  return [...packages].sort((left, right) => {
    if (left.sortOrder !== right.sortOrder) {
      return left.sortOrder - right.sortOrder;
    }

    const nameComparison = left.name.localeCompare(right.name, 'de');

    if (nameComparison !== 0) {
      return nameComparison;
    }

    return left.id.localeCompare(right.id, 'de');
  });
}

function getPublicPackagePriceLabel(pkg: EventSponsoringPackage, config: EventSponsoringConfig) {
  if (pkg.kind === 'anonymous_support' && pkg.priceCents <= 0) {
    return `ab ${formatEuroCents(config.anonymousMinimumAmountCents)}`;
  }

  if (pkg.priceCents <= 0) {
    return 'Preis auf Anfrage';
  }

  return formatEuroCents(pkg.priceCents);
}

export function resolveEventSponsoringPublicAccess(args: {
  event: Event;
  config: EventSponsoringConfig | null;
  packages: EventSponsoringPackage[];
  isAdmin: boolean;
}) {
  if (resolveEventDetailViewMode(args.event) !== 'sponsoring2d') {
    return { allowed: false as const, reason: 'wrong-mode' as const };
  }

  if (!args.config) {
    return args.isAdmin
      ? { allowed: true as const, isAdminPreview: true as const, reason: 'missing-config' as const }
      : { allowed: false as const, reason: 'missing-config' as const };
  }

  const activePackages = args.packages.filter((pkg) => pkg.active);

  if (activePackages.length === 0) {
    return args.isAdmin
      ? { allowed: true as const, isAdminPreview: true as const, reason: 'missing-packages' as const }
      : { allowed: false as const, reason: 'missing-packages' as const };
  }

  if (!args.config.enabled) {
    return args.isAdmin
      ? { allowed: true as const, isAdminPreview: true as const, reason: 'disabled-config' as const }
      : { allowed: false as const, reason: 'disabled-config' as const };
  }

  return { allowed: true as const, isAdminPreview: false as const };
}

export function buildEventSponsoringPublicPageView(args: {
  event: Event;
  config: EventSponsoringConfig;
  packages: EventSponsoringPackage[];
  isAdminPreview: boolean;
  previewReason?: EventSponsoringPublicReason;
}) {
  const activePackages = sortPackages(args.packages.filter((pkg) => pkg.active));

  return {
    event: {
      id: args.event.id,
      title: args.event.title,
      festivalName: args.event.festivalName,
      date: args.event.date,
      location: args.event.location,
    },
    isAdminPreview: args.isAdminPreview,
    ...(args.previewReason ? { previewReason: args.previewReason } : {}),
    title: args.config.publicTitle,
    description: args.config.publicDescription,
    packages: activePackages.map((pkg) => ({
      id: pkg.id,
      kind: pkg.kind,
      name: pkg.name,
      description: pkg.description,
      features: [...pkg.features],
      priceLabel: getPublicPackagePriceLabel(pkg, args.config),
      ...(pkg.logoSlotSize !== 'none' ? { logoSizeLabel: getLogoSizeLabel(pkg.logoSlotSize) } : {}),
      actionLabel: 'Paket auswählen',
      actionHref: `/veranstaltungen/${encodeURIComponent(args.event.id)}/sponsoring/anfrage?package=${encodeURIComponent(pkg.id)}`,
      actionEnabled: true,
    } satisfies EventSponsoringPublicPackageView)),
    processSteps: [
      'Paket auswählen und Anfrageformular ausfüllen',
      'Firmen- und Rechnungsdaten sowie optional das Logo hochladen',
      'Headbang Handwerk prüft die Anfrage und meldet sich per E-Mail',
      'Die Abrechnung erfolgt nach Bearbeitung manuell per Rechnung',
    ],
  } satisfies EventSponsoringPublicPageView;
}

export function getEventSponsoringPreviewMessage(reason?: EventSponsoringPublicReason) {
  if (reason === 'disabled-config') {
    return 'Admin-Vorschau – Diese Sponsoringseite ist noch nicht öffentlich aktiviert.';
  }

  if (reason === 'missing-config') {
    return 'Admin-Vorschau – Für diese Veranstaltung fehlt noch die Sponsoring-Konfiguration.';
  }

  if (reason === 'missing-packages') {
    return 'Admin-Vorschau – Es sind noch keine aktiven Sponsoring-Pakete vorhanden.';
  }

  return 'Admin-Vorschau – Diese Sponsoringseite ist noch nicht vollständig öffentlich freigeschaltet.';
}