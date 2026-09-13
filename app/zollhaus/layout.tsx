import type { Metadata } from 'next';
import { Manrope, Sora } from 'next/font/google';
import { ZollhausCartProvider } from '@/components/zollhaus/cart-provider';
import { ZollhausShell } from '@/components/zollhaus/zollhaus-shell';

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  weight: ['600', '700', '800'],
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Zollhaus Shop',
  description: 'Eigenständiger Microsite-Bereich für den künftigen Zollhaus-Shop.',
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
    <div className={`${sora.variable} ${manrope.variable}`} style={{ fontFamily: 'var(--font-manrope), Segoe UI, sans-serif' }}>
      <ZollhausCartProvider>
        <ZollhausShell>{children}</ZollhausShell>
      </ZollhausCartProvider>
    </div>
  );
}