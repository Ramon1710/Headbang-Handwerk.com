import { logoutAction } from '@/app/admin/actions';
import { isAdminAuthenticated } from '@/lib/cms/auth';
import type { NavigationLink } from '@/lib/cms/schema';
import { Navigation } from './navigation';

interface SiteNavigationProps {
  links: NavigationLink[];
  ctaLabel: string;
  ctaHref: string;
}

export async function SiteNavigation({ links, ctaLabel, ctaHref }: SiteNavigationProps) {
  const showLogout = await isAdminAuthenticated();

  return (
    <Navigation
      links={links}
      ctaLabel={ctaLabel}
      ctaHref={ctaHref}
      showLogout={showLogout}
      logoutAction={logoutAction}
    />
  );
}