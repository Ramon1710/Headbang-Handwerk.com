'use client';

import { useMemo, useState } from 'react';
import { ArrowLeft, FolderOpen, ImageIcon, X } from 'lucide-react';
import type { GalleryFolder } from '@/lib/cms/schema';

interface GalleryViewerProps {
  folders: GalleryFolder[];
  isAdmin?: boolean;
  initialFolderId?: string | null;
  addImagesAction?: (formData: FormData) => void | Promise<void>;
  removeImageAction?: (formData: FormData) => void | Promise<void>;
}

export function GalleryViewer({ folders, isAdmin = false, initialFolderId = null, addImagesAction, removeImageAction }: GalleryViewerProps) {
  const [activeFolderId, setActiveFolderId] = useState<string | null>(initialFolderId);
  const [activeImageUrl, setActiveImageUrl] = useState<string | null>(null);

  const activeFolder = useMemo(
    () => folders.find((folder) => folder.id === activeFolderId) || null,
    [activeFolderId, folders]
  );

  if (activeFolder) {
    return (
      <>
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button
              type="button"
              onClick={() => {
                setActiveFolderId(null);
                setActiveImageUrl(null);
              }}
              className="body-copy inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-black/20 px-4 py-2 text-sm transition hover:border-[color:var(--color-accent)] hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" /> Zurück zur Ordnerübersicht
            </button>
            <h2 className="section-title mt-4 text-[2rem]">{activeFolder.title}</h2>
            <p className="body-copy mt-2 text-sm">{activeFolder.images.length} Bilder in diesem Ordner.</p>
          </div>
          {isAdmin && addImagesAction ? (
            <form action={addImagesAction} className="w-full max-w-md rounded-[1.2rem] border border-white/10 bg-black/20 p-4 text-left">
              <input type="hidden" name="folderId" value={activeFolder.id} />
              <input type="hidden" name="returnToFolder" value={activeFolder.id} />
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-white">Weitere Bilder in diesen Ordner hochladen</span>
                <input
                  type="file"
                  name="imageFiles"
                  accept=".png,.jpg,.jpeg,.webp"
                  multiple
                  className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none transition file:mr-4 file:rounded-lg file:border-0 file:bg-[color:var(--color-accent)] file:px-4 file:py-2 file:font-semibold file:text-white focus:border-[color:var(--color-accent)]"
                />
              </label>
              <button type="submit" className="mt-4 w-full rounded-xl bg-[color:var(--color-accent)] px-5 py-3 text-sm font-black text-black transition hover:brightness-110">
                Bilder in Ordner hochladen
              </button>
            </form>
          ) : null}
        </div>

        {activeFolder.images.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {activeFolder.images.map((image) => (
              <button
                key={image.id}
                type="button"
                onClick={() => setActiveImageUrl(image.assetUrl)}
                className="group overflow-hidden rounded-[1.25rem] border border-white/10 bg-black/20 text-left shadow-[0_18px_36px_rgba(0,0,0,0.18)] transition hover:-translate-y-1 hover:border-[color:var(--color-accent)]"
              >
                <div className="aspect-square overflow-hidden bg-black/30">
                  <img src={image.assetUrl} alt={image.assetName || activeFolder.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                </div>
                <div className="flex items-center justify-between gap-3 px-4 py-3">
                  <p className="body-copy line-clamp-1 text-sm">{image.assetName || 'Bild anzeigen'}</p>
                  <ImageIcon className="h-4 w-4 text-[color:var(--color-accent-soft)]" />
                </div>
                {isAdmin && removeImageAction ? (
                  <div className="px-4 pb-4">
                    <form action={removeImageAction}>
                      <input type="hidden" name="folderId" value={activeFolder.id} />
                      <input type="hidden" name="imageId" value={image.id} />
                      <input type="hidden" name="returnToFolder" value={activeFolder.id} />
                      <button type="submit" className="w-full rounded-xl bg-red-500/15 px-4 py-3 text-sm font-black text-red-200 transition hover:bg-red-500/25">
                        Bild entfernen
                      </button>
                    </form>
                  </div>
                ) : null}
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-[1.4rem] border border-dashed border-[color:var(--color-border)] bg-black/15 px-6 py-8 text-left">
            <p className="body-copy text-sm">Dieser Ordner enthält noch keine Bilder.</p>
          </div>
        )}

        {activeImageUrl ? (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/88 px-4 py-6 backdrop-blur-sm">
            <div className="relative w-full max-w-6xl">
              <button
                type="button"
                onClick={() => setActiveImageUrl(null)}
                className="absolute right-4 top-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/45 text-white transition hover:border-[color:var(--color-accent)]"
                aria-label="Bild schließen"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="overflow-hidden rounded-[1.6rem] border border-white/10 bg-black shadow-[0_30px_80px_rgba(0,0,0,0.55)]">
                <img src={activeImageUrl} alt="Galeriebild in voller Größe" className="max-h-[85vh] w-full object-contain bg-black" />
              </div>
            </div>
          </div>
        ) : null}
      </>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {folders.map((folder) => {
        const preview = folder.coverImage.assetUrl || folder.images[0]?.assetUrl || '';

        return (
          <button
            key={folder.id}
            type="button"
            onClick={() => setActiveFolderId(folder.id)}
            className="group overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/20 text-left shadow-[0_20px_44px_rgba(0,0,0,0.18)] transition hover:-translate-y-1 hover:border-[color:var(--color-accent)]"
          >
            <div className="aspect-[4/3] overflow-hidden bg-[linear-gradient(180deg,rgba(26,17,11,0.95)_0%,rgba(10,7,5,0.9)_100%)]">
              {preview ? (
                <img src={preview} alt={folder.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
              ) : (
                <div className="flex h-full items-center justify-center text-[color:var(--color-accent-soft)]">
                  <FolderOpen className="h-12 w-12" />
                </div>
              )}
            </div>
            <div className="flex items-start justify-between gap-4 px-5 py-4">
              <div>
                <h3 className="text-xl font-black text-white">{folder.title}</h3>
                <p className="body-copy mt-2 text-sm">{folder.images.length} Bilder</p>
              </div>
              <FolderOpen className="mt-1 h-5 w-5 text-[color:var(--color-accent-soft)]" />
            </div>
          </button>
        );
      })}
    </div>
  );
}