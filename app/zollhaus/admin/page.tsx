import Link from 'next/link';
import { archiveProductAction, logoutAction, saveProductAction } from './actions';
import { hasFirebaseConfig } from '@/lib/cms/firebase';
import { requireZollhausAccess } from '@/lib/cms/auth';
import { ShopPreviewSwitcher } from '@/components/zollhaus/shop-preview-switcher';
import { ZollhausShopPageContent } from '@/components/zollhaus/shop-page-content';
import { buildProductPreviewModel, formatPriceCentsForDisplay, formatPriceCentsForInput, getZollhausProductDisplayStatus } from '@/lib/zollhaus/product-admin';
import { ZOLLHAUS_ADMIN_ORDER_PAGE_SIZE, ZOLLHAUS_ORDER_FILTERS, getZollhausOrderEmailStatusLabel, getZollhausOrderStatusLabel, listZollhausManagedOrders, matchesZollhausOrderFilter, type ZollhausOrderListFilter } from '@/lib/zollhaus/order-management';
import { listPublicZollhausProducts } from '@/lib/zollhaus/public-catalog';
import { listZollhausProducts } from '@/lib/zollhaus/products';
import { getResolvedZollhausShopSettings } from '@/lib/zollhaus/settings';
import { zollhausShellStyles as styles } from '@/components/zollhaus/zollhaus-shell';
import adminStyles from '@/components/zollhaus/product-admin.module.css';
import { ProductPreviewSwitcher } from '@/components/zollhaus/product-preview-switcher';
import type { ZollhausOrder, ZollhausProduct } from '@/lib/zollhaus/types';

function getStatusClassName(product: ZollhausProduct) {
  const label = getZollhausProductDisplayStatus(product);

  if (label === 'Archiviert') {
    return adminStyles.statusArchived;
  }

  if (label === 'Ausverkauft') {
    return adminStyles.statusSoldOut;
  }

  return adminStyles.statusActive;
}

function getSavedMessage(saved?: string) {
  if (saved === 'created') {
    return 'Produkt angelegt.';
  }

  if (saved === 'updated') {
    return 'Produkt gespeichert.';
  }

  if (saved === 'archived') {
    return 'Produkt archiviert.';
  }

  if (saved === 'reactivated') {
    return 'Produkt wieder aktiviert.';
  }

  if (saved === 'email-resent') {
    return 'Die interne Bestellmail wurde erneut versendet.';
  }

  if (saved === 'stock-restored') {
    return 'Der Bestand wurde fuer diese Bestellung zurueckgebucht.';
  }

  if (saved?.startsWith('status-')) {
    return `Bestellstatus aktualisiert: ${getZollhausOrderStatusLabel(saved.replace('status-', '') as ZollhausOrder['status'])}.`;
  }

  return null;
}

function parseOrderFilter(value: string | undefined): ZollhausOrderListFilter {
  return ZOLLHAUS_ORDER_FILTERS.some((entry) => entry.value === value) ? (value as ZollhausOrderListFilter) : 'all';
}

function parsePage(value: string | undefined) {
  const page = Number.parseInt(String(value || ''), 10);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function buildAdminHref(params: { filter?: ZollhausOrderListFilter; page?: number; product?: string; isNew?: boolean }) {
  const search = new URLSearchParams();

  if (params.filter && params.filter !== 'all') {
    search.set('filter', params.filter);
  }

  if (params.page && params.page > 1) {
    search.set('page', String(params.page));
  }

  if (params.product) {
    search.set('product', params.product);
  }

  if (params.isNew) {
    search.set('new', '1');
  }

  const query = search.toString();
  return query ? `/zollhaus/admin?${query}` : '/zollhaus/admin';
}

function getOrderStatusClassName(status: ZollhausOrder['status']) {
  if (status === 'cancelled') {
    return adminStyles.statusArchived;
  }

  if (status === 'shipped') {
    return adminStyles.statusActive;
  }

  if (status === 'invoiced') {
    return adminStyles.statusSoldOut;
  }

  return adminStyles.statusActive;
}

function getEmailStatusClassName(order: ZollhausOrder) {
  if (order.email.state === 'failed') {
    return adminStyles.statusArchived;
  }

  if (order.email.state === 'sent') {
    return adminStyles.statusActive;
  }

  return adminStyles.statusSoldOut;
}

export default async function ZollhausAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string; new?: string; saved?: string; error?: string; filter?: string; page?: string }>;
}) {
  const session = await requireZollhausAccess('/zollhaus/admin');
  const params = await searchParams;
  const firebaseConfigured = hasFirebaseConfig();
  let products: ZollhausProduct[] = [];
  let orders: ZollhausOrder[] = [];
  let previewProducts = [] as Awaited<ReturnType<typeof listPublicZollhausProducts>>;
  let previewSettings = await getResolvedZollhausShopSettings();
  let dataUnavailable = false;

  try {
    [orders, previewProducts, previewSettings] = await Promise.all([
      listZollhausManagedOrders(),
      listPublicZollhausProducts(),
      getResolvedZollhausShopSettings(),
    ]);
  } catch {
    dataUnavailable = true;
  }

  if (firebaseConfigured) {
    try {
      products = await listZollhausProducts({ includeArchived: true });
    } catch {
      dataUnavailable = true;
    }
  }

  const selectedProduct = params.new === '1'
    ? null
    : (products.find((product) => product.id === params.product) || products[0] || null);
  const previewProduct = buildProductPreviewModel(selectedProduct);
  const activeCount = products.filter((product) => product.status === 'active').length;
  const archivedCount = products.filter((product) => product.status === 'archived').length;
  const soldOutCount = products.filter((product) => product.status === 'active' && product.stockQuantity === 0).length;
  const orderFilter = parseOrderFilter(params.filter);
  const currentPage = parsePage(params.page);
  const filteredOrders = orders.filter((order) => matchesZollhausOrderFilter(order, orderFilter));
  const pageCount = Math.max(1, Math.ceil(filteredOrders.length / ZOLLHAUS_ADMIN_ORDER_PAGE_SIZE));
  const activePage = Math.min(currentPage, pageCount);
  const pagedOrders = filteredOrders.slice((activePage - 1) * ZOLLHAUS_ADMIN_ORDER_PAGE_SIZE, activePage * ZOLLHAUS_ADMIN_ORDER_PAGE_SIZE);
  const savedMessage = getSavedMessage(params.saved);

  return (
    <div className={adminStyles.adminPage}>
      <section className={styles.panel}>
        <div className={adminStyles.adminNav}>
          <div>
            <p className={styles.placeholderNote}>Zollhaus-Administration</p>
            <h2 className={styles.panelTitle}>Verwaltung und Vorschau</h2>
            <div className={adminStyles.roleLine}>Angemeldete Rolle: {session.role}</div>
          </div>

          <div className={adminStyles.adminNavLinks}>
            <a href="#produkte" className={adminStyles.anchorLink}>Produkte</a>
            <a href="#bestellungen" className={adminStyles.anchorLink}>Bestellungen</a>
            <a href="#shopvorschau" className={adminStyles.anchorLink}>Shopvorschau</a>
            <form action={logoutAction}>
              <button type="submit" className={adminStyles.secondaryButton}>Abmelden</button>
            </form>
          </div>
        </div>
      </section>

      {savedMessage ? <div className={adminStyles.noticeSuccess}>{savedMessage}</div> : null}
      {params.error ? <div className={adminStyles.noticeError}>{params.error}</div> : null}

      <section id="bestellungen" className={styles.panel}>
        <div className={adminStyles.toolbar}>
          <div>
            <p className={styles.placeholderNote}>Bestellverwaltung</p>
            <h2 className={styles.panelTitle}>Bestellübersicht</h2>
            <div className={styles.panelBody}>
              <p>Hier behalten Sie Bestellungen, Status und Versandstand im Blick.</p>
            </div>
          </div>
          <div className={adminStyles.summaryCard}>
            <span className={adminStyles.summaryLabel}>Aktueller Filter</span>
            <span className={adminStyles.summaryValue}>{ZOLLHAUS_ORDER_FILTERS.find((entry) => entry.value === orderFilter)?.label || 'Alle'}</span>
          </div>
        </div>

        <div className={adminStyles.filterList}>
          {ZOLLHAUS_ORDER_FILTERS.map((filterEntry) => (
            <Link
              key={filterEntry.value}
              href={buildAdminHref({ filter: filterEntry.value, product: selectedProduct?.id || undefined, isNew: params.new === '1' })}
              className={`${adminStyles.filterCard} ${orderFilter === filterEntry.value ? adminStyles.filterCardActive : ''}`}
            >
              <span className={adminStyles.filterTitle}>{filterEntry.label}</span>
              <span className={adminStyles.orderMeta}>{orders.filter((order) => matchesZollhausOrderFilter(order, filterEntry.value)).length} Einträge</span>
            </Link>
          ))}
        </div>

        {!firebaseConfigured ? (
          <div className={adminStyles.noticeWarning}>Ohne Firebase-Konfiguration oder lokale Zollhaus-Daten bleibt die Bestellverwaltung leer.</div>
        ) : null}
        {dataUnavailable ? (
          <div className={adminStyles.noticeWarning}>Die Zollhaus-Bestelldaten konnten gerade nicht geladen werden. Bitte Konfiguration und Berechtigungen prüfen.</div>
        ) : null}

        <div className={adminStyles.orderCardList}>
          {pagedOrders.length ? pagedOrders.map((order) => (
            <article key={`${order.id}-card`} className={adminStyles.orderCard}>
              <div className={adminStyles.orderCardHeader}>
                <div>
                  <h3 className={adminStyles.productTitle}>{order.orderNumber}</h3>
                  <div className={adminStyles.orderMeta}>{new Date(order.createdAt).toLocaleString('de-DE')}</div>
                </div>
                <Link href={`/zollhaus/admin/orders/${encodeURIComponent(order.id)}`} className={adminStyles.secondaryButton}>Öffnen</Link>
              </div>

              <div className={adminStyles.orderCardGrid}>
                <div className={adminStyles.detailCard}>
                  <div className={adminStyles.detailTerm}>Name</div>
                  <div className={adminStyles.detailValue}>{order.customer.firstName} {order.customer.lastName}</div>
                </div>
                <div className={adminStyles.detailCard}>
                  <div className={adminStyles.detailTerm}>Artikelanzahl</div>
                  <div className={adminStyles.detailValue}>{order.items.reduce((sum, item) => sum + item.quantity, 0)}</div>
                </div>
                <div className={adminStyles.detailCard}>
                  <div className={adminStyles.detailTerm}>Gesamtpreis</div>
                  <div className={adminStyles.detailValue}>{formatPriceCentsForDisplay(order.totalPriceCents)}</div>
                </div>
                <div className={adminStyles.detailCard}>
                  <div className={adminStyles.detailTerm}>Bestellstatus</div>
                  <div className={adminStyles.detailValue}>
                    <span className={`${adminStyles.statusBadge} ${getOrderStatusClassName(order.status)}`}>{getZollhausOrderStatusLabel(order.status)}</span>
                  </div>
                </div>
                <div className={adminStyles.detailCard}>
                  <div className={adminStyles.detailTerm}>E-Mail-Status</div>
                  <div className={adminStyles.detailValue}>
                    <span className={`${adminStyles.statusBadge} ${getEmailStatusClassName(order)}`}>{getZollhausOrderEmailStatusLabel(order.email.state)}</span>
                  </div>
                </div>
              </div>
            </article>
          )) : (
            <div className={styles.mutedCard}>Für den aktuellen Filter liegen noch keine Zollhaus-Bestellungen vor.</div>
          )}
        </div>

        <div className={adminStyles.orderTableWrap}>
          <table className={adminStyles.orderTable}>
            <thead>
              <tr>
                <th>Bestellnummer</th>
                <th>Bestelldatum</th>
                <th>Name</th>
                <th>Artikelanzahl</th>
                <th>Gesamtpreis</th>
                <th>Bestellstatus</th>
                <th>E-Mail-Status</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {pagedOrders.length ? pagedOrders.map((order) => (
                <tr key={order.id}>
                  <td>{order.orderNumber}</td>
                  <td>{new Date(order.createdAt).toLocaleString('de-DE')}</td>
                  <td>{order.customer.firstName} {order.customer.lastName}</td>
                  <td>{order.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
                  <td>{formatPriceCentsForDisplay(order.totalPriceCents)}</td>
                  <td>
                    <span className={`${adminStyles.statusBadge} ${getOrderStatusClassName(order.status)}`}>{getZollhausOrderStatusLabel(order.status)}</span>
                  </td>
                  <td>
                    <span className={`${adminStyles.statusBadge} ${getEmailStatusClassName(order)}`}>{getZollhausOrderEmailStatusLabel(order.email.state)}</span>
                  </td>
                  <td>
                    <Link href={`/zollhaus/admin/orders/${encodeURIComponent(order.id)}`} className={adminStyles.secondaryButton}>Öffnen</Link>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={8}>
                    <div className={styles.mutedCard}>Für den aktuellen Filter liegen noch keine Zollhaus-Bestellungen vor.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {pageCount > 1 ? (
          <div className={adminStyles.paginationRow}>
            {Array.from({ length: pageCount }, (_, index) => (
              <Link
                key={index + 1}
                href={buildAdminHref({ filter: orderFilter, page: index + 1, product: selectedProduct?.id || undefined, isNew: params.new === '1' })}
                className={index + 1 === activePage ? adminStyles.primaryButton : adminStyles.secondaryButton}
              >
                Seite {index + 1}
              </Link>
            ))}
          </div>
        ) : null}
      </section>

      <section id="produkte" className={styles.panel}>
        <div className={adminStyles.toolbar}>
          <div>
            <p className={styles.placeholderNote}>Produktverwaltung</p>
            <h2 className={styles.panelTitle}>Produktverwaltung</h2>
            <div className={styles.panelBody}>
              <p>Pflegen Sie hier die sichtbaren Artikel für den Zollhaus-Shop.</p>
              <p>Aktive Produkte erscheinen automatisch in der öffentlichen Shopansicht.</p>
            </div>
          </div>

          <div className={adminStyles.toolbarActions}>
            <Link href={buildAdminHref({ filter: orderFilter, page: activePage, isNew: true })} className={adminStyles.primaryButton}>
              Neues Produkt
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.panel}>
        <div className={adminStyles.stack}>
          <div>
            <p className={styles.placeholderNote}>Produktstatistik</p>
            <h2 className={styles.panelTitle}>Produktstatistik</h2>
          </div>

          <div className={adminStyles.summaryGrid}>
            <div className={adminStyles.summaryCard}>
              <span className={adminStyles.summaryLabel}>Produkte gesamt</span>
              <span className={adminStyles.summaryValue}>{products.length}</span>
            </div>
            <div className={adminStyles.summaryCard}>
              <span className={adminStyles.summaryLabel}>Aktiv</span>
              <span className={adminStyles.summaryValue}>{activeCount}</span>
            </div>
            <div className={adminStyles.summaryCard}>
              <span className={adminStyles.summaryLabel}>Archiviert / Ausverkauft</span>
              <span className={adminStyles.summaryValue}>{archivedCount + soldOutCount}</span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.panel}>
        <div className={adminStyles.toolbar}>
          <div>
            <p className={styles.placeholderNote}>Produktübersicht</p>
            <h2 className={styles.panelTitle}>Produktübersicht</h2>
            <div className={styles.panelBody}>
              <p>Alle angelegten Produkte, Bestände und Bilder auf einen Blick.</p>
            </div>
          </div>
        </div>

        <div className={adminStyles.productList}>
          {products.length ? (
            products.map((product) => (
              <article key={product.id} className={adminStyles.productCard}>
                <div className={adminStyles.productHeader}>
                  <div>
                    <h3 className={adminStyles.productTitle}>{product.name}</h3>
                    <p className={styles.panelBody}>{product.description}</p>
                  </div>
                  <span className={`${adminStyles.statusBadge} ${getStatusClassName(product)}`}>
                    {getZollhausProductDisplayStatus(product)}
                  </span>
                </div>

                <div className={adminStyles.metaGrid}>
                  <div className={adminStyles.metaItem}>
                    <span className={adminStyles.metaTitle}>Preis</span>
                    <span className={adminStyles.metaValue}>{formatPriceCentsForDisplay(product.priceCents)}</span>
                  </div>
                  <div className={adminStyles.metaItem}>
                    <span className={adminStyles.metaTitle}>Menge</span>
                    <span className={adminStyles.metaValue}>{product.stockQuantity}</span>
                  </div>
                  <div className={adminStyles.metaItem}>
                    <span className={adminStyles.metaTitle}>Bilder</span>
                    <span className={adminStyles.metaValue}>{product.images.length}</span>
                  </div>
                  <div className={adminStyles.metaItem}>
                    <span className={adminStyles.metaTitle}>Zuletzt geändert</span>
                    <span className={adminStyles.metaValue}>{new Date(product.updatedAt).toLocaleDateString('de-DE')}</span>
                  </div>
                </div>

                <div className={adminStyles.buttonRow}>
                  <Link href={buildAdminHref({ filter: orderFilter, page: activePage, product: product.id })} className={adminStyles.secondaryButton}>
                    Bearbeiten
                  </Link>
                </div>
              </article>
            ))
          ) : (
            <div className={styles.mutedCard}>Noch keine Zollhaus-Produkte vorhanden. Über „Neues Produkt“ kann der erste Datensatz angelegt werden.</div>
          )}
        </div>
      </section>

      <section className={styles.panel}>
        <div className={adminStyles.stack}>
          <div>
            <p className={styles.placeholderNote}>{selectedProduct ? 'Produkt bearbeiten' : 'Neues Produkt'}</p>
            <h2 className={styles.panelTitle}>{selectedProduct ? selectedProduct.name : 'Produkteditor'}</h2>
            <div className={styles.panelBody}>
              <p>Pflegen Sie hier Name, Beschreibung, Preis, Bestand und Bilder Ihres Produkts.</p>
              <p>Für eine öffentliche Darstellung wird mindestens ein Produktbild benötigt.</p>
            </div>
          </div>

          <form action={saveProductAction} className={adminStyles.editorLayout}>
                <input type="hidden" name="productId" value={selectedProduct?.id || ''} />

                <div className={adminStyles.fieldGrid}>
                  <div className={adminStyles.field}>
                    <label htmlFor="zollhaus-product-name" className={adminStyles.fieldLabel}>Produktname</label>
                    <input id="zollhaus-product-name" name="name" type="text" maxLength={140} defaultValue={selectedProduct?.name || ''} required />
                  </div>
                  <div className={adminStyles.field}>
                    <label htmlFor="zollhaus-product-price" className={adminStyles.fieldLabel}>Preis in Euro</label>
                    <input id="zollhaus-product-price" name="priceEuro" type="text" inputMode="decimal" placeholder="29,90" defaultValue={selectedProduct ? formatPriceCentsForInput(selectedProduct.priceCents) : ''} required />
                  </div>
                </div>

                <div className={adminStyles.inlineFieldGrid}>
                  <div className={adminStyles.field}>
                    <label htmlFor="zollhaus-product-stock" className={adminStyles.fieldLabel}>Verfügbare Menge</label>
                    <input id="zollhaus-product-stock" name="stockQuantity" type="number" min={0} step={1} defaultValue={selectedProduct?.stockQuantity ?? 0} required />
                  </div>
                  <div className={adminStyles.field}>
                    <span className={adminStyles.fieldLabel}>Status</span>
                    <div className={adminStyles.radioGroup}>
                      <label className={adminStyles.radioOption}>
                        <input type="radio" name="status" value="active" defaultChecked={!selectedProduct || selectedProduct.status === 'active'} />
                        Aktiv
                      </label>
                      <label className={adminStyles.radioOption}>
                        <input type="radio" name="status" value="archived" defaultChecked={selectedProduct?.status === 'archived'} />
                        Archiviert
                      </label>
                    </div>
                    <span className={adminStyles.fieldHint}>Bei Menge 0 zeigt die Vorschau automatisch „Ausverkauft“.</span>
                  </div>
                </div>

                <div className={adminStyles.field}>
                  <label htmlFor="zollhaus-product-description" className={adminStyles.fieldLabel}>Beschreibung</label>
                  <textarea id="zollhaus-product-description" name="description" maxLength={5000} defaultValue={selectedProduct?.description || ''} required />
                </div>

                <section className={adminStyles.stack}>
                  <div>
                    <h3 className={adminStyles.productTitle}>Produktbilder</h3>
                    <p className={styles.panelBody}>Erlaubt sind JPG, PNG und WEBP bis 5 MB.</p>
                  </div>

                  {selectedProduct?.images.length ? (
                    <div className={adminStyles.imageList}>
                      {selectedProduct.images.map((image, index) => (
                        <article key={image.id} className={adminStyles.imageCard}>
                          <div className={adminStyles.imagePreviewRow}>
                            <div className={adminStyles.imagePreview}>
                              <img src={image.url} alt={image.alt} />
                            </div>
                            <div className={adminStyles.stack}>
                              <div className={adminStyles.field}>
                                <label htmlFor={`image-alt-${image.id}`} className={adminStyles.fieldLabel}>Alternativtext</label>
                                <input id={`image-alt-${image.id}`} name={`imageAlt:${image.id}`} type="text" maxLength={240} defaultValue={image.alt} />
                              </div>
                              <div className={adminStyles.inlineFieldGrid}>
                                <div className={adminStyles.field}>
                                  <label htmlFor={`image-sort-${image.id}`} className={adminStyles.fieldLabel}>Reihenfolge</label>
                                  <input id={`image-sort-${image.id}`} name={`imageSort:${image.id}`} type="number" min={0} step={1} defaultValue={image.sortOrder ?? index} />
                                </div>
                                <div className={adminStyles.field}>
                                  <label htmlFor={`image-replace-${image.id}`} className={adminStyles.fieldLabel}>Bild ersetzen</label>
                                  <input id={`image-replace-${image.id}`} name={`imageReplace:${image.id}`} type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" />
                                </div>
                              </div>
                              <label className={adminStyles.checkboxOption}>
                                <input type="checkbox" name={`imageRemove:${image.id}`} />
                                Bild nach erfolgreichem Speichern entfernen
                              </label>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.mutedCard}>Noch keine Produktbilder vorhanden. Vor der Aktivierung muss mindestens ein Bild hochgeladen werden.</div>
                  )}

                  <div className={adminStyles.field}>
                    <label htmlFor="zollhaus-new-images" className={adminStyles.fieldLabel}>Neue Bilder hochladen</label>
                    <input id="zollhaus-new-images" name="newImages" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" multiple />
                    <span className={adminStyles.fieldHint}>Neue Bilder werden nach dem Speichern direkt dem Produkt zugeordnet.</span>
                  </div>

                  <div className={adminStyles.field}>
                    <label htmlFor="zollhaus-new-image-alts" className={adminStyles.fieldLabel}>Alternativtexte für neue Bilder</label>
                    <textarea
                      id="zollhaus-new-image-alts"
                      name="newImageAlts"
                      rows={4}
                      placeholder="Optional: ein Alternativtext pro neuem Bild, jeweils eine Zeile in derselben Reihenfolge wie die Auswahl."
                    />
                  </div>
                </section>

                <label className={adminStyles.checkboxOption}>
                  <input type="checkbox" name="archiveConfirmed" />
                  Archivierung bestaetigen, falls dieses Produkt auf „Archiviert“ gesetzt wird
                </label>

                <div className={adminStyles.buttonRow}>
                  <button type="submit" className={`${adminStyles.primaryButton} ${!firebaseConfigured || dataUnavailable ? adminStyles.buttonDisabled : ''}`}>
                    {selectedProduct ? 'Produkt speichern' : 'Produkt anlegen'}
                  </button>
                  {selectedProduct ? (
                    <Link href={buildAdminHref({ filter: orderFilter, page: activePage, isNew: true })} className={adminStyles.ghostButton}>
                      Neues Produktformular
                    </Link>
                  ) : null}
                </div>
          </form>

          {selectedProduct && selectedProduct.status !== 'archived' ? (
            <form action={archiveProductAction} className={adminStyles.stack}>
              <input type="hidden" name="productId" value={selectedProduct.id} />
              <label className={adminStyles.checkboxOption}>
                <input type="checkbox" name="archiveConfirmed" />
                Ja, dieses Produkt soll archiviert werden
              </label>
              <div className={adminStyles.buttonRow}>
                <button type="submit" className={`${adminStyles.dangerButton} ${!firebaseConfigured || dataUnavailable ? adminStyles.buttonDisabled : ''}`}>
                  Produkt archivieren
                </button>
              </div>
            </form>
          ) : null}

          <div className={styles.mutedCard}>
            <p>Pflichtfelder: Name, Beschreibung, Preis und verfügbare Menge.</p>
            <p>Aktive Produkte benötigen mindestens ein Bild. Produkte mit Bestand 0 erscheinen als ausverkauft.</p>
            <p>Produkte werden bei Bedarf archiviert und bleiben so nachvollziehbar.</p>
          </div>
        </div>
      </section>

      <section className={styles.panel}>
        <div className={adminStyles.stack}>
          <div>
            <p className={styles.placeholderNote}>Produktvorschau</p>
            <h2 className={styles.panelTitle}>Produktkartenvorschau</h2>
            <div className={styles.panelBody}>
              <p>Die Vorschau zeigt die aktuelle Produktkarte in der Desktop- und Mobilansicht.</p>
            </div>
          </div>

          <ProductPreviewSwitcher product={previewProduct} />
        </div>
      </section>

      <section id="shopvorschau" className={styles.panel}>
        <div className={adminStyles.stack}>
          <div>
            <p className={styles.placeholderNote}>Vollständige Shopvorschau</p>
            <h2 className={styles.panelTitle}>Öffentliche Zollhaus-Shopseite</h2>
            <div className={styles.panelBody}>
              <p>Die Vorschau zeigt die aktuelle öffentliche Darstellung des Shops direkt im Verwaltungsbereich.</p>
              <p>Zwischen Desktop, Tablet und Smartphone kann direkt umgeschaltet werden.</p>
            </div>
          </div>

          <ShopPreviewSwitcher>
            <ZollhausShopPageContent products={previewProducts} settings={previewSettings} />
          </ShopPreviewSwitcher>
        </div>
      </section>
    </div>
  );
}