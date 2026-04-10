import { logoutAction } from '@/app/admin/actions';
import { isAdminAuthenticated } from '@/lib/cms/auth';
import type { NavigationLink } from '@/lib/cms/schema';
import { getCmsContent } from '@/lib/cms/storage';
import { Navigation } from './navigation';

interface SiteNavigationProps {
  links: NavigationLink[];
  ctaLabel: string;
  ctaHref: string;
}

export async function SiteNavigation({ links, ctaLabel, ctaHref }: SiteNavigationProps) {
  const isAdmin = await isAdminAuthenticated();
  const cms = await getCmsContent();

  return (
    <Navigation
      links={links}
      ctaLabel={ctaLabel}
      ctaHref={ctaHref}
      logoSrc={cms.site.logo.assetUrl}
      showViewToggle={isAdmin}
      showLogout={isAdmin}
      logoutAction={logoutAction}
    />
  );
}