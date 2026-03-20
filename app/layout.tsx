import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Headbang Handwerk – Handwerk trifft Metal',
  description:
    'Wir bringen das Handwerk auf die lautesten Festivals Europas – für Nachwuchs, Sichtbarkeit und ein unvergessliches Erlebnis.',
  keywords: [
    'Handwerk', 'Metal', 'Festival', 'Sponsoring', 'Nachwuchs', 'Wacken', 'Summer Breeze',
  ],
  openGraph: {
    title: 'Headbang Handwerk – Handwerk trifft Metal',
    description:
      'Wir bringen das Handwerk auf die lautesten Festivals Europas – für Nachwuchs, Sichtbarkeit und ein unvergessliches Erlebnis.',
    type: 'website',
    locale: 'de_DE',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
