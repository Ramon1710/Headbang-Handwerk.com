import type { Metadata } from 'next';
import { MerchandiseShop } from '@/components/merchandise-shop';
import { EditablePageShell } from '@/components/editable-page-shell';
import { isAdminAuthenticated } from '@/lib/cms/auth';
import { getCmsContent } from '@/lib/cms/storage';
import { MERCHANDISE_SUPPORT_TEXT } from '@/lib/merchandise';
import { addMerchandiseProductAction, removeMerchandiseProductAction, updateMerchandiseIntroAction, updateMerchandiseProductAction } from './actions';

export const metadata: Metadata = {
  title: 'Merchandise – Headbang Handwerk',
  description: 'Merchandise von Headbang Handwerk.',
};

export default async function MerchandisePage({
  searchParams,
}: {
  searchParams?: Promise<{ view?: string; adminSaved?: string; adminError?: string }>;
}) {
  const query = searchParams ? await searchParams : undefined;
  const cms = await getCmsContent();
  const isAuthenticatedAdmin = await isAdminAuthenticated();
  const isAdmin = isAuthenticatedAdmin && query?.view !== 'user';
  const merchandise = cms.site.merchandise;
  const adminErrorMessage =
    query?.adminError === 'missing-config'
      ? 'Speichern ist auf Vercel ohne Firebase nicht möglich. Prüfe FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY und für Datei-Uploads auch FIREBASE_STORAGE_BUCKET.'
      : query?.adminError === 'invalid-firebase'
        ? 'Firebase ist gesetzt, aber ungültig formatiert. Prüfe besonders FIREBASE_PRIVATE_KEY.'
        : query?.adminError === 'firebase-auth'
          ? 'Firebase lehnt das Speichern ab. Prüfe den Service-Account und seine Rechte.'
          : query?.adminError === 'image-upload-bucket'
            ? 'Das Merchandise-Bild konnte nicht hochgeladen werden, weil der Firebase-Storage-Bucket nicht gefunden wurde. Prüfe FIREBASE_STORAGE_BUCKET in Vercel.'
            : query?.adminError === 'image-upload-permission'
              ? 'Das Merchandise-Bild konnte nicht hochgeladen werden, weil dem Service Account Rechte auf Firebase Storage fehlen.'
              : query?.adminError === 'image-upload'
                ? 'Das Merchandise-Bild konnte nicht hochgeladen werden. Prüfe Firebase Storage und den Service Account.'
          : query?.adminError
            ? 'Aktion fehlgeschlagen. Bitte Eingaben prüfen.'
            : null;

  return (
    <EditablePageShell cms={cms} isAdmin={isAdmin} mainClassName="min-h-screen bg-transparent pt-28 pb-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {isAdmin ? (
          <section className="mb-10 rounded-[1.8rem] border border-[color:var(--color-border)]/70 bg-[linear-gradient(180deg,rgba(22,14,10,0.88)_0%,rgba(10,7,5,0.82)_100%)] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[color:var(--color-accent-soft)]">Admin Verwaltung</p>
                <h2 className="mt-2 text-2xl font-black text-white">Merchandise-Produkte und Shop-Texte verwalten</h2>
              </div>
              <div className="text-sm font-semibold">
                {query?.adminSaved ? <p className="rounded-xl border border-green-500/30 bg-green-950/40 px-4 py-3 text-green-200">Änderung gespeichert.</p> : null}
                {adminErrorMessage ? <p className="rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-red-200">{adminErrorMessage}</p> : null}
              </div>
            </div>

            <form action={updateMerchandiseIntroAction} className="mt-6 grid gap-4 rounded-[1.4rem] border border-white/8 bg-black/15 p-5 lg:grid-cols-2">
              <input name="eyebrow" defaultValue={merchandise.eyebrow} className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
              <input name="title" defaultValue={merchandise.title} className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
              <textarea name="lead" rows={3} defaultValue={merchandise.lead} className="lg:col-span-2 w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
              <div className="lg:col-span-2 flex justify-end">
                <button type="submit" className="rounded-xl bg-[color:var(--color-accent)] px-5 py-3 text-sm font-black text-black transition hover:brightness-110">Shop-Texte speichern</button>
              </div>
            </form>

            <form action={addMerchandiseProductAction} className="mt-6 grid gap-4 rounded-[1.4rem] border border-white/8 bg-black/15 p-5 lg:grid-cols-2">
              <input name="name" placeholder="Produktname" className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
              <input name="price" placeholder="Preis, z.B. 29" className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
              <input name="badge" placeholder="Badge, z.B. Neu" className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
              <input name="imageUrl" placeholder="Hauptbild-URL optional" className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
              <label className="block lg:col-span-2">
                <span className="mb-2 block text-sm font-semibold text-white">Hauptbild hochladen</span>
                <input
                  type="file"
                  name="imageFile"
                  accept=".png,.jpg,.jpeg,.webp"
                  className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none transition file:mr-4 file:rounded-lg file:border-0 file:bg-[color:var(--color-accent)] file:px-4 file:py-2 file:font-semibold file:text-white focus:border-[color:var(--color-accent)]"
                />
                <span className="mt-2 block text-xs text-[color:var(--color-muted)]">Dieses Bild wird immer zuerst angezeigt.</span>
              </label>
              <textarea name="galleryImageUrls" rows={3} placeholder="Weitere Bild-URLs, getrennt durch Komma oder Zeilenumbruch, max. 5" className="lg:col-span-2 w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
              <label className="block lg:col-span-2">
                <span className="mb-2 block text-sm font-semibold text-white">Weitere Bilder hochladen (max. 5)</span>
                <input
                  type="file"
                  name="galleryImageFiles"
                  accept=".png,.jpg,.jpeg,.webp"
                  multiple
                  className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none transition file:mr-4 file:rounded-lg file:border-0 file:bg-[color:var(--color-accent)] file:px-4 file:py-2 file:font-semibold file:text-white focus:border-[color:var(--color-accent)]"
                />
                <span className="mt-2 block text-xs text-[color:var(--color-muted)]">Zusätzlich zum Hauptbild können bis zu fünf weitere Produktbilder hinterlegt werden.</span>
              </label>
              <input name="sizes" placeholder="Größen, kommasepariert" className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
              <input name="colors" placeholder="Farben, kommasepariert" className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
              <input name="estimatedDeliveryTime" placeholder="Lieferzeit, z.B. 7 bis 10 Werktage" className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
              <input name="stripePriceId" placeholder="Stripe Price ID optional" className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
              <textarea name="description" rows={4} placeholder="Beschreibung" className="lg:col-span-2 w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
              <div className="lg:col-span-2 flex justify-end">
                <button type="submit" className="rounded-xl bg-[color:var(--color-accent)] px-5 py-3 text-sm font-black text-black transition hover:brightness-110">Produkt hinzufügen</button>
              </div>
            </form>
          </section>
        ) : null}

        <section className="section-shell content-box text-center sm:p-10 lg:p-12">
          <p className="body-copy text-sm font-semibold uppercase tracking-[0.28em]">{merchandise.eyebrow}</p>
          <h1 className="page-title mt-5">{merchandise.title}</h1>
          <p className="body-copy-lg mx-auto mt-6 max-w-3xl">
            {merchandise.lead}
          </p>
          <p className="body-copy mx-auto mt-5 max-w-4xl rounded-[1.2rem] border border-[color:var(--color-border)]/80 bg-black/20 px-5 py-4 text-left text-sm sm:text-center">
            {MERCHANDISE_SUPPORT_TEXT}
          </p>
          <MerchandiseShop products={merchandise.products} />
        </section>

        {isAdmin ? (
          <section className="mt-10 space-y-5">
            {merchandise.products.map((product) => (
              <div key={product.id} className="rounded-[1.4rem] border border-white/8 bg-black/10 p-5">
                <form action={updateMerchandiseProductAction} className="grid gap-3 md:grid-cols-2">
                  <input type="hidden" name="id" value={product.id} />
                  <input name="name" defaultValue={product.name} className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                  <input name="price" defaultValue={String(product.price)} className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                  <input name="badge" defaultValue={product.badge || ''} className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                  <input name="imageUrl" defaultValue={product.imageUrl || ''} className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" placeholder="Hauptbild-URL" />
                  <label className="block md:col-span-2">
                    <span className="mb-2 block text-sm font-semibold text-white">Neues Hauptbild hochladen</span>
                    <input
                      type="file"
                      name="imageFile"
                      accept=".png,.jpg,.jpeg,.webp"
                      className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none transition file:mr-4 file:rounded-lg file:border-0 file:bg-[color:var(--color-accent)] file:px-4 file:py-2 file:font-semibold file:text-white focus:border-[color:var(--color-accent)]"
                    />
                    {product.imageUrl ? <span className="mt-2 block text-xs text-[color:var(--color-muted)]">Aktuell ist bereits ein Hauptbild hinterlegt.</span> : null}
                  </label>
                  <textarea name="galleryImageUrls" rows={3} defaultValue={(product.galleryImageUrls || []).join(', ')} placeholder="Weitere Bild-URLs, getrennt durch Komma oder Zeilenumbruch, max. 5" className="md:col-span-2 w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                  <label className="block md:col-span-2">
                    <span className="mb-2 block text-sm font-semibold text-white">Weitere Bilder hochladen (max. 5)</span>
                    <input
                      type="file"
                      name="galleryImageFiles"
                      accept=".png,.jpg,.jpeg,.webp"
                      multiple
                      className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none transition file:mr-4 file:rounded-lg file:border-0 file:bg-[color:var(--color-accent)] file:px-4 file:py-2 file:font-semibold file:text-white focus:border-[color:var(--color-accent)]"
                    />
                    {(product.galleryImageUrls || []).length ? <span className="mt-2 block text-xs text-[color:var(--color-muted)]">Aktuell sind {(product.galleryImageUrls || []).length} zusätzliche Bilder hinterlegt.</span> : null}
                  </label>
                  <input name="sizes" defaultValue={(product.sizes || []).join(', ')} className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                  <input name="colors" defaultValue={(product.colors || []).join(', ')} className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                  <input name="estimatedDeliveryTime" defaultValue={product.estimatedDeliveryTime || ''} placeholder="Lieferzeit, z.B. 7 bis 10 Werktage" className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                  <input name="stripePriceId" defaultValue={product.stripePriceId || ''} placeholder="Stripe Price ID optional" className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                  <textarea name="description" rows={4} defaultValue={product.description} className="md:col-span-2 w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                  <div className="md:col-span-2 flex flex-wrap gap-3">
                    <button type="submit" className="rounded-xl border border-[color:var(--color-accent)]/50 px-4 py-3 text-sm font-black text-[color:var(--color-accent-soft)] transition hover:border-[color:var(--color-accent)] hover:text-white">Speichern</button>
                  </div>
                </form>
                <div className="mt-3 flex flex-wrap gap-3">
                  <form action={removeMerchandiseProductAction}>
                    <input type="hidden" name="id" value={product.id} />
                    <button type="submit" className="rounded-xl bg-red-500/15 px-4 py-3 text-sm font-black text-red-200 transition hover:bg-red-500/25">Entfernen</button>
                  </form>
                </div>
              </div>
            ))}
          </section>
        ) : null}
      </div>
    </EditablePageShell>
  );
}