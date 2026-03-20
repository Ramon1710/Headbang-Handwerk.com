import type { Metadata } from 'next';
import { Navigation } from '@/components/navigation';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { ShoppingBag } from 'lucide-react';

export const metadata: Metadata = { title: 'Warenkorb – Headbang Handwerk' };

export default function WarenkorbPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-[#0a0a0a] pt-24 pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center py-20">
          <ShoppingBag className="w-16 h-16 text-gray-700 mx-auto mb-6" />
          <h1 className="text-3xl font-black text-white mb-4">Dein Warenkorb</h1>
          <p className="text-gray-500 mb-8">Dein Warenkorb ist noch leer.</p>
          <Button href="/merchandise" size="lg">Weiter einkaufen</Button>
        </div>
      </main>
      <Footer />
    </>
  );
}
