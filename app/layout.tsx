import type { Metadata } from 'next';
import { Cinzel, Exo_2 } from 'next/font/google';
import { getCmsContent } from '@/lib/cms/storage';
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

export async function generateMetadata(): Promise<Metadata> {
  const cms = await getCmsContent();

  return {
    title: cms.site.seo.title,
    description: cms.site.seo.description,
    keywords: cms.site.seo.keywords,
    openGraph: {
      title: cms.site.seo.title,
      description: cms.site.seo.description,
      type: 'website',
      locale: 'de_DE',
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cms = await getCmsContent();

  return (
    <html lang="de">
      <body
        className={`${cinzel.variable} ${exo2.variable}`}
        style={
          {
            '--background': cms.theme.background,
            '--foreground': cms.theme.foreground,
            '--accent-orange': cms.theme.accent,
            '--accent-strong': cms.theme.accentStrong,
            '--accent-gold': cms.theme.accentSoft,
            '--surface': cms.theme.surface,
            '--surface-2': cms.theme.surfaceAlt,
            '--border': cms.theme.border,
            '--muted': cms.theme.muted,
          } as React.CSSProperties
        }
      >
        {children}
      </body>
    </html>
  );
}
