import type { Metadata } from 'next';
import { Navigation } from '@/components/navigation';
import { Footer } from '@/components/footer';
import { MerchProductCard } from '@/components/merch-product-card';
import { merchandiseProducts } from '@/lib/data';

export const metadata: Metadata = {
  title: 'Merchandise – Headbang Handwerk',
  description: 'Offizieller Headbang Handwerk Merch-Shop.',
};

export default function MerchandisePage() {
  const categories = [...new Set(merchandiseProducts.map((p) => p.category))];

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-[#0a0a0a] pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-14">
            <h1 className="text-4xl sm:text-5xl font-black text-white mb-4">
              <span className="text-orange-500">Merch</span>Shop
            </h1>
            <p className="text-gray-400 text-lg">
              Zeig, dass du dabei bist. Hochwertiger Merch für Metal-Fans und Handwerker.
            </p>
          </div>

          {categories.map((cat) => (
            <div key={cat} className="mb-14">
              <h2 className="text-2xl font-bold text-white mb-6">{cat}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {merchandiseProducts
                  .filter((p) => p.category === cat)
                  .map((product) => (
                    <MerchProductCard key={product.id} product={product} />
                  ))}
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
