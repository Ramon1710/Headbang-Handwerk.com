'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { ComponentProps } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { ChevronDown, Menu, X } from 'lucide-react';
import type { NavigationLink } from '@/lib/cms/schema';
import { getNavigationSections, normalizeNavigationPlacement } from '@/lib/site';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import headbangLogo from '../Headbang Handwerk e.V. Logo Final PNG.png';

interface NavigationProps {
  links: NavigationLink[];
  ctaLabel: string;
  ctaHref: string;
  logoSrc?: string;
  showAdminLink?: boolean;
  adminHref?: string;
  showViewToggle?: boolean;
  showNavigationEditor?: boolean;
  showLogout?: boolean;
  logoutAction?: ComponentProps<'form'>['action'];
  saveNavigationAction?: ComponentProps<'form'>['action'];
}

export function Navigation({
  links,
  logoSrc,
  showAdminLink = false,
  adminHref = '/admin',
  showViewToggle = false,
  showNavigationEditor = false,
  showLogout = false,
  logoutAction,
  saveNavigationAction,
}: NavigationProps) {
  const [desktopMoreOpen, setDesktopMoreOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [showEditorPanel, setShowEditorPanel] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const resolvedLogoSrc = logoSrc || headbangLogo.src;
  const isUserView = searchParams.get('view') === 'user';
  const desktopMoreId = useId();
  const mobileMenuId = useId();
  const mobileMoreId = useId();
  const desktopMoreRef = useRef<HTMLDivElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);

  const { primaryLinks, moreLinks, orderedLinks } = useMemo(() => getNavigationSections(links), [links]);
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
    setDesktopMoreOpen(false);
    setMobileMenuOpen(false);
    setMobileMoreOpen(false);
  }, [pathname, searchParamsString]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;

      if (desktopMoreRef.current && !desktopMoreRef.current.contains(target)) {
        setDesktopMoreOpen(false);
      }

      if (mobileMenuRef.current && !mobileMenuRef.current.contains(target)) {
        setMobileMenuOpen(false);
        setMobileMoreOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setDesktopMoreOpen(false);
        setMobileMenuOpen(false);
        setMobileMoreOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const isLinkActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const isMoreActive = moreLinks.some((link) => isLinkActive(link.href));

  function handleNavigate() {
    setDesktopMoreOpen(false);
    setMobileMenuOpen(false);
    setMobileMoreOpen(false);
  }

  return (
    <header className="sticky top-0 left-0 right-0 z-50">
      <div
        className={cn(
          'transition-all duration-300',
          scrolled
            ? 'bg-[color:var(--color-background)]/95 backdrop-blur-md border-b border-[color:var(--color-border)] shadow-[0_14px_45px_rgba(0,0,0,0.65)]'
            : 'bg-[color:var(--color-background)]/88 border-b border-[color:var(--color-border)]/80'
        )}
      >
        <div className="fire-divider" />
        <nav className="site-shell" aria-label="Hauptnavigation">
          <div className="flex min-h-24 items-center justify-between gap-4 py-3 lg:gap-6">
            <a href="/" className="flex min-w-0 shrink-0 items-center gap-3 group" aria-label="Headbang Handwerk Startseite" onClick={handleNavigate}>
              <img
                src={resolvedLogoSrc}
                alt="Headbang Handwerk Logo"
                className="h-auto max-h-[62px] w-28 object-contain drop-shadow-[0_8px_18px_rgba(0,0,0,0.65)] sm:max-h-[82px] sm:w-40 lg:max-h-[92px] lg:w-48"
              />
            </a>

            <div className="hidden min-w-0 flex-1 items-center justify-end gap-3 lg:flex">
              <div className="flex min-w-0 items-center gap-2 xl:gap-3">
                {primaryLinks.map((link) => (
                  <a
                    key={link.id || link.href}
                    href={link.href}
                    onClick={handleNavigate}
                    className={cn(
                      'rounded-md px-3 py-2 text-[0.88rem] font-semibold whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)] focus:ring-offset-2 focus:ring-offset-[color:var(--color-background)] xl:px-4 xl:text-[0.97rem]',
                      isLinkActive(link.href)
                        ? 'bg-[color:var(--color-accent)]/12 text-[color:var(--color-accent-soft)]'
                        : 'link-copy hover:bg-white/5'
                    )}
                  >
                    {link.label}
                  </a>
                ))}
                <div className="relative" ref={desktopMoreRef}>
                  <button
                    type="button"
                    aria-expanded={desktopMoreOpen}
                    aria-controls={desktopMoreId}
                    onClick={() => setDesktopMoreOpen((current) => !current)}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-md px-3 py-2 text-[0.88rem] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)] focus:ring-offset-2 focus:ring-offset-[color:var(--color-background)] xl:px-4 xl:text-[0.97rem]',
                      isMoreActive
                        ? 'bg-[color:var(--color-accent)]/12 text-[color:var(--color-accent-soft)]'
                        : 'link-copy hover:bg-white/5'
                    )}
                  >
                    Mehr
                    <ChevronDown className={cn('h-4 w-4 transition-transform', desktopMoreOpen ? 'rotate-180' : '')} />
                  </button>
                  {desktopMoreOpen ? (
                    <div
                      id={desktopMoreId}
                      className="absolute right-0 top-[calc(100%+0.85rem)] z-[70] w-64 rounded-[1.1rem] border border-[color:var(--color-border)] bg-[linear-gradient(180deg,rgba(24,16,12,0.98)_0%,rgba(10,7,5,0.96)_100%)] p-3 shadow-[0_24px_60px_rgba(0,0,0,0.5)] backdrop-blur-md"
                    >
                      <div className="flex flex-col gap-1">
                        {moreLinks.map((link) => (
                          <a
                            key={link.id || link.href}
                            href={link.href}
                            onClick={handleNavigate}
                            className={cn(
                              'rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)] focus:ring-offset-2 focus:ring-offset-[#120b07]',
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
              </div>

              <div className="flex shrink-0 items-center gap-2 xl:gap-3">
                {showAdminLink ? (
                  <Button href={adminHref} size="sm" variant="secondary" className="hidden min-w-32 xl:inline-flex">
                    Admin
                  </Button>
                ) : null}
                {showViewToggle ? (
                  <Button href={viewToggleHref} size="sm" variant="secondary" className="hidden min-w-36 xl:inline-flex">
                    {viewToggleLabel}
                  </Button>
                ) : null}
                {showLogout && logoutAction ? (
                  <form action={logoutAction} className="hidden xl:block">
                    <Button type="submit" size="sm" variant="secondary" className="min-w-32">
                      Logout
                    </Button>
                  </form>
                ) : null}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 lg:hidden" ref={mobileMenuRef}>
              <button
                type="button"
                onClick={() => setMobileMenuOpen((current) => !current)}
                className="link-copy inline-flex h-12 w-12 items-center justify-center rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)]/85 transition-colors hover:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)] focus:ring-offset-2 focus:ring-offset-[color:var(--color-background)]"
                aria-label={mobileMenuOpen ? 'Menü schließen' : 'Menü öffnen'}
                aria-expanded={mobileMenuOpen}
                aria-controls={mobileMenuId}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>

              {mobileMenuOpen ? (
                <div
                  id={mobileMenuId}
                  className="absolute left-4 right-4 top-[calc(100%+0.85rem)] z-[70] rounded-[1.2rem] border border-[color:var(--color-border)] bg-[linear-gradient(180deg,rgba(24,16,12,0.98)_0%,rgba(10,7,5,0.96)_100%)] p-3 shadow-[0_24px_60px_rgba(0,0,0,0.5)] backdrop-blur-md"
                >
                  <div className="flex flex-col gap-1">
                    {primaryLinks.map((link) => (
                      <a
                        key={link.id || link.href}
                        href={link.href}
                        onClick={handleNavigate}
                        className={cn(
                          'rounded-xl px-4 py-3 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)] focus:ring-offset-2 focus:ring-offset-[#120b07]',
                          isLinkActive(link.href)
                            ? 'bg-[color:var(--color-accent)]/16 text-[color:var(--color-accent-soft)]'
                            : 'link-copy hover:bg-white/5'
                        )}
                      >
                        {link.label}
                      </a>
                    ))}
                    <div className="rounded-xl border border-white/10 bg-black/10">
                      <button
                        type="button"
                        onClick={() => setMobileMoreOpen((current) => !current)}
                        aria-expanded={mobileMoreOpen}
                        aria-controls={mobileMoreId}
                        className={cn(
                          'flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)] focus:ring-offset-2 focus:ring-offset-[#120b07]',
                          isMoreActive
                            ? 'text-[color:var(--color-accent-soft)]'
                            : 'link-copy'
                        )}
                      >
                        <span>Mehr</span>
                        <ChevronDown className={cn('h-4 w-4 transition-transform', mobileMoreOpen ? 'rotate-180' : '')} />
                      </button>
                      {mobileMoreOpen ? (
                        <div id={mobileMoreId} className="flex flex-col gap-1 px-2 pb-2">
                          {moreLinks.map((link) => (
                            <a
                              key={link.id || link.href}
                              href={link.href}
                              onClick={handleNavigate}
                              className={cn(
                                'rounded-xl px-4 py-3 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)] focus:ring-offset-2 focus:ring-offset-[#120b07]',
                                isLinkActive(link.href)
                                  ? 'bg-[color:var(--color-accent)]/16 text-[color:var(--color-accent-soft)]'
                                  : 'link-copy hover:bg-white/5'
                              )}
                            >
                              {link.label}
                            </a>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    {(showViewToggle || showLogout) && !isUserView ? (
                      <div className="mt-2 flex flex-col gap-2 border-t border-white/10 pt-3">
                        {showViewToggle ? <Button href={viewToggleHref} size="sm" variant="secondary" className="w-full justify-center">{viewToggleLabel}</Button> : null}
                        {showLogout && logoutAction ? (
                          <form action={logoutAction}>
                            <Button type="submit" size="sm" variant="secondary" className="w-full justify-center">Logout</Button>
                          </form>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </nav>
      </div>

      {showNavigationEditor && !isUserView && saveNavigationAction ? (
        <div className="site-shell mt-3">
          <div className="rounded-[1.35rem] border border-[#ff9d3c]/30 bg-[#130d09]/92 px-4 py-4 shadow-[0_20px_50px_rgba(0,0,0,0.25)] backdrop-blur-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#ffcf98]">Navigation</p>
                <p className="mt-1 text-sm text-[#f3dec4]">Texte, Ziele und Zuordnung zwischen Hauptnavigation und Mehr bearbeiten.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditorPanel((current) => !current)}
                className="rounded-xl border border-[#ff9d3c]/45 px-4 py-2 text-sm font-black text-[#f6e7d3] transition hover:border-[#ffb14d] hover:text-white"
              >
                {showEditorPanel ? 'Editor ausblenden' : 'Navigation bearbeiten'}
              </button>
            </div>
            {searchParams.get('chromeSaved') === 'navigation' ? <p className="mt-3 rounded-xl border border-green-500/30 bg-green-950/40 px-4 py-3 text-sm text-green-200">Navigation gespeichert.</p> : null}
            {searchParams.get('chromeError') ? <p className="mt-3 rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-200">{searchParams.get('chromeError')}</p> : null}
            {showEditorPanel ? (
              <form action={saveNavigationAction} className="mt-4 grid gap-4">
                <div className="grid gap-4 xl:grid-cols-3">
                  {orderedLinks.map((link) => (
                    <div key={link.id || link.href} className="rounded-[1rem] border border-white/10 bg-black/15 p-4">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#ffcf98]">{link.id}</p>
                      <input type="hidden" name={`navId:${link.id}`} value={link.id} />
                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-white">Text</span>
                        <input name={`navLabel:${link.id}`} defaultValue={link.label} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                      </label>
                      <label className="mt-3 block">
                        <span className="mb-2 block text-sm font-semibold text-white">Interner Link</span>
                        <input name={`navHref:${link.id}`} defaultValue={link.href} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                      </label>
                      <label className="mt-3 block">
                        <span className="mb-2 block text-sm font-semibold text-white">Bereich</span>
                        <select name={`navPlacement:${link.id}`} defaultValue={normalizeNavigationPlacement(link.placement)} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]">
                          <option value="primary">Hauptnavigation</option>
                          <option value="more">Mehr</option>
                        </select>
                      </label>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end">
                  <button type="submit" className="rounded-xl bg-[color:var(--color-accent)] px-5 py-3 text-sm font-black text-black transition hover:brightness-110">Navigation speichern</button>
                </div>
              </form>
            ) : null}
          </div>
        </div>
      ) : null}
    </header>
  );
}