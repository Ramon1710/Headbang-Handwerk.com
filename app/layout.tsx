import type { Metadata } from 'next';
import { Cinzel, Exo_2 } from 'next/font/google';
import './globals.css';

const cinzel = Cinzel({
  subsets: ['latin'],
  variable: '--font-cinzel',
  weight: ['600', '700', '800', '900'],
});

const exo2 = Exo_2({
  subsets: ['latin'],
  variable: '--font-exo',
  weight: ['400', '500', '600', '700', '800'],
});

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
      <body className={`${cinzel.variable} ${exo2.variable}`}>{children}</body>
    </html>
  );
}
