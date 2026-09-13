import Link from 'next/link';
import { getStoredZollhausOrderById } from '@/lib/zollhaus/checkout-store';
import { verifyZollhausConfirmationToken } from '@/lib/zollhaus/confirmation-token';
import { getResolvedZollhausShopSettings } from '@/lib/zollhaus/settings';
import { resolveZollhausNotice } from '@/components/zollhaus/public-copy';
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
  const confirmationNotice = resolveZollhausNotice(
    settings.checkoutConfirmationNotice,
    'Vielen Dank. Wir haben Ihre Bestellung erhalten und melden uns mit den weiteren Informationen bei Ihnen.'
  );

  return (
    <section className={shellStyles.panel}>
      <div className={uiStyles.confirmationCard}>
        <p className={shellStyles.placeholderNote}>Bestellbestätigung</p>
        <h2 className={shellStyles.panelTitle}>{isValid ? 'Bestellung erfolgreich erfasst' : 'Bestätigung nicht verfügbar'}</h2>
        <div className={shellStyles.panelBody}>
          {isValid ? (
            <>
              <p>Ihre Bestellung wurde erfolgreich erfasst.</p>
              <p className={uiStyles.successNumber}>{order?.orderNumber}</p>
              <p>{confirmationNotice}</p>
            </>
          ) : (
            <p>Dieser Bestätigungslink ist ungültig oder abgelaufen. Zum Schutz Ihrer Daten werden hier keine fremden Bestellungen angezeigt.</p>
          )}
        </div>
        <div className={uiStyles.buttonRow}>
          <Link href="/zollhaus" className={uiStyles.primaryButton}>Zurück zum Zollhaus-Shop</Link>
        </div>
      </div>
    </section>
  );
}