import Link from 'next/link';
import { deleteProductAction, logoutAction, saveProductAction } from './actions';
import { hasFirebaseConfig } from '@/lib/cms/firebase';
import { requireZollhausAccess } from '@/lib/cms/auth';
import { ShopPreviewSwitcher } from '@/components/zollhaus/shop-preview-switcher';
import { ZollhausShopPageContent } from '@/components/zollhaus/shop-page-content';
import { formatPriceCentsForDisplay, formatPriceCentsForInput, getZollhausProductDisplayStatus } from '@/lib/zollhaus/product-admin';
import { listPublicZollhausProducts } from '@/lib/zollhaus/public-catalog';
import { listZollhausProducts } from '@/lib/zollhaus/products';
import { getResolvedZollhausShopSettings } from '@/lib/zollhaus/settings';
import { zollhausShellStyles as styles } from '@/components/zollhaus/zollhaus-shell';
import adminStyles from '@/components/zollhaus/product-admin.module.css';
import type { ZollhausProduct } from '@/lib/zollhaus/types';

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

  if (saved === 'deleted') {
    return 'Produkt geloescht.';
  }

  return null;
}

function buildAdminHref(params: { product?: string; isNew?: boolean }) {
  const search = new URLSearchParams();

  if (params.product) {
    search.set('product', params.product);
  }

  if (params.isNew) {
    search.set('new', '1');
  }

  const query = search.toString();
  return query ? `/zollhaus/admin?${query}` : '/zollhaus/admin';
}

export default async function ZollhausAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string; new?: string; saved?: string; error?: string }>;
}) {
  const session = await requireZollhausAccess('/zollhaus/admin');
  const params = await searchParams;
  const firebaseConfigured = hasFirebaseConfig();
  let products: ZollhausProduct[] = [];
  let previewProducts = [] as Awaited<ReturnType<typeof listPublicZollhausProducts>>;
  let previewSettings = await getResolvedZollhausShopSettings();
  let dataUnavailable = false;

  try {
    [previewProducts, previewSettings] = await Promise.all([
      listPublicZollhausProducts(),
      getResolvedZollhausShopSettings(),
    ]);
  } catch {
    dataUnavailable = true;
  }

  if (firebaseConfigured) {
    try {
      products = await listZollhausProducts();
    } catch {
      dataUnavailable = true;
    }
  }

  const selectedProduct = params.new === '1'
    ? null
    : (products.find((product) => product.id === params.product) || products[0] || null);
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
            <a href="#shopvorschau" className={adminStyles.anchorLink}>Shopvorschau</a>
            <form action={logoutAction}>
              <button type="submit" className={adminStyles.secondaryButton}>Abmelden</button>
            </form>
          </div>
        </div>
      </section>

      {savedMessage ? <div className={adminStyles.noticeSuccess}>{savedMessage}</div> : null}
      {params.error ? <div className={adminStyles.noticeError}>{params.error}</div> : null}

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
            <Link href={buildAdminHref({ isNew: true })} className={adminStyles.primaryButton}>
              Neues Produkt
            </Link>
          </div>
        </div>
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
                  <Link href={buildAdminHref({ product: product.id })} className={adminStyles.secondaryButton}>
                    Bearbeiten
                  </Link>
                  {product.stockQuantity === 0 ? (
                    <form action={deleteProductAction}>
                      <input type="hidden" name="productId" value={product.id} />
                      <button type="submit" className={adminStyles.dangerButton}>Produkt löschen</button>
                    </form>
                  ) : null}
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
                    <span className={adminStyles.fieldLabel}>Hinweis</span>
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
                    <p className={styles.panelBody}>Erlaubt sind JPG, PNG und WEBP bis 5 MB. Pro Artikel sind maximal 5 Bilder moeglich.</p>
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
                    <span className={adminStyles.fieldHint}>Sie koennen bis zu 5 Bilder pro Artikel auswaehlen und nach dem Speichern direkt zuordnen.</span>
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

                <div className={adminStyles.buttonRow}>
                  <button type="submit" className={`${adminStyles.primaryButton} ${!firebaseConfigured || dataUnavailable ? adminStyles.buttonDisabled : ''}`}>
                    {selectedProduct ? 'Produkt speichern' : 'Produkt anlegen'}
                  </button>
                  {selectedProduct ? (
                    <Link href={buildAdminHref({ isNew: true })} className={adminStyles.ghostButton}>
                      Neues Produktformular
                    </Link>
                  ) : null}
                </div>
          </form>

          <div className={styles.mutedCard}>
            <p>Pflichtfelder: Name, Beschreibung, Preis und verfügbare Menge.</p>
            <p>Jedes Produkt benötigt mindestens ein Bild und kann maximal 5 Bilder enthalten.</p>
            <p>Produkte mit Bestand 0 erscheinen als ausverkauft und koennen bei Bedarf geloescht oder wieder auf Bestand gesetzt werden.</p>
          </div>
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