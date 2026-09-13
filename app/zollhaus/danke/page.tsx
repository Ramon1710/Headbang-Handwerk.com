import Link from 'next/link';
import { getStoredZollhausOrderById } from '@/lib/zollhaus/checkout-store';
import { verifyZollhausConfirmationToken } from '@/lib/zollhaus/confirmation-token';
import { getResolvedZollhausShopSettings } from '@/lib/zollhaus/settings';
import { zollhausShellStyles as shellStyles } from '@/components/zollhaus/zollhaus-shell';
import uiStyles from '@/components/zollhaus/cart-ui.module.css';

export default async function ZollhausDankePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const verification = verifyZollhausConfirmationToken(String(params.token || ''));
  const settings = await getResolvedZollhausShopSettings();
  const order = verification ? await getStoredZollhausOrderById(verification.orderId) : null;
  const isValid = Boolean(order && verification && order.orderNumber === verification.orderNumber);

  return (
    <section className={shellStyles.panel}>
      <div className={uiStyles.confirmationCard}>
        <p className={shellStyles.placeholderNote}>Bestellbestätigung</p>
        <h2 className={shellStyles.panelTitle}>{isValid ? 'Bestellung gespeichert' : 'Bestätigung nicht verfügbar'}</h2>
        <div className={shellStyles.panelBody}>
          {isValid ? (
            <>
              <p>Ihre Bestellung wurde gespeichert.</p>
              <p className={uiStyles.successNumber}>{order?.orderNumber}</p>
              <p>{settings.checkoutConfirmationNotice}</p>
            </>
          ) : (
            <p>Dieser Bestätigungsnachweis ist ungültig oder abgelaufen. Aus Datenschutzgründen werden hier keine fremden Bestellungen angezeigt.</p>
          )}
        </div>
        <div className={uiStyles.buttonRow}>
          <Link href="/zollhaus" className={uiStyles.primaryButton}>Zurück zum Zollhaus-Shop</Link>
        </div>
      </div>
    </section>
  );
}