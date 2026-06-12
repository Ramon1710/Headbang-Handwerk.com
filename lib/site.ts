import type { NavigationLink } from '@/lib/cms/schema';

const REMOVED_NAV_HREFS = new Set(['/drei-d-stand', '/partner-unterstuetzerinfo']);
const MEMBERSHIP_LINK: NavigationLink = { label: 'Mitglied werden', href: '/formular' };
const SPONSOR_LINK: NavigationLink = { label: 'Sponsor werden', href: '/sponsoren' };
const DONATION_LINK: NavigationLink = { label: 'Spenden', href: '/spenden' };
const MERCHANDISE_LINK: NavigationLink = { label: 'Merchandise', href: '/merchandise' };
const CANONICAL_NAV_ORDER = ['/', '/veranstaltungen', '/formular', '/sponsoren', '/spenden', '/merchandise', '/ueber-uns', '/kontakt'];

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
    if (normalizedHref === SPONSOR_LINK.href) {
      filteredLinks.push({ ...link, href: normalizedHref, label: SPONSOR_LINK.label });
      continue;
    }

    if (normalizedHref === MEMBERSHIP_LINK.href) {
      filteredLinks.push({ ...link, href: normalizedHref, label: MEMBERSHIP_LINK.label });
      continue;
    }

    filteredLinks.push({ ...link, href: normalizedHref });
  }

  if (!seenHrefs.has(MEMBERSHIP_LINK.href)) {
    const eventsIndex = filteredLinks.findIndex((link) => link.href === '/veranstaltungen');

    if (eventsIndex >= 0) {
      filteredLinks.splice(eventsIndex + 1, 0, MEMBERSHIP_LINK);
    } else {
      filteredLinks.unshift(MEMBERSHIP_LINK);
    }
  }

  if (!seenHrefs.has(SPONSOR_LINK.href)) {
    const membershipIndex = filteredLinks.findIndex((link) => link.href === MEMBERSHIP_LINK.href);

    if (membershipIndex >= 0) {
      filteredLinks.splice(membershipIndex + 1, 0, SPONSOR_LINK);
    } else {
      filteredLinks.push(SPONSOR_LINK);
    }
  }

  if (!seenHrefs.has(DONATION_LINK.href)) {
    const sponsorIndex = filteredLinks.findIndex((link) => link.href === SPONSOR_LINK.href);

    if (sponsorIndex >= 0) {
      filteredLinks.splice(sponsorIndex + 1, 0, DONATION_LINK);
    } else {
      filteredLinks.push(DONATION_LINK);
    }
  }

  if (!seenHrefs.has(MERCHANDISE_LINK.href)) {
    const sponsorsIndex = filteredLinks.findIndex((link) => link.href === DONATION_LINK.href);

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