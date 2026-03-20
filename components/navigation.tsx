'use client';

import { useState, useEffect } from 'react';
import { Menu, X, Hammer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';

const navLinks = [
  { label: 'Startseite', href: '/' },
  { label: 'Veranstaltungen', href: '/veranstaltungen' },
  { label: 'Sponsoren', href: '/sponsoren' },
  { label: 'Merchandise', href: '/merchandise' },
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
          ? 'bg-black/95 backdrop-blur-md border-b border-[#2a2a2a] shadow-xl'
          : 'bg-transparent'
      )}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-lg bg-orange-500 flex items-center justify-center group-hover:bg-orange-400 transition-colors">
              <Hammer className="w-5 h-5 text-black" />
            </div>
            <span className="font-bold text-white text-lg hidden sm:block">
              Headbang <span className="text-orange-500">Handwerk</span>
            </span>
          </a>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-sm text-gray-300 hover:text-orange-400 rounded-md transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* CTA + Burger */}
          <div className="flex items-center gap-3">
            <Button href="/sponsoren" size="sm" className="hidden sm:inline-flex">
              Sponsor werden
            </Button>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden p-2 text-gray-300 hover:text-white rounded-md transition-colors"
              aria-label="Menü öffnen"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden bg-black/98 border-b border-[#2a2a2a] px-4 pb-4">
          <div className="flex flex-col gap-1 pt-2">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="px-3 py-2.5 text-sm text-gray-300 hover:text-orange-400 rounded-md transition-colors"
              >
                {link.label}
              </a>
            ))}
            <Button href="/sponsoren" size="sm" className="mt-3 w-full">
              Sponsor werden
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
