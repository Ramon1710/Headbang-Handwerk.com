import Link from 'next/link';
import { restoreOrderStockAction, retryOrderEmailAction, updateOrderStatusAction } from '../../actions';
import { requireZollhausAccess } from '@/lib/cms/auth';
import { zollhausShellStyles as styles } from '@/components/zollhaus/zollhaus-shell';
import adminStyles from '@/components/zollhaus/product-admin.module.css';
import { formatPriceCentsForDisplay } from '@/lib/zollhaus/product-admin';
import { ZOLLHAUS_MANAGED_ORDER_STATUSES, getZollhausOrderEmailStatusLabel, getZollhausOrderStatusLabel, getZollhausManagedOrderById } from '@/lib/zollhaus/order-management';

function getSavedMessage(saved?: string) {
  if (saved === 'email-resent') {
    return 'Die interne Bestellmail wurde erneut versendet.';
  }

  if (saved === 'stock-restored') {
    return 'Der Bestand wurde erfolgreich zurueckgebucht.';
  }

  if (saved?.startsWith('status-')) {
    return `Bestellstatus aktualisiert: ${getZollhausOrderStatusLabel(saved.replace('status-', '') as never)}.`;
  }

  return null;
}

export default async function ZollhausAdminOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  await requireZollhausAccess('/zollhaus/admin');
  const routeParams = await params;
  const query = await searchParams;
  const order = await getZollhausManagedOrderById(routeParams.orderId);

  if (!order) {
    return (
      <section className={styles.panel}>
        <div className={adminStyles.stack}>
          <p className={styles.placeholderNote}>Bestelldetail</p>
          <h2 className={styles.panelTitle}>Bestellung nicht gefunden</h2>
          <div className={styles.panelBody}>
            <p>Die angeforderte Bestellung konnte nicht geladen werden.</p>
          </div>
          <div className={adminStyles.buttonRow}>
            <Link href="/zollhaus/admin" className={adminStyles.secondaryButton}>Zur Bestellübersicht</Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className={adminStyles.stack}>
      <section className={styles.panel}>
        <div className={adminStyles.toolbar}>
          <div>
            <p className={styles.placeholderNote}>Bestelldetail</p>
            <h2 className={styles.panelTitle}>{order.orderNumber}</h2>
            <div className={styles.panelBody}>
              <p>Bestelldatum: {new Date(order.createdAt).toLocaleString('de-DE')}</p>
            </div>
          </div>
          <div className={adminStyles.buttonRow}>
            <Link href="/zollhaus/admin" className={adminStyles.secondaryButton}>Zur Bestellübersicht</Link>
          </div>
        </div>
      </section>

      {getSavedMessage(query.saved) ? <div className={adminStyles.noticeSuccess}>{getSavedMessage(query.saved)}</div> : null}
      {query.error ? <div className={adminStyles.noticeError}>{query.error}</div> : null}

      <section className={styles.panel}>
        <div className={adminStyles.detailGrid}>
          <div className={adminStyles.detailCard}>
            <div className={adminStyles.detailTerm}>Vor- und Nachname</div>
            <div className={adminStyles.detailValue}>{order.customer.firstName} {order.customer.lastName}</div>
          </div>
          <div className={adminStyles.detailCard}>
            <div className={adminStyles.detailTerm}>Anschrift</div>
            <div className={adminStyles.detailValue}>{order.customer.street} {order.customer.houseNumber}, {order.customer.postalCode} {order.customer.city}</div>
          </div>
          <div className={adminStyles.detailCard}>
            <div className={adminStyles.detailTerm}>E-Mail-Adresse</div>
            <div className={adminStyles.detailValue}>{order.customer.email}</div>
          </div>
          <div className={adminStyles.detailCard}>
            <div className={adminStyles.detailTerm}>Telefonnummer</div>
            <div className={adminStyles.detailValue}>{order.customer.phone}</div>
          </div>
          <div className={adminStyles.detailCard}>
            <div className={adminStyles.detailTerm}>Bestellstatus</div>
            <div className={adminStyles.detailValue}>{getZollhausOrderStatusLabel(order.status)}</div>
          </div>
          <div className={adminStyles.detailCard}>
            <div className={adminStyles.detailTerm}>E-Mail-Status</div>
            <div className={adminStyles.detailValue}>{getZollhausOrderEmailStatusLabel(order.email.state)}</div>
          </div>
          <div className={adminStyles.detailCard}>
            <div className={adminStyles.detailTerm}>Versandversuche</div>
            <div className={adminStyles.detailValue}>{order.email.attemptCount}</div>
          </div>
          <div className={adminStyles.detailCard}>
            <div className={adminStyles.detailTerm}>Gesamtpreis</div>
            <div className={adminStyles.detailValue}>{formatPriceCentsForDisplay(order.totalPriceCents)}</div>
          </div>
        </div>
      </section>

      <section className={styles.panel}>
        <div className={adminStyles.stack}>
          <h3 className={adminStyles.productTitle}>Bestellte Artikel und Produktsnapshots</h3>
          <div className={adminStyles.orderTableWrap}>
            <table className={adminStyles.orderTable}>
              <thead>
                <tr>
                  <th>Artikel</th>
                  <th>Menge</th>
                  <th>Einzelpreis</th>
                  <th>Snapshot</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={`${item.productId}-${item.productSnapshot.id}`}>
                    <td>{item.productName}</td>
                    <td>{item.quantity}</td>
                    <td>{formatPriceCentsForDisplay(item.unitPriceCents)}</td>
                    <td>
                      <div className={adminStyles.orderMeta}>ID: {item.productSnapshot.id}</div>
                      <div className={adminStyles.orderMeta}>Name: {item.productSnapshot.name}</div>
                      <div className={adminStyles.orderMeta}>Status: {item.productSnapshot.status}</div>
                      <div className={adminStyles.orderMeta}>Preis: {formatPriceCentsForDisplay(item.productSnapshot.priceCents)}</div>
                      {item.productSnapshot.primaryImageAlt ? <div className={adminStyles.orderMeta}>Bildbeschreibung: {item.productSnapshot.primaryImageAlt}</div> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <div className={adminStyles.twoColumnLayout}>
        <section className={styles.panel}>
          <div className={adminStyles.stack}>
            <h3 className={adminStyles.productTitle}>Bestellstatus ändern</h3>
            <form action={updateOrderStatusAction} className={adminStyles.statusFormGrid}>
              <input type="hidden" name="orderId" value={order.id} />
              <div className={adminStyles.field}>
                <label htmlFor="zollhaus-order-status" className={adminStyles.fieldLabel}>Neuer Status</label>
                <select id="zollhaus-order-status" name="status" defaultValue={order.status === 'email_sent' || order.status === 'email_failed' ? 'new' : order.status}>
                  {ZOLLHAUS_MANAGED_ORDER_STATUSES.map((status) => (
                    <option key={status} value={status}>{getZollhausOrderStatusLabel(status)}</option>
                  ))}
                </select>
              </div>
              <label className={adminStyles.checkboxOption}>
                <input type="checkbox" name="statusConfirmed" />
                Ja, diese Statusänderung soll gespeichert werden
              </label>
              <button type="submit" className={adminStyles.primaryButton}>Status speichern</button>
              {order.statusUpdatedAt ? <p className={adminStyles.orderMeta}>Zuletzt geändert: {new Date(order.statusUpdatedAt).toLocaleString('de-DE')} durch {order.statusUpdatedBy} ({order.statusUpdatedByRole})</p> : null}
            </form>
          </div>
        </section>

        <section className={styles.panel}>
          <div className={adminStyles.stack}>
            <h3 className={adminStyles.productTitle}>Interne Bestellmail</h3>
            <div className={styles.panelBody}>
              <p>Status: {getZollhausOrderEmailStatusLabel(order.email.state)}</p>
              <p>Versandversuche: {order.email.attemptCount}</p>
              {order.email.lastAttemptAt ? <p>Letzter Versuch: {new Date(order.email.lastAttemptAt).toLocaleString('de-DE')}</p> : null}
              {order.email.sentAt ? <p>Versendet am: {new Date(order.email.sentAt).toLocaleString('de-DE')}</p> : null}
            </div>
            <form action={retryOrderEmailAction} className={adminStyles.statusFormGrid}>
              <input type="hidden" name="orderId" value={order.id} />
              <label className={adminStyles.checkboxOption}>
                <input type="checkbox" name="retryConfirmed" />
                Ja, die interne Bestellmail soll erneut versendet werden
              </label>
              <button type="submit" className={order.email.state === 'sent' || order.email.state === 'sending' ? `${adminStyles.secondaryButton} ${adminStyles.buttonDisabled}` : adminStyles.primaryButton} disabled={order.email.state === 'sent' || order.email.state === 'sending'}>
                E-Mail erneut senden
              </button>
            </form>
          </div>
        </section>
      </div>

      <section className={styles.panel}>
        <div className={adminStyles.stack}>
          <h3 className={adminStyles.productTitle}>Stornierung und Bestandsrückgabe</h3>
          <div className={styles.panelBody}>
            <p>Eine Stornierung verändert den Bestand nicht automatisch. Die Rückbuchung muss separat bestätigt werden.</p>
            {order.stockRestoredAt ? <p>Bestand bereits zurückgebucht am {new Date(order.stockRestoredAt).toLocaleString('de-DE')} durch {order.stockRestoredBy} ({order.stockRestoredByRole}).</p> : null}
          </div>
          <form action={restoreOrderStockAction} className={adminStyles.statusFormGrid}>
            <input type="hidden" name="orderId" value={order.id} />
            <label className={adminStyles.checkboxOption}>
              <input type="checkbox" name="restoreConfirmed" />
              Ja, der Bestand soll anhand der gespeicherten Bestellpositionen zurückgebucht werden
            </label>
            <button type="submit" className={order.status !== 'cancelled' || order.stockRestoredAt ? `${adminStyles.secondaryButton} ${adminStyles.buttonDisabled}` : adminStyles.dangerButton} disabled={order.status !== 'cancelled' || Boolean(order.stockRestoredAt)}>
              Bestand zurückbuchen
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}