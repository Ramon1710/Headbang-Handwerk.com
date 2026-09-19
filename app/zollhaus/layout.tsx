import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { ZollhausCartProvider } from '@/components/zollhaus/cart-provider';
import { ZollhausShell } from '@/components/zollhaus/zollhaus-shell';

const zollhausFont = localFont({
  src: [
    { path: './fonts/QuadraatSansOT.otf', weight: '400', style: 'normal' },
    { path: './fonts/QuadraatSansOT-Bld.otf', weight: '700', style: 'normal' },
  ],
  variable: '--font-zollhaus',
  display: 'swap',
  fallback: ['Arial', 'Helvetica', 'sans-serif'],
});

export const metadata: Metadata = {
  title: 'Zollhaus Shop',
  description: 'Besondere Artikel und Produkte aus dem Zollhaus.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ZollhausLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={zollhausFont.variable}>
      <ZollhausCartProvider>
        <ZollhausShell>{children}</ZollhausShell>
      </ZollhausCartProvider>
    </div>
  );
}