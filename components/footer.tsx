import { Hammer, Instagram, Facebook, Youtube, Mail } from 'lucide-react';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#0a0a0a] border-t border-[#2a2a2a] mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div>
            <a href="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg bg-orange-500 flex items-center justify-center">
                <Hammer className="w-5 h-5 text-black" />
              </div>
              <span className="font-bold text-white text-lg">
                Headbang <span className="text-orange-500">Handwerk</span>
              </span>
            </a>
            <p className="text-gray-500 text-sm leading-relaxed">
              Handwerk trifft Metal.<br />
              Wir bringen das Handwerk auf die lautesten Festivals Europas.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Navigation</h4>
            <ul className="space-y-2">
              {[
                ['Startseite', '/'],
                ['Veranstaltungen', '/veranstaltungen'],
                ['Sponsoren', '/sponsoren'],
                ['Merchandise', '/merchandise'],
                ['3D-Stand', '/drei-d-stand'],
              ].map(([label, href]) => (
                <li key={href}>
                  <a href={href} className="text-gray-500 hover:text-orange-400 text-sm transition-colors">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Rechtliches */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Rechtliches</h4>
            <ul className="space-y-2">
              {[
                ['Impressum', '/impressum'],
                ['Datenschutz', '/datenschutz'],
                ['AGB', '/agb'],
                ['Über uns', '/ueber-uns'],
                ['Kontakt', '/kontakt'],
              ].map(([label, href]) => (
                <li key={href}>
                  <a href={href} className="text-gray-500 hover:text-orange-400 text-sm transition-colors">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Social & Kontakt */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Folgt uns</h4>
            <div className="flex gap-3 mb-6">
              {[
                { icon: Instagram, label: 'Instagram', href: '#' },
                { icon: Facebook, label: 'Facebook', href: '#' },
                { icon: Youtube, label: 'YouTube', href: '#' },
              ].map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-lg border border-[#2a2a2a] flex items-center justify-center text-gray-500 hover:text-orange-400 hover:border-orange-500/50 transition-all"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
            <a
              href="mailto:info@headbang-handwerk.com"
              className="flex items-center gap-2 text-gray-500 hover:text-orange-400 text-sm transition-colors"
            >
              <Mail className="w-4 h-4" />
              info@headbang-handwerk.com
            </a>
          </div>
        </div>

        <div className="border-t border-[#2a2a2a] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-gray-600 text-xs">
            © {year} Headbang Handwerk. Alle Rechte vorbehalten.
          </p>
          <div className="flex gap-4">
            {[
              ['Impressum', '/impressum'],
              ['Datenschutz', '/datenschutz'],
              ['AGB', '/agb'],
            ].map(([label, href]) => (
              <a key={href} href={href} className="text-gray-600 hover:text-gray-400 text-xs transition-colors">
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
