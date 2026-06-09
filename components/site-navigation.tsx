import { logoutAction } from '@/app/admin/actions';
import { isAdminAuthenticated } from '@/lib/cms/auth';
import type { NavigationLink } from '@/lib/cms/schema';
import { getCmsContent } from '@/lib/cms/storage';
import { normalizeNavigationLinks } from '@/lib/site';
import { Navigation } from './navigation';

interface SiteNavigationProps {
  links: NavigationLink[];
  ctaLabel: string;
  ctaHref: string;
}

export async function SiteNavigation({ links, ctaLabel, ctaHref }: SiteNavigationProps) {
  const isAdmin = await isAdminAuthenticated();
  const cms = await getCmsContent();
  const normalizedLinks = normalizeNavigationLinks(links);

  return (
    <Navigation
      links={normalizedLinks}
      ctaLabel={ctaLabel}
      ctaHref={ctaHref}
      logoSrc={cms.site.logo.assetUrl}
      showViewToggle={isAdmin}
      showLogout={isAdmin}
      logoutAction={logoutAction}
    />
  );
}