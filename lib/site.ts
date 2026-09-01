import type { FooterLink, NavigationLink } from '@/lib/cms/schema';

const REMOVED_NAV_HREFS = new Set(['/drei-d-stand', '/partner-unterstuetzerinfo', '/hühnerjagt']);
export type NavigationItemId = 'home' | 'about' | 'events' | 'membership' | 'partners' | 'shop' | 'sponsor' | 'donation' | 'game';
export type NavigationPlacement = 'primary' | 'more';

interface NavigationItemDefinition {
  id: NavigationItemId;
  defaultLabel: string;
  defaultHref: string;
  defaultPlacement: NavigationPlacement;
}

const NAVIGATION_ITEMS: NavigationItemDefinition[] = [
  { id: 'home', defaultLabel: 'Startseite', defaultHref: '/', defaultPlacement: 'primary' },
  { id: 'about', defaultLabel: 'Über uns', defaultHref: '/ueber-uns', defaultPlacement: 'primary' },
  { id: 'events', defaultLabel: 'Veranstaltungen', defaultHref: '/veranstaltungen', defaultPlacement: 'primary' },
  { id: 'membership', defaultLabel: 'Mitglied werden', defaultHref: '/formular', defaultPlacement: 'primary' },
  { id: 'partners', defaultLabel: 'Partner', defaultHref: '/unsere-partner', defaultPlacement: 'primary' },
  { id: 'shop', defaultLabel: 'Shop', defaultHref: '/merchandise', defaultPlacement: 'primary' },
  { id: 'sponsor', defaultLabel: 'Sponsor werden', defaultHref: '/sponsoren', defaultPlacement: 'more' },
  { id: 'donation', defaultLabel: 'Spenden', defaultHref: '/spenden', defaultPlacement: 'more' },
  { id: 'game', defaultLabel: 'Spiele', defaultHref: '/game', defaultPlacement: 'more' },
];

const NAVIGATION_ITEM_BY_ID = new Map(NAVIGATION_ITEMS.map((item) => [item.id, item]));
const NAVIGATION_ITEM_BY_HREF = new Map(NAVIGATION_ITEMS.map((item) => [item.defaultHref, item]));
const FOOTER_INFORMATION_DEFAULT_LINKS: FooterLink[] = [
  { id: 'about', label: 'Über uns', href: '/ueber-uns' },
  { id: 'events', label: 'Veranstaltungen', href: '/veranstaltungen' },
  { id: 'membership', label: 'Mitglied werden', href: '/formular' },
  { id: 'partners', label: 'Partner', href: '/unsere-partner' },
];
const FOOTER_CONTACT_DEFAULT_LINKS: FooterLink[] = [{ id: 'contact', label: 'Kontaktseite', href: '/kontakt' }];

export const NAVIGATION_ITEM_IDS = NAVIGATION_ITEMS.map((item) => item.id);

function normalizeHref(href: string) {
  if (!href || href === '/') {
    return '/';
  }

  return href.endsWith('/') ? href.slice(0, -1) : href;
}

export function normalizeSafeText(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

export function normalizeInternalHref(href: string, fallback = '/') {
  const trimmed = href.trim();

  if (!trimmed) {
    return fallback;
  }

  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || /[\u0000-\u001f]/.test(trimmed)) {
    return fallback;
  }

  if (/^(javascript|data|vbscript):/i.test(trimmed)) {
    return fallback;
  }

  return normalizeHref(trimmed);
}

export function normalizeNavigationPlacement(value: unknown, fallback: NavigationPlacement = 'primary'): NavigationPlacement {
  return value === 'more' || value === 'primary' ? value : fallback;
}

function isNavigationItemId(value: string): value is NavigationItemId {
  return NAVIGATION_ITEM_BY_ID.has(value as NavigationItemId);
}

function resolveNavigationDefinition(link: NavigationLink) {
  if (link.id && isNavigationItemId(link.id)) {
    return NAVIGATION_ITEM_BY_ID.get(link.id) || null;
  }

  const href = normalizeHref(link.href);
  return NAVIGATION_ITEM_BY_HREF.get(href) || null;
}

export function normalizeNavigationLabel(id: NavigationItemId, value: string) {
  const definition = NAVIGATION_ITEM_BY_ID.get(id);

  if (!definition) {
    return normalizeSafeText(value);
  }

  return normalizeSafeText(value) || definition.defaultLabel;
}

export function getDefaultNavigationLinks(): NavigationLink[] {
  return NAVIGATION_ITEMS.map((item) => ({
    id: item.id,
    label: item.defaultLabel,
    href: item.defaultHref,
    placement: item.defaultPlacement,
  }));
}

export function getEventStandHref(eventId: string) {
  return `/veranstaltungen/${encodeURIComponent(eventId)}/3d-stand`;
}

export function normalizeExternalUrl(url: string) {
  const trimmed = url.trim();

  if (!trimmed) {
    return '';
  }

  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  if (/^(mailto:|tel:|https?:\/\/)/i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }

  if (/^[a-z0-9.-]+\.[a-z]{2,}(?:[/:?#].*)?$/i.test(trimmed)) {
    return `https://${trimmed}`;
  }

  return trimmed;
}

export function normalizeSafeSocialUrl(url: string) {
  const normalized = normalizeExternalUrl(url);

  if (!normalized || normalized === '#') {
    return '';
  }

  if (!/^(https?:\/\/|mailto:|tel:)/i.test(normalized)) {
    return '';
  }

  return normalized;
}

function looksLikeUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return false;
  }

  return /^(https?:\/\/|\/\/|www\.|[a-z0-9.-]+\.[a-z]{2,}(?:[/:?#].*)?)$/i.test(trimmed);
}

export function resolveEventCtaUrl(url?: string, fallbackText?: string) {
  const normalized = normalizeExternalUrl(url || '');

  if (normalized && normalized !== '/kontakt' && normalized !== '/info@headbang-handwerk.de') {
    return normalized;
  }

  if (looksLikeUrl(fallbackText || '')) {
    return normalizeExternalUrl(fallbackText || '');
  }

  return normalized || '/kontakt';
}

export function isExternalUrl(url: string) {
  return /^(mailto:|tel:|https?:\/\/)/i.test(url);
}

export function normalizeNavigationLinks(links: NavigationLink[]) {
  const linksById = new Map<NavigationItemId, NavigationLink>();

  for (const link of links) {
    const definition = resolveNavigationDefinition(link);

    if (!definition) {
      continue;
    }

    const href = normalizeInternalHref(link.href, definition.defaultHref);

    if (!href || REMOVED_NAV_HREFS.has(href)) {
      continue;
    }

    linksById.set(definition.id, {
      id: definition.id,
      href,
      label: link.id ? normalizeNavigationLabel(definition.id, link.label) : definition.defaultLabel,
      placement: normalizeNavigationPlacement(link.placement, definition.defaultPlacement),
    });
  }

  return NAVIGATION_ITEMS.map((item) =>
    linksById.get(item.id) || {
      id: item.id,
      label: item.defaultLabel,
      href: item.defaultHref,
      placement: item.defaultPlacement,
    }
  );
}

export function getNavigationSections(links: NavigationLink[]) {
  const normalizedLinks = normalizeNavigationLinks(links);

  return {
    primaryLinks: normalizedLinks.filter((link) => normalizeNavigationPlacement(link.placement, 'primary') === 'primary'),
    moreLinks: normalizedLinks.filter((link) => normalizeNavigationPlacement(link.placement, 'primary') === 'more'),
    orderedLinks: normalizedLinks,
  };
}

function normalizeFooterLinks(links: FooterLink[], defaults: FooterLink[]): FooterLink[] {
  const resolved: FooterLink[] = [];

  for (const [index, link] of links.entries()) {
    const fallback = defaults[index];
    const label = normalizeSafeText(link.label || fallback?.label || '');
    const href = normalizeInternalHref(link.href || fallback?.href || '', fallback?.href || '/kontakt');

    if (!label || !href) {
      continue;
    }

    resolved.push({
      id: link.id || fallback?.id,
      label,
      href,
    });
  }

  return resolved;
}

export function getDefaultFooterInformationLinks(): FooterLink[] {
  return FOOTER_INFORMATION_DEFAULT_LINKS.map((link) => ({ ...link }));
}

export function getDefaultFooterContactLinks(): FooterLink[] {
  return FOOTER_CONTACT_DEFAULT_LINKS.map((link) => ({ ...link }));
}

export function normalizeFooterInformationLinks(links: FooterLink[]): FooterLink[] {
  return normalizeFooterLinks(links, FOOTER_INFORMATION_DEFAULT_LINKS);
}

export function normalizeFooterContactLinks(links: FooterLink[]): FooterLink[] {
  return normalizeFooterLinks(links, FOOTER_CONTACT_DEFAULT_LINKS);
}