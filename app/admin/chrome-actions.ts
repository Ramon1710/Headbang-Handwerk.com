'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/cms/auth';
import { getCmsContent, saveCmsContent } from '@/lib/cms/storage';
import {
  NAVIGATION_ITEM_IDS,
  getDefaultNavigationLinks,
  normalizeFooterContactLinks,
  normalizeFooterInformationLinks,
  normalizeNavigationLabel,
  normalizeNavigationLinks,
  normalizeNavigationPlacement,
  normalizeSafeSocialUrl,
  normalizeSafeText,
  normalizeInternalHref,
} from '@/lib/site';
import type { FooterLink, NavigationLink } from '@/lib/cms/schema';

function sanitizeText(value: FormDataEntryValue | null) {
  return String(value || '').trim();
}

async function getReturnPath() {
  const headerStore = await headers();
  const referer = headerStore.get('referer');

  if (!referer) {
    return '/';
  }

  try {
    const url = new URL(referer);
    return `${url.pathname}${url.search}` || '/';
  } catch {
    return '/';
  }
}

function withStatus(basePath: string, status: { chromeSaved?: string; chromeError?: string }) {
  const [pathname, search = ''] = basePath.split('?');
  const params = new URLSearchParams(search);

  params.delete('chromeSaved');
  params.delete('chromeError');

  if (status.chromeSaved) {
    params.set('chromeSaved', status.chromeSaved);
  }

  if (status.chromeError) {
    params.set('chromeError', status.chromeError);
  }

  const nextSearch = params.toString();
  return nextSearch ? `${pathname}?${nextSearch}` : pathname;
}

async function assertAdmin() {
  if (!(await isAdminAuthenticated())) {
    redirect('/admin-login');
  }
}

function parseNavigationLinks(formData: FormData) {
  const defaultLinks = new Map(getDefaultNavigationLinks().map((link) => [link.id, link]));

  const links: NavigationLink[] = NAVIGATION_ITEM_IDS.map((id) => ({
    id,
    label: normalizeNavigationLabel(id, sanitizeText(formData.get(`navLabel:${id}`))),
    href: normalizeInternalHref(sanitizeText(formData.get(`navHref:${id}`)), defaultLinks.get(id)?.href || '/'),
    placement: normalizeNavigationPlacement(sanitizeText(formData.get(`navPlacement:${id}`))),
  }));

  return normalizeNavigationLinks(links);
}

function parseFooterLinks(
  formData: FormData,
  prefix: 'footerInformation' | 'footerContact',
  count: number,
  fallbackLinks: FooterLink[],
  normalizer: (links: FooterLink[]) => FooterLink[]
) {
  const links: FooterLink[] = [];

  for (let index = 0; index < count; index += 1) {
    links.push({
      id: sanitizeText(formData.get(`${prefix}Id:${index}`)) || undefined,
      label: sanitizeText(formData.get(`${prefix}Label:${index}`)),
      href: sanitizeText(formData.get(`${prefix}Href:${index}`)),
    });
  }

  const normalized = normalizer(links);
  return normalized.length ? normalized : fallbackLinks;
}

function isSafeEmailAddress(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function persistChrome(nextNavigationLinks: NavigationLink[] | null, nextFooter: Awaited<ReturnType<typeof getCmsContent>>['site']['footer'] | null) {
  const current = await getCmsContent();

  await saveCmsContent({
    ...current,
    site: {
      ...current.site,
      ...(nextNavigationLinks ? { navigationLinks: nextNavigationLinks } : {}),
      ...(nextFooter ? { footer: nextFooter } : {}),
    },
  });

  revalidatePath('/', 'layout');
  revalidatePath('/');
  revalidatePath('/veranstaltungen');
  revalidatePath('/ueber-uns');
  revalidatePath('/unsere-partner');
  revalidatePath('/merchandise');
  revalidatePath('/sponsoren');
  revalidatePath('/spenden');
  revalidatePath('/kontakt');
  revalidatePath('/formular');
  revalidatePath('/gallerie');
  revalidatePath('/game');
  revalidatePath('/impressum');
  revalidatePath('/datenschutz');
  revalidatePath('/agb');
  revalidatePath('/merchandise/checkout');
  revalidatePath('/merchandise/danke');
  revalidatePath('/sponsoren/checkout');
  revalidatePath('/sponsoren/danke');
}

export async function updateNavigationAction(formData: FormData) {
  await assertAdmin();

  try {
    const nextNavigationLinks = parseNavigationLinks(formData);
    await persistChrome(nextNavigationLinks, null);
  } catch {
    const returnPath = await getReturnPath();
    redirect(withStatus(returnPath, { chromeError: 'Die Navigation konnte nicht gespeichert werden.' }));
  }

  const returnPath = await getReturnPath();
  redirect(withStatus(returnPath, { chromeSaved: 'navigation' }));
}

export async function updateFooterAction(formData: FormData) {
  await assertAdmin();

  const current = await getCmsContent();
  const footerDescription = normalizeSafeText(sanitizeText(formData.get('footerDescription')));
  const facebookUrl = normalizeSafeSocialUrl(sanitizeText(formData.get('footerFacebookUrl')));
  const instagramUrl = normalizeSafeSocialUrl(sanitizeText(formData.get('footerInstagramUrl')));
  const tiktokUrl = normalizeSafeSocialUrl(sanitizeText(formData.get('footerTiktokUrl')));
  const footerContactEmail = sanitizeText(formData.get('footerContactEmail'));

  if (footerContactEmail && !isSafeEmailAddress(footerContactEmail)) {
    const returnPath = await getReturnPath();
    redirect(withStatus(returnPath, { chromeError: 'Die Footer-E-Mail-Adresse ist ungueltig.' }));
  }

  const informationLinks = parseFooterLinks(
    formData,
    'footerInformation',
    4,
    current.site.footer.informationLinks || [],
    normalizeFooterInformationLinks
  );
  const contactLinks = parseFooterLinks(
    formData,
    'footerContact',
    2,
    current.site.footer.contactLinks || [],
    normalizeFooterContactLinks
  );

  const nextFooter = {
    ...current.site.footer,
    description: footerDescription || current.site.footer.description,
    informationHeading: normalizeSafeText(sanitizeText(formData.get('footerInformationHeading'))) || current.site.footer.informationHeading,
    informationLinks,
    contactHeading: normalizeSafeText(sanitizeText(formData.get('footerContactHeading'))) || current.site.footer.contactHeading,
    contactLinks,
    contactEmail: footerContactEmail || '',
    socialLinks: current.site.footer.socialLinks.map((link) => {
      if (link.platform === 'facebook') {
        return { ...link, href: facebookUrl };
      }

      if (link.platform === 'instagram') {
        return { ...link, href: instagramUrl };
      }

      if (link.platform === 'tiktok') {
        return { ...link, href: tiktokUrl };
      }

      return link;
    }),
  };

  try {
    await persistChrome(null, nextFooter);
  } catch {
    const returnPath = await getReturnPath();
    redirect(withStatus(returnPath, { chromeError: 'Der Footer konnte nicht gespeichert werden.' }));
  }

  const returnPath = await getReturnPath();
  redirect(withStatus(returnPath, { chromeSaved: 'footer' }));
}