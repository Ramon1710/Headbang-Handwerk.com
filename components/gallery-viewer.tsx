'use client';

import { useMemo, useRef, useState } from 'react';
import { ArrowLeft, FolderOpen, X } from 'lucide-react';
import type { GalleryFolder } from '@/lib/cms/schema';

interface GalleryViewerProps {
  folders: GalleryFolder[];
  isAdmin?: boolean;
  initialFolderId?: string | null;
}

const MAX_UPLOAD_BYTES = 3.5 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 2200;

function replaceFileExtension(fileName: string, extension: string) {
  return fileName.replace(/[\r\n]/g, '').replace(/\.[^.]+$/, '') + extension;
}

async function loadImageBitmap(file: File) {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error('image-load'));
      element.src = objectUrl;
    });

    return image;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality?: number) {
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('image-upload'));
        return;
      }

      resolve(blob);
    }, mimeType, quality);
  });
}

async function compressImageForUpload(file: File) {
  if (!file.type.startsWith('image/')) {
    return file;
  }

  if (file.size <= MAX_UPLOAD_BYTES) {
    return file;
  }

  const image = await loadImageBitmap(file);
  const longestEdge = Math.max(image.naturalWidth, image.naturalHeight) || 1;
  const scale = Math.min(1, MAX_IMAGE_DIMENSION / longestEdge);
  let width = Math.max(1, Math.round(image.naturalWidth * scale));
  let height = Math.max(1, Math.round(image.naturalHeight * scale));

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('image-upload');
  }

  const qualities = [0.86, 0.78, 0.7, 0.6, 0.52];

  for (const quality of qualities) {
    canvas.width = width;
    canvas.height = height;
    context.clearRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    const blob = await canvasToBlob(canvas, 'image/jpeg', quality);

    if (blob.size <= MAX_UPLOAD_BYTES) {
      return new File([blob], replaceFileExtension(file.name, '.jpg'), { type: 'image/jpeg' });
    }

    width = Math.max(1, Math.round(width * 0.88));
    height = Math.max(1, Math.round(height * 0.88));
  }

  throw new Error('image-too-large');
}

export function GalleryViewer({ folders, isAdmin = false, initialFolderId = null }: GalleryViewerProps) {
  const [activeFolderId, setActiveFolderId] = useState<string | null>(initialFolderId);
  const [activeImageUrl, setActiveImageUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeFolder = useMemo(
    () => folders.find((folder) => folder.id === activeFolderId) || null,
    [activeFolderId, folders]
  );

  async function handleUploadSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!activeFolder || !fileInputRef.current) {
      return;
    }

    const files = Array.from(fileInputRef.current.files || []).filter((file) => file.size > 0);

    if (!files.length) {
      setUploadError('Bitte mindestens ein Bild auswählen.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const uploadedImages: Array<{ assetUrl: string; assetName: string; assetContentType: string }> = [];

      for (const file of files) {
        const compressedFile = await compressImageForUpload(file);
        const formData = new FormData();
        formData.set('folderId', activeFolder.id);
        formData.set('imageFile', compressedFile);

        const uploadResponse = await fetch('/api/cms/gallery/upload-image', {
          method: 'POST',
          body: formData,
        });

        const uploadPayload = (await uploadResponse.json()) as {
          redirectTo?: string;
          errorCode?: string;
          uploadedImage?: { assetUrl: string; assetName: string; assetContentType: string };
        };

        if (uploadPayload.redirectTo) {
          window.location.assign(uploadPayload.redirectTo);
          return;
        }

        if (!uploadResponse.ok || !uploadPayload.uploadedImage?.assetUrl) {
          throw new Error(uploadPayload.errorCode || 'image-upload');
        }

        uploadedImages.push(uploadPayload.uploadedImage);
      }

      const commitResponse = await fetch('/api/cms/gallery/add-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          folderId: activeFolder.id,
          returnToFolder: activeFolder.id,
          uploadedImages,
        }),
      });

      const commitPayload = (await commitResponse.json()) as {
        redirectTo?: string;
      };

      if (commitPayload.redirectTo) {
        window.location.assign(commitPayload.redirectTo);
        return;
      }

      throw new Error('image-upload');
    } catch (error) {
      const errorCode = error instanceof Error ? error.message : 'image-upload';
      setUploadError(
        errorCode === 'missing-config'
          ? 'Speichern ist ohne vollständige Firebase-Konfiguration nicht möglich.'
          : errorCode === 'invalid-firebase'
            ? 'Firebase ist gesetzt, aber ungültig formatiert.'
            : errorCode === 'image-upload-bucket'
              ? 'Der Firebase-Storage-Bucket wurde nicht gefunden.'
              : errorCode === 'image-upload-permission'
                ? 'Dem Service Account fehlen Rechte auf Firebase Storage.'
                : errorCode === 'image-too-large'
                  ? 'Das Bild ist auch nach Komprimierung noch zu groß. Bitte verkleinere es vor dem Upload.'
                : 'Das Bild konnte nicht hochgeladen werden.'
      );
    } finally {
      setIsUploading(false);
    }
  }

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
          {isAdmin ? (
            <form onSubmit={handleUploadSubmit} className="w-full max-w-md rounded-[1.2rem] border border-white/10 bg-black/20 p-4 text-left">
              <input type="hidden" name="folderId" value={activeFolder.id} />
              <input type="hidden" name="returnToFolder" value={activeFolder.id} />
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-white">Weitere Bilder in diesen Ordner hochladen</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  name="imageFiles"
                  accept=".png,.jpg,.jpeg,.webp"
                  multiple
                  className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none transition file:mr-4 file:rounded-lg file:border-0 file:bg-[color:var(--color-accent)] file:px-4 file:py-2 file:font-semibold file:text-white focus:border-[color:var(--color-accent)]"
                />
              </label>
              {uploadError ? <p className="mt-3 rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-200">{uploadError}</p> : null}
              <button type="submit" disabled={isUploading} className="mt-4 w-full rounded-xl bg-[color:var(--color-accent)] px-5 py-3 text-sm font-black text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60">
                {isUploading ? 'Lädt hoch...' : 'Bilder in Ordner hochladen'}
              </button>
            </form>
          ) : null}
        </div>

        {activeFolder.images.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {activeFolder.images.map((image) => (
              <div
                key={image.id}
                className="overflow-hidden rounded-[1.25rem] border border-white/10 bg-black/20 text-left shadow-[0_18px_36px_rgba(0,0,0,0.18)] transition hover:-translate-y-1 hover:border-[color:var(--color-accent)]"
              >
                <button type="button" onClick={() => setActiveImageUrl(image.assetUrl)} className="group block w-full text-left">
                  <div className="aspect-square overflow-hidden bg-black/30">
                    <img src={image.assetUrl} alt={image.assetName || activeFolder.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                  </div>
                </button>
                {isAdmin ? (
                  <div className="px-4 py-4">
                    <form action="/api/cms/gallery/remove-image" method="post">
                      <input type="hidden" name="folderId" value={activeFolder.id} />
                      <input type="hidden" name="imageId" value={image.id} />
                      <input type="hidden" name="returnToFolder" value={activeFolder.id} />
                      <button type="submit" className="w-full rounded-xl bg-red-500/15 px-4 py-3 text-sm font-black text-red-200 transition hover:bg-red-500/25">
                        Bild entfernen
                      </button>
                    </form>
                  </div>
                ) : null}
              </div>
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