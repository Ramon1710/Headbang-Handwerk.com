import type { Metadata } from 'next';
import { EditablePageShell } from '@/components/editable-page-shell';
import { GalleryViewer } from '@/components/gallery-viewer';
import { LiveEditableText } from '@/components/live-editable-text';
import { LiveResizableBox } from '@/components/live-resizable-box';
import { isAdminAuthenticated } from '@/lib/cms/auth';
import { resolveLiveBoxStyle, resolveLiveHtml } from '@/lib/cms/live-editor';
import { getCmsContent } from '@/lib/cms/storage';
import {
  addGalleryFolderAction,
  addGalleryImagesAction,
  removeGalleryFolderAction,
  removeGalleryImageAction,
  updateGalleryFolderAction,
} from './actions';

export const metadata: Metadata = {
  title: 'Galerie – Headbang Handwerk',
  description: 'Bildgallerie von Headbang Handwerk mit Ordnern, Veranstaltungsbildern und Projektfotos.',
};

export default async function GalleryPage({
  searchParams,
}: {
  searchParams?: Promise<{ view?: string; adminSaved?: string; adminError?: string; folder?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const cms = await getCmsContent();
  const isAuthenticatedAdmin = await isAdminAuthenticated();
  const isAdmin = isAuthenticatedAdmin && params?.view !== 'user';
  const gallery = cms.site.gallery;
  const liveEditor = cms.site.liveEditor;
  const initialFolderId = params?.folder && gallery.folders.some((folder) => folder.id === params.folder) ? params.folder : null;
  const adminErrorMessage =
    params?.adminError === 'missing-config'
      ? 'Speichern ist ohne vollständige Firebase-Konfiguration nicht möglich. Prüfe FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY und FIREBASE_STORAGE_BUCKET.'
      : params?.adminError === 'invalid-firebase'
        ? 'Firebase ist gesetzt, aber ungültig formatiert. Prüfe besonders FIREBASE_PRIVATE_KEY.'
        : params?.adminError === 'firebase-auth'
          ? 'Firebase lehnt das Speichern ab. Prüfe den Service-Account und seine Rechte.'
          : params?.adminError === 'image-upload-bucket'
            ? 'Das Bild konnte nicht hochgeladen werden, weil der Firebase-Storage-Bucket nicht gefunden wurde. Prüfe FIREBASE_STORAGE_BUCKET.'
            : params?.adminError === 'image-upload-permission'
              ? 'Das Bild konnte nicht hochgeladen werden, weil dem Service Account Rechte auf Firebase Storage fehlen.'
              : params?.adminError === 'image-upload'
                ? 'Das Bild konnte nicht hochgeladen werden. Prüfe Firebase Storage und den Service Account.'
                : params?.adminError === 'missing-title'
                  ? 'Bitte einen Titel für den Ordner angeben.'
                  : params?.adminError
                    ? 'Aktion fehlgeschlagen. Bitte Eingaben prüfen.'
                    : null;

  return (
    <EditablePageShell cms={cms} isAdmin={isAdmin} mainClassName="min-h-screen bg-transparent pt-28 pb-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {isAdmin ? (
          <section className="mb-10 rounded-[1.8rem] border border-[color:var(--color-border)]/70 bg-[linear-gradient(180deg,rgba(22,14,10,0.88)_0%,rgba(10,7,5,0.82)_100%)] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[color:var(--color-accent-soft)]">Admin Verwaltung</p>
                <h2 className="mt-2 text-2xl font-black text-white">Galerie-Ordner und Bilder verwalten</h2>
                <p className="mt-2 max-w-3xl text-sm leading-7 text-[color:var(--color-muted)]">Lege Ordner an, hinterlege ein Titelbild und lade mehrere Bilder direkt in Firebase hoch.</p>
              </div>
              <div className="text-sm font-semibold">
                {params?.adminSaved ? <p className="rounded-xl border border-green-500/30 bg-green-950/40 px-4 py-3 text-green-200">Änderung gespeichert.</p> : null}
                {adminErrorMessage ? <p className="rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-red-200">{adminErrorMessage}</p> : null}
              </div>
            </div>

            <form action={addGalleryFolderAction} className="mt-6 grid gap-4 rounded-[1.4rem] border border-white/8 bg-black/15 p-5 lg:grid-cols-2">
              <input name="title" placeholder="Ordnertitel" className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
              <input name="id" placeholder="Optionale Ordner-ID" className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
              <label className="block lg:col-span-2">
                <span className="mb-2 block text-sm font-semibold text-white">Titelbild für den Ordner</span>
                <input
                  type="file"
                  name="coverImageFile"
                  accept=".png,.jpg,.jpeg,.webp"
                  className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none transition file:mr-4 file:rounded-lg file:border-0 file:bg-[color:var(--color-accent)] file:px-4 file:py-2 file:font-semibold file:text-white focus:border-[color:var(--color-accent)]"
                />
              </label>
              <div className="lg:col-span-2 flex justify-end">
                <button type="submit" className="rounded-xl bg-[color:var(--color-accent)] px-5 py-3 text-sm font-black text-black transition hover:brightness-110">Ordner hinzufügen</button>
              </div>
            </form>

            <div className="mt-6 space-y-5">
              {gallery.folders.map((folder) => (
                <div key={folder.id} className="rounded-[1.4rem] border border-white/8 bg-black/10 p-5">
                  <div className="grid gap-5 xl:grid-cols-[1fr_auto] xl:items-end">
                    <form action={updateGalleryFolderAction} className="grid gap-3 md:grid-cols-2">
                      <input type="hidden" name="id" value={folder.id} />
                      <input name="title" defaultValue={folder.title} className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                      <div className="rounded-xl border border-[color:var(--color-border)]/70 bg-black/15 px-4 py-3 text-sm text-[color:var(--color-muted)]">Ordner-ID: {folder.id}</div>
                      <label className="block md:col-span-2">
                        <span className="mb-2 block text-sm font-semibold text-white">Neues Titelbild hochladen</span>
                        <input
                          type="file"
                          name="coverImageFile"
                          accept=".png,.jpg,.jpeg,.webp"
                          className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none transition file:mr-4 file:rounded-lg file:border-0 file:bg-[color:var(--color-accent)] file:px-4 file:py-2 file:font-semibold file:text-white focus:border-[color:var(--color-accent)]"
                        />
                      </label>
                      <label className="md:col-span-2 flex items-center gap-3 rounded-xl border border-[color:var(--color-border)]/70 bg-black/10 px-4 py-3 text-sm text-white">
                        <input type="checkbox" name="removeCoverImage" className="h-4 w-4 rounded border-[color:var(--color-border)] bg-black/20" />
                        Titelbild beim Speichern entfernen
                      </label>
                      <div className="md:col-span-2 flex flex-wrap gap-3">
                        <button type="submit" className="rounded-xl border border-[color:var(--color-accent)]/50 px-4 py-3 text-sm font-black text-[color:var(--color-accent-soft)] transition hover:border-[color:var(--color-accent)] hover:text-white">Ordner speichern</button>
                      </div>
                    </form>
                    <div className="rounded-xl border border-[color:var(--color-border)]/70 bg-black/15 px-4 py-3 text-sm text-[color:var(--color-muted)] xl:min-w-64">
                      Bilder verwaltest du direkt unten in der geöffneten Ordneransicht.
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <form action={removeGalleryFolderAction}>
                      <input type="hidden" name="id" value={folder.id} />
                      <button type="submit" className="rounded-xl bg-red-500/15 px-4 py-3 text-sm font-black text-red-200 transition hover:bg-red-500/25">Ordner entfernen</button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="section-shell content-box text-center sm:p-10 lg:p-12">
          <LiveResizableBox boxKey="gallery.intro.box" initialStyle={resolveLiveBoxStyle(liveEditor, 'gallery.intro.box')} isAdmin={isAdmin} className="copy-center content-flow mx-auto max-w-5xl">
            <p className="body-copy text-sm font-semibold uppercase tracking-[0.28em]">
              <LiveEditableText as="span" className="inline" editorKey="gallery.eyebrow" initialHtml={resolveLiveHtml(liveEditor, 'gallery.eyebrow', gallery.eyebrow)} isAdmin={isAdmin} title="Gallerie Eyebrow" />
            </p>
            <h1 className="page-title mt-5">
              <LiveEditableText as="span" className="inline" editorKey="gallery.title" initialHtml={resolveLiveHtml(liveEditor, 'gallery.title', gallery.title)} isAdmin={isAdmin} title="Galerie Titel" />
            </h1>
            <LiveEditableText as="p" className="body-copy-lg mx-auto mt-6 max-w-3xl" editorKey="gallery.lead" initialHtml={resolveLiveHtml(liveEditor, 'gallery.lead', gallery.lead)} isAdmin={isAdmin} title="Galerie Einleitung" />
          </LiveResizableBox>
          <div className="mt-12">
            {gallery.folders.length ? (
              <GalleryViewer folders={gallery.folders} isAdmin={isAdmin} initialFolderId={initialFolderId} addImagesAction={addGalleryImagesAction} removeImageAction={removeGalleryImageAction} />
            ) : (
              <div className="rounded-[1.4rem] border border-dashed border-[color:var(--color-border)] bg-black/15 px-6 py-10 text-left sm:text-center">
                <p className="body-copy text-sm">Noch keine Galerie-Ordner vorhanden. {isAdmin ? 'Lege oben den ersten Ordner an und lade anschließend Bilder hoch.' : 'Schau bald wieder vorbei.'}</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </EditablePageShell>
  );
}