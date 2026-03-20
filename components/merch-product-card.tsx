import { ShoppingBag } from 'lucide-react';
import { MerchandiseProduct } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface MerchProductCardProps {
  product: MerchandiseProduct;
}

export function MerchProductCard({ product }: MerchProductCardProps) {
  return (
    <div className="rounded-xl border border-[#2a2a2a] bg-[#141414] overflow-hidden hover:border-orange-500/40 transition-all duration-300 group flex flex-col">
      {/* Image placeholder */}
      <div className="aspect-square bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] flex items-center justify-center relative">
        <ShoppingBag className="w-16 h-16 text-[#2a2a2a] group-hover:text-orange-500/30 transition-colors" />
        {product.badge && (
          <div className="absolute top-3 left-3">
            <Badge variant="info">{product.badge}</Badge>
          </div>
        )}
        {!product.inStock && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-gray-500 text-sm font-medium">Ausverkauft</span>
          </div>
        )}
      </div>
      <div className="p-5 flex flex-col flex-1">
        <div className="mb-1">
          <span className="text-xs text-gray-600 uppercase tracking-wider">{product.category}</span>
        </div>
        <h3 className="text-white font-semibold mb-2 flex-1">{product.name}</h3>
        <p className="text-gray-500 text-xs mb-4 line-clamp-2 leading-relaxed">
          {product.description}
        </p>
        {product.variants.size && (
          <div className="flex flex-wrap gap-1 mb-3">
            {product.variants.size.map((s) => (
              <span
                key={s}
                className="px-2 py-0.5 text-xs border border-[#2a2a2a] text-gray-500 rounded"
              >
                {s}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between mt-auto">
          <span className="text-orange-500 font-bold text-lg">{formatPrice(product.price)}</span>
          <Button size="sm" disabled={!product.inStock}>
            {product.inStock ? 'In den Warenkorb' : 'Ausverkauft'}
          </Button>
        </div>
      </div>
    </div>
  );
}
