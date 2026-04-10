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
            '--cms-box-label-font': cms.theme.boxLabelFont === 'cinzel' ? 'var(--font-cinzel), Georgia, serif' : 'var(--font-exo), Segoe UI, Tahoma, sans-serif',
            '--cms-box-title-font': cms.theme.boxTitleFont === 'cinzel' ? 'var(--font-cinzel), Georgia, serif' : 'var(--font-exo), Segoe UI, Tahoma, sans-serif',
            '--cms-box-body-font': cms.theme.boxBodyFont === 'cinzel' ? 'var(--font-cinzel), Georgia, serif' : 'var(--font-exo), Segoe UI, Tahoma, sans-serif',
            '--cms-box-label-size': cms.theme.boxLabelSize,
            '--cms-box-title-size': cms.theme.boxTitleSize,
            '--cms-box-body-size': cms.theme.boxBodySize,
          } as React.CSSProperties
        }
      >
        {children}
      </body>
    </html>
  );
}
