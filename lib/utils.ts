import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency }).format(amount);
}

export function formatDate(dateString: string): string {
  return dateString;
}

export function normalizePartnerLogoBoxOpacity(backgroundHex: string | null | undefined, opacityPercent: number | null | undefined, fallback = 100): number {
  const normalizedOpacity = Number.isFinite(opacityPercent)
    ? Math.min(100, Math.max(0, Math.round(Number(opacityPercent))))
    : fallback;
  const normalizedBackground = String(backgroundHex || '').trim().toLowerCase();

  if ((normalizedBackground === '#fff' || normalizedBackground === '#ffffff') && normalizedOpacity === 55) {
    return 100;
  }

  return normalizedOpacity;
}
