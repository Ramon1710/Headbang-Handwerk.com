import { ArrowRight, ShoppingBag } from 'lucide-react';
import { merchandiseProducts } from '@/lib/data';
import { formatPrice } from '@/lib/utils';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

export function SectionMerchTeaser() {
  const featured = merchandiseProducts.slice(0, 3);

  return (
    <section className="py-20 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-12 gap-4">
          <div>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">
              <span className="text-orange-500">Merch</span>Shop
            </h2>
            <p className="text-gray-400">Zeig, dass du dabei bist.</p>
          </div>
          <Button href="/merchandise" variant="secondary">
            Zum Shop <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {featured.map((product) => (
            <div
              key={product.id}
              className="rounded-xl border border-[#2a2a2a] bg-[#141414] overflow-hidden hover:border-orange-500/40 transition-all duration-300 group"
            >
              {/* Image placeholder */}
              <div className="aspect-square bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] flex items-center justify-center relative">
                <ShoppingBag className="w-16 h-16 text-[#2a2a2a] group-hover:text-orange-500/30 transition-colors" />
                {product.badge && (
                  <div className="absolute top-3 left-3">
                    <Badge variant="info">{product.badge}</Badge>
                  </div>
                )}
              </div>
              <div className="p-5">
                <h3 className="text-white font-semibold mb-1">{product.name}</h3>
                <p className="text-gray-500 text-xs mb-3 line-clamp-2">{product.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-orange-500 font-bold text-lg">
                    {formatPrice(product.price)}
                  </span>
                  <Button href="/merchandise" size="sm">
                    Ansehen
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
