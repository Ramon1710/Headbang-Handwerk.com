const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const JPEG_SIGNATURE = [0xff, 0xd8, 0xff];
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

export type ZollhausProductImageKind = 'jpg' | 'png' | 'webp';

export interface ValidatedZollhausProductImageUpload {
  bytes: Uint8Array;
  extension: ZollhausProductImageKind;
  contentType: 'image/jpeg' | 'image/png' | 'image/webp';
  sizeBytes: number;
}

function detectImageKind(bytes: Uint8Array): ZollhausProductImageKind | null {
  if (bytes.length >= JPEG_SIGNATURE.length && JPEG_SIGNATURE.every((value, index) => bytes[index] === value)) {
    return 'jpg';
  }

  if (bytes.length >= PNG_SIGNATURE.length && PNG_SIGNATURE.every((value, index) => bytes[index] === value)) {
    return 'png';
  }

  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
    String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
  ) {
    return 'webp';
  }

  return null;
}

function normalizeFileExtension(fileName: string): string {
  const cleaned = fileName.trim().toLowerCase();
  const lastDot = cleaned.lastIndexOf('.');

  if (lastDot < 0) {
    return '';
  }

  return cleaned.slice(lastDot + 1);
}

function normalizeExpectedKind(extension: string, contentType: string): ZollhausProductImageKind | null {
  const normalizedType = contentType.trim().toLowerCase();

  if (extension === 'jpg' || extension === 'jpeg' || normalizedType === 'image/jpeg' || normalizedType === 'image/jpg') {
    return 'jpg';
  }

  if (extension === 'png' || normalizedType === 'image/png') {
    return 'png';
  }

  if (extension === 'webp' || normalizedType === 'image/webp') {
    return 'webp';
  }

  return null;
}

function normalizeContentType(kind: ZollhausProductImageKind) {
  if (kind === 'jpg') {
    return 'image/jpeg' as const;
  }

  if (kind === 'png') {
    return 'image/png' as const;
  }

  return 'image/webp' as const;
}

export async function validateZollhausProductImageUpload(file: File): Promise<ValidatedZollhausProductImageUpload> {
  if (!(file instanceof File)) {
    throw new Error('Bitte ein Produktbild auswaehlen.');
  }

  const extension = normalizeFileExtension(file.name);
  const contentType = String(file.type || '').trim().toLowerCase();

  if (extension === 'svg' || contentType === 'image/svg+xml') {
    throw new Error('SVG-Dateien sind fuer Produktbilder nicht erlaubt.');
  }

  if (file.size <= 0) {
    throw new Error('Das ausgewaehlte Bild ist leer.');
  }

  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('Produktbilder duerfen maximal 5 MB gross sein.');
  }

  const expectedKind = normalizeExpectedKind(extension, contentType);

  if (!expectedKind) {
    throw new Error('Es sind nur JPG-, PNG- und WEBP-Bilder erlaubt.');
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const detectedKind = detectImageKind(bytes);

  if (!detectedKind) {
    throw new Error('Das Produktbild hat kein gueltiges Dateiformat.');
  }

  if (detectedKind !== expectedKind) {
    throw new Error('Dateiendung, MIME-Typ und Dateisignatur des Produktbilds passen nicht zusammen.');
  }

  return {
    bytes,
    extension: detectedKind,
    contentType: normalizeContentType(detectedKind),
    sizeBytes: file.size,
  };
}
