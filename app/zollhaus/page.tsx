import { listPublicZollhausProducts } from '@/lib/zollhaus/public-catalog';
import { getResolvedZollhausShopSettings } from '@/lib/zollhaus/settings';
import { ZollhausShopPageContent } from '@/components/zollhaus/shop-page-content';

export default async function ZollhausPage() {
  const [products, settings] = await Promise.all([listPublicZollhausProducts(), getResolvedZollhausShopSettings()]);

  return <ZollhausShopPageContent products={products} settings={settings} />;
}