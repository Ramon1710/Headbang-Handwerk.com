import { normalizeZollhausProduct } from '@/lib/zollhaus/validation';

function buildFixtureSvgDataUrl(title: string, accent: string, detail: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900" role="img" aria-label="${title}">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#071419"/>
          <stop offset="100%" stop-color="#0f2f38"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="900" fill="url(#bg)"/>
      <circle cx="940" cy="170" r="180" fill="${accent}" fill-opacity="0.18"/>
      <circle cx="260" cy="690" r="220" fill="#60e9f4" fill-opacity="0.1"/>
      <rect x="100" y="110" width="1000" height="680" rx="46" fill="#041015" fill-opacity="0.72" stroke="#60e9f4" stroke-opacity="0.22"/>
      <text x="150" y="250" fill="#60e9f4" font-family="Arial, sans-serif" font-size="44" letter-spacing="8">ZOLLHAUS LEER</text>
      <text x="150" y="365" fill="#effbfd" font-family="Arial, sans-serif" font-size="92" font-weight="700">${title}</text>
      <text x="150" y="455" fill="#a6c7cf" font-family="Arial, sans-serif" font-size="38">${detail}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.replace(/\s+/g, ' ').trim())}`;
}

export function getLocalZollhausFixtureProducts() {
  return [
    normalizeZollhausProduct({
      id: 'local-zollhaus-screenprint',
      name: 'Zollhaus Screenprint Poster',
      description:
        'Limitierter Kunstdruck fuer den Innenraum des Zollhauses. Dunkle Grundflaechen, cyanfarbene Akzente und ein klares Motiv fuer die lokale Laufzeitpruefung der Produktdarstellung.',
      priceCents: 2800,
      stockQuantity: 14,
      status: 'active',
      images: [
        {
          id: 'poster-main',
          storagePath: 'zollhaus/local-fixture/poster-main',
          url: buildFixtureSvgDataUrl('Screenprint Poster', '#22b7c7', 'Lokales Laufzeitmuster'),
          alt: 'Illustration des Zollhaus Screenprint Posters',
          sortOrder: 0,
          contentType: 'image/svg+xml',
          sizeBytes: 1024,
          createdAt: '2026-09-13T00:00:00.000Z',
        },
        {
          id: 'poster-detail',
          storagePath: 'zollhaus/local-fixture/poster-detail',
          url: buildFixtureSvgDataUrl('Detailmotiv', '#60e9f4', 'Galeriebild fuer die Detailseite'),
          alt: 'Detailansicht des Screenprint Posters',
          sortOrder: 1,
          contentType: 'image/svg+xml',
          sizeBytes: 1024,
          createdAt: '2026-09-13T00:00:00.000Z',
        },
      ],
    }),
    normalizeZollhausProduct({
      id: 'local-zollhaus-mug',
      name: 'Zollhaus Becher',
      description:
        'Keramikbecher als zweites lokales Testprodukt. Die Menge steht hier absichtlich auf null, damit der oeffentliche Shop das deutliche Ausverkauft-Badge pruefbar anzeigt.',
      priceCents: 1600,
      stockQuantity: 0,
      status: 'active',
      images: [
        {
          id: 'mug-main',
          storagePath: 'zollhaus/local-fixture/mug-main',
          url: buildFixtureSvgDataUrl('Zollhaus Becher', '#39d8be', 'Lokales Ausverkauft-Muster'),
          alt: 'Illustration eines Zollhaus Bechers',
          sortOrder: 0,
          contentType: 'image/svg+xml',
          sizeBytes: 1024,
          createdAt: '2026-09-13T00:00:00.000Z',
        },
      ],
    }),
    normalizeZollhausProduct({
      id: 'local-zollhaus-archived',
      name: 'Archiviertes Testprodukt',
      description: 'Dieses Produkt dient nur dazu, dass archivierte Produkte öffentlich nicht auftauchen.',
      priceCents: 999,
      stockQuantity: 4,
      status: 'archived',
      archivedAt: '2026-09-12T00:00:00.000Z',
      images: [
        {
          id: 'archived-main',
          storagePath: 'zollhaus/local-fixture/archived-main',
          url: buildFixtureSvgDataUrl('Archiviert', '#7b8f95', 'Nicht öffentlich sichtbar'),
          alt: 'Illustration eines archivierten Produkts',
          sortOrder: 0,
          contentType: 'image/svg+xml',
          sizeBytes: 1024,
          createdAt: '2026-09-13T00:00:00.000Z',
        },
      ],
    }),
  ];
}
