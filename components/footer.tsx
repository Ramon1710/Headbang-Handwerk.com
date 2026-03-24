import { Instagram, Facebook, Youtube } from 'lucide-react';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-16 border-t border-[#4f2d1a] bg-[linear-gradient(180deg,#0c0705_0%,#090604_100%)]">
      <div className="fire-divider" />
      <div className="w-full px-4 py-14 text-center sm:px-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center">
          <p className="text-[1.9rem] sm:text-[2.2rem] font-semibold text-[#f2ba63] mb-5">
          Headbang Handwerk
          <span className="text-[#f0e7da]"> - wir bringen das Handwerk auf die Bühne.</span>
          </p>

          <div className="mb-10 flex items-center justify-center gap-4">
            {[
              { icon: Facebook, label: 'Facebook', href: '#' },
              { icon: Instagram, label: 'Instagram', href: '#' },
              { icon: Youtube, label: 'YouTube', href: '#' },
            ].map(({ icon: Icon, label, href }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(180deg,rgba(45,29,20,0.95)_0%,rgba(20,13,9,0.7)_100%)] text-[#f1bb66] ring-1 ring-[#8a572f]/70 transition-all hover:text-[#ffd89b] hover:ring-[#c8813d]"
              >
                <Icon className="w-5 h-5" />
              </a>
            ))}
          </div>

          <div className="flex w-full justify-center">
            <div className="flex w-full max-w-4xl flex-wrap items-center justify-center gap-x-5 gap-y-3 border-t border-[#3d2415] pt-5 text-center text-sm text-[#d6c3ad]">
              <p>© {year} Headbang Handwerk e.V.</p>
              <a href="/impressum" className="hover:text-[#ffb85e] transition-colors">Impressum</a>
              <a href="/datenschutz" className="hover:text-[#ffb85e] transition-colors">Datenschutz</a>
              <a href="/agb" className="hover:text-[#ffb85e] transition-colors">AGB</a>
              <a href="/kontakt" className="hover:text-[#ffb85e] transition-colors">Kontakt</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
