import type { Metadata } from 'next';
import { Navigation } from '@/components/navigation';
import { Footer } from '@/components/footer';

export const metadata: Metadata = { title: 'Kasse – Headbang Handwerk' };

export default function MerchCheckoutPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-[#0a0a0a] pt-24 pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h1 className="text-4xl font-black text-white mb-8">Kasse</h1>
          <div className="rounded-xl border border-[#2a2a2a] bg-[#141414] p-8 text-center text-gray-500">
            Checkout-Funktionalität folgt in Kürze.
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
