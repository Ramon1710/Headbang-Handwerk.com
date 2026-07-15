'use client';

import { useEffect, useState } from 'react';
import type { ComponentProps } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import type { NavigationLink } from '@/lib/cms/schema';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import headbangLogo from '../Headbang Handwerk e.V. Logo Final PNG.png';

const PRIMARY_NAV_ORDER = ['/', '/formular', '/sponsoren', '/spenden'];
const DROPDOWN_NAV_ORDER = ['/veranstaltungen', '/gallerie', '/merchandise', '/ueber-uns', '/kontakt'];

const FALLBACK_NAV_LABELS: Record<string, string> = {
  '/': 'Startseite',
  '/formular': 'Mitglied werden',
  '/sponsoren': 'Sponsor werden',
  '/spenden': 'Spenden',
  '/veranstaltungen': 'Veranstaltungen',
  '/gallerie': 'Galerie',
  '/merchandise': 'Merchandise',
  '/ueber-uns': 'Über uns',
  '/kontakt': 'Kontakt',
};

interface NavigationProps {
  links: NavigationLink[];
  ctaLabel: string;
  ctaHref: string;
  logoSrc?: string;
  showAdminLink?: boolean;
  adminHref?: string;
  showViewToggle?: boolean;
  showLogout?: boolean;
  logoutAction?: ComponentProps<'form'>['action'];
}

export function Navigation({
  links,
  logoSrc,
  showAdminLink = false,
  adminHref = '/admin',
  showViewToggle = false,
  showLogout = false,
  logoutAction,
}: NavigationProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const resolvedLogoSrc = logoSrc || headbangLogo.src;

  const linksByHref = new Map(links.map((link) => [link.href, link]));
  const primaryLinks = PRIMARY_NAV_ORDER.map((href) => ({
    href,
    label: linksByHref.get(href)?.label || FALLBACK_NAV_LABELS[href],
  }));
  const dropdownLinks = DROPDOWN_NAV_ORDER.map((href) => ({
    href,
    label: linksByHref.get(href)?.label || FALLBACK_NAV_LABELS[href],
  }));

  const isUserView = searchParams.get('view') === 'user';
  const nextParams = new URLSearchParams(searchParamsString);

  if (isUserView) {
    nextParams.delete('view');
  } else {
    nextParams.set('view', 'user');
  }

  const viewToggleHref = nextParams.toString() ? `${pathname}?${nextParams.toString()}` : pathname;
  const viewToggleLabel = isUserView ? 'Adminansicht' : 'Nutzeransicht';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);

    window.addEventListener('scroll', handleScroll);

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname, searchParamsString]);

  const isLinkActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <header
      className={cn(
        'sticky top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-[color:var(--color-background)]/95 backdrop-blur-md border-b border-[color:var(--color-border)] shadow-[0_14px_45px_rgba(0,0,0,0.65)]'
          : 'bg-[color:var(--color-background)]/88 border-b border-[color:var(--color-border)]/80'
      )}
    >
      <div className="fire-divider" />
      <nav className="site-shell">
        <div className="flex min-h-24 items-center justify-between gap-3 py-3 sm:gap-4 xl:gap-6">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setMenuOpen((current) => !current)}
                className="link-copy inline-flex h-11 w-11 items-center justify-center rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)]/85 transition-colors hover:border-[color:var(--color-accent)]"
                aria-label={menuOpen ? 'Dropdown-Menü schließen' : 'Dropdown-Menü öffnen'}
                aria-expanded={menuOpen}
                aria-controls="site-dropdown-menu"
              >
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>

              {menuOpen ? (
                <div
                  id="site-dropdown-menu"
                  className="absolute left-0 top-[calc(100%+0.85rem)] z-[70] w-64 rounded-[1.1rem] border border-[color:var(--color-border)] bg-[linear-gradient(180deg,rgba(24,16,12,0.98)_0%,rgba(10,7,5,0.96)_100%)] p-3 shadow-[0_24px_60px_rgba(0,0,0,0.5)] backdrop-blur-md"
                >
                  <div className="flex flex-col gap-1">
                    {dropdownLinks.map((link) => (
                      <a
                        key={link.href}
                        href={link.href}
                        className={cn(
                          'rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
                          isLinkActive(link.href)
                            ? 'bg-[color:var(--color-accent)]/16 text-[color:var(--color-accent-soft)]'
                            : 'link-copy hover:bg-white/5'
                        )}
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <a href="/" className="flex min-w-0 items-center gap-3 group" aria-label="Headbang Handwerk">
              <img
                src={resolvedLogoSrc}
                alt="Headbang Handwerk Logo"
                className="h-auto max-h-[62px] w-28 object-contain drop-shadow-[0_8px_18px_rgba(0,0,0,0.65)] sm:max-h-[82px] sm:w-40 lg:max-h-[92px] lg:w-48"
              />
            </a>
          </div>

          <div className="flex min-w-0 flex-1 items-center justify-end gap-2 xl:gap-3">
            <div className="flex min-w-0 flex-1 items-center justify-end overflow-x-auto">
              <div className="flex min-w-max items-center gap-1 pl-2 sm:gap-2">
                {primaryLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'rounded-md px-2.5 py-2 text-[0.8rem] font-semibold whitespace-nowrap transition-colors sm:px-3 sm:text-[0.9rem] xl:px-3.5 xl:text-[0.97rem]',
                      isLinkActive(link.href)
                        ? 'bg-[color:var(--color-accent)]/12 text-[color:var(--color-accent-soft)]'
                        : 'link-copy'
                    )}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 xl:gap-3">
              {showAdminLink ? (
                <Button href={adminHref} size="sm" variant="secondary" className="hidden sm:inline-flex min-w-32">
                  Admin
                </Button>
              ) : null}
              {showViewToggle ? (
                <Button href={viewToggleHref} size="sm" variant="secondary" className="hidden sm:inline-flex min-w-36">
                  {viewToggleLabel}
                </Button>
              ) : null}
              {showLogout && logoutAction ? (
                <form action={logoutAction} className="hidden sm:block">
                  <Button type="submit" size="sm" variant="secondary" className="min-w-32">
                    Logout
                  </Button>
                </form>
              ) : null}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}