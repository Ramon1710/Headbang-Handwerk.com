import type { NavigationLink } from '@/lib/cms/schema';

const REMOVED_NAV_HREFS = new Set(['/drei-d-stand']);
const MERCHANDISE_LINK: NavigationLink = { label: 'Merchandise', href: '/merchandise' };
const CANONICAL_NAV_ORDER = ['/', '/veranstaltungen', '/sponsoren', '/merchandise', '/ueber-uns', '/kontakt'];

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