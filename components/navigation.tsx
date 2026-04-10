'use client';

import { useState, useEffect } from 'react';
import type { ComponentProps } from 'react';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';
import type { NavigationLink } from '@/lib/cms/schema';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import headbangLogo from '../Headbang Handwerk e.V. Logo Final PNG.png';

interface NavigationProps {
  links: NavigationLink[];
  ctaLabel: string;
  ctaHref: string;
  showLogout?: boolean;
  logoutAction?: ComponentProps<'form'>['action'];
}

export function Navigation({ links, ctaLabel, ctaHref, showLogout = false, logoutAction }: NavigationProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3 min-h-24">
          <a href="/" className="flex items-center gap-3 group" aria-label="Headbang Handwerk">
            <Image
              src={headbangLogo}
              alt="Headbang Handwerk Logo"
              priority
              className="h-auto max-h-[78px] w-40 object-contain drop-shadow-[0_8px_18px_rgba(0,0,0,0.65)] sm:max-h-[92px] sm:w-48"
            />
          </a>

          <div className="hidden lg:flex items-center gap-2">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-[0.97rem] font-semibold text-[color:var(--color-foreground)] hover:text-[color:var(--color-accent-soft)] rounded-md transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {showLogout && logoutAction ? (
              <form action={logoutAction} className="hidden sm:block">
                <Button type="submit" size="sm" variant="secondary" className="min-w-32">
                  Logout
                </Button>
              </form>
            ) : null}
            <Button href={ctaHref} size="sm" className="hidden sm:inline-flex min-w-44">
              {ctaLabel}
            </Button>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden p-2 text-[color:var(--color-muted)] hover:text-[color:var(--color-accent-soft)] rounded-md transition-colors"
              aria-label="Menü öffnen"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {menuOpen && (
        <div className="lg:hidden bg-[color:var(--color-background)]/98 border-b border-[color:var(--color-border)] px-4 pb-5">
          <div className="flex flex-col gap-1 pt-2">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="px-3 py-2.5 text-sm font-semibold text-[color:var(--color-foreground)] hover:text-[color:var(--color-accent-soft)] rounded-md transition-colors"
              >
                {link.label}
              </a>
            ))}
            {showLogout && logoutAction ? (
              <form action={logoutAction} className="mt-3 w-full">
                <Button type="submit" size="sm" variant="secondary" className="w-full">
                  Logout
                </Button>
              </form>
            ) : null}
            <Button href={ctaHref} size="sm" className="mt-3 w-full">
              {ctaLabel}
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
