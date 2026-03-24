'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import headbangLogo from '../Headbang Handwerk e.V. Logo.png';

const navLinks = [
  { label: 'Startseite', href: '/' },
  { label: 'Veranstaltungen', href: '/veranstaltungen' },
  { label: 'Sponsoren', href: '/sponsoren' },
  { label: '3D-Stand', href: '/drei-d-stand' },
  { label: 'Über uns', href: '/ueber-uns' },
  { label: 'Kontakt', href: '/kontakt' },
];

export function Navigation() {
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
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-[#100a07]/95 backdrop-blur-md border-b border-[#4a2b19] shadow-[0_14px_45px_rgba(0,0,0,0.65)]'
          : 'bg-[#090604]/88 border-b border-[#4a2b19]/80'
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
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-[0.97rem] font-semibold text-[#e9d8c4] hover:text-[#ff9f35] rounded-md transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Button href="/sponsoren" size="sm" className="hidden sm:inline-flex min-w-44">
              Jetzt unterstützen
            </Button>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden p-2 text-[#d8c6b3] hover:text-[#ff9f35] rounded-md transition-colors"
              aria-label="Menü öffnen"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {menuOpen && (
        <div className="lg:hidden bg-[#0f0907]/98 border-b border-[#4a2b19] px-4 pb-5">
          <div className="flex flex-col gap-1 pt-2">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="px-3 py-2.5 text-sm font-semibold text-[#dfcdb8] hover:text-[#ff9f35] rounded-md transition-colors"
              >
                {link.label}
              </a>
            ))}
            <Button href="/sponsoren" size="sm" className="mt-3 w-full">
              Jetzt unterstützen
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
