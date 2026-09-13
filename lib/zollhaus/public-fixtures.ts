import { normalizeZollhausProduct } from '@/lib/zollhaus/validation';

export function getLocalZollhausFixtureProducts() {
  return [
    normalizeZollhausProduct({
      id: 'local-zollhaus-screenprint',
      name: 'Zollhaus Screenprint Poster',
      description:
        'Limitierter Kunstdruck fuer besondere Ecken im Zollhaus. Der kräftige Print setzt einen klaren Akzent und bringt die offene Atmosphäre des Hauses in jedes Zimmer.',
      priceCents: 2800,
      stockQuantity: 14,
      status: 'active',
      images: [
        {
          id: 'poster-main',
          storagePath: 'zollhaus/local-fixture/poster-main',
          url: '/zollhaus/fixtures/poster-main.svg',
          alt: 'Illustration des Zollhaus Screenprint Posters',
          sortOrder: 0,
          contentType: 'image/svg+xml',
          sizeBytes: 1024,
          createdAt: '2026-09-13T00:00:00.000Z',
        },
        {
          id: 'poster-detail',
          storagePath: 'zollhaus/local-fixture/poster-detail',
          url: '/zollhaus/fixtures/poster-detail.svg',
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
        'Keramikbecher fuer den ersten Kaffee, den langen Probentag oder eine ruhige Pause zwischendurch. Ein kleiner Zollhaus-Moment fuer jeden Tag.',
      priceCents: 1600,
      stockQuantity: 0,
      status: 'active',
      images: [
        {
          id: 'mug-main',
          storagePath: 'zollhaus/local-fixture/mug-main',
          url: '/zollhaus/fixtures/mug-main.svg',
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
          url: '/zollhaus/fixtures/archived-main.svg',
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
