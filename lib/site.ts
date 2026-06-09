import type { NavigationLink } from '@/lib/cms/schema';

const REMOVED_NAV_HREFS = new Set(['/drei-d-stand']);
const MERCHANDISE_LINK: NavigationLink = { label: 'Merchandise', href: '/merchandise' };
const FORM_LINK: NavigationLink = { label: 'Formular', href: '/formular' };
const PARTNER_INFO_LINK: NavigationLink = { label: 'Partner & Unterstützer', href: '/partner-unterstuetzerinfo' };
const CANONICAL_NAV_ORDER = ['/', '/formular', '/partner-unterstuetzerinfo', '/veranstaltungen', '/sponsoren', '/merchandise', '/ueber-uns', '/kontakt'];

function normalizeHref(href: string) {
  if (!href || href === '/') {
    return '/';
  }

  return href.endsWith('/') ? href.slice(0, -1) : href;
}

export function getEventStandHref(eventId: string) {
  return `/veranstaltungen/${encodeURIComponent(eventId)}/3d-stand`;
}

export function normalizeNavigationLinks(links: NavigationLink[]) {
  const filteredLinks: NavigationLink[] = [];
  const seenHrefs = new Set<string>();

  for (const link of links) {
    const normalizedHref = normalizeHref(link.href);

    if (!normalizedHref || REMOVED_NAV_HREFS.has(normalizedHref) || seenHrefs.has(normalizedHref)) {
      continue;
    }

    seenHrefs.add(normalizedHref);
    filteredLinks.push({ ...link, href: normalizedHref });
  }

  if (!seenHrefs.has(MERCHANDISE_LINK.href)) {
    const sponsorsIndex = filteredLinks.findIndex((link) => link.href === '/sponsoren');

    if (sponsorsIndex >= 0) {
      filteredLinks.splice(sponsorsIndex + 1, 0, MERCHANDISE_LINK);
    } else {
      filteredLinks.push(MERCHANDISE_LINK);
    }
  }

  if (!seenHrefs.has(FORM_LINK.href)) {
    filteredLinks.splice(1, 0, FORM_LINK);
    seenHrefs.add(FORM_LINK.href);
  }

  if (!seenHrefs.has(PARTNER_INFO_LINK.href)) {
    const formIndex = filteredLinks.findIndex((link) => link.href === FORM_LINK.href);
    filteredLinks.splice(formIndex >= 0 ? formIndex + 1 : 1, 0, PARTNER_INFO_LINK);
    seenHrefs.add(PARTNER_INFO_LINK.href);
  }

  const orderedLinks: NavigationLink[] = [];

  for (const href of CANONICAL_NAV_ORDER) {
    const link = filteredLinks.find((entry) => entry.href === href);

    if (link) {
      orderedLinks.push(link);
    }
  }

  for (const link of filteredLinks) {
    if (!orderedLinks.some((entry) => entry.href === link.href)) {
      orderedLinks.push(link);
    }
  }

  return orderedLinks;
}