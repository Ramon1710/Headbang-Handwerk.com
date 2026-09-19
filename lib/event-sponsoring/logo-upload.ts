const MAX_LOGO_BYTES = 5 * 1024 * 1024;
const JPEG_SIGNATURE = [0xff, 0xd8, 0xff];
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const PDF_SIGNATURE = [0x25, 0x50, 0x44, 0x46, 0x2d];

export type EventSponsoringLogoFileKind = 'jpg' | 'png' | 'webp' | 'pdf';

export interface ValidatedEventSponsoringLogoUpload {
  bytes: Uint8Array;
  extension: EventSponsoringLogoFileKind;
  contentType: 'image/jpeg' | 'image/png' | 'image/webp' | 'application/pdf';
  sizeBytes: number;
}

export function sanitizeEventSponsoringLogoFileName(fileName: string) {
  const trimmed = fileName.trim().replace(/[\r\n]+/g, ' ');
  const baseName = trimmed.split(/[\\/]/).pop() || '';
  const normalized = baseName
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9._ -]+/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/-+/g, '-')
    .trim()
    .slice(0, 180);

  return normalized || 'sponsoring-logo';
}

function detectLogoKind(bytes: Uint8Array): EventSponsoringLogoFileKind | null {
  if (bytes.length >= JPEG_SIGNATURE.length && JPEG_SIGNATURE.every((value, index) => bytes[index] === value)) {
    return 'jpg';
  }

  if (bytes.length >= PNG_SIGNATURE.length && PNG_SIGNATURE.every((value, index) => bytes[index] === value)) {
    return 'png';
  }

  if (
    bytes.length >= 12
    && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF'
    && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
  ) {
    return 'webp';
  }

  if (bytes.length >= PDF_SIGNATURE.length && PDF_SIGNATURE.every((value, index) => bytes[index] === value)) {
    return 'pdf';
  }

  return null;
}

function normalizeFileExtension(fileName: string) {
  const cleaned = fileName.trim().toLowerCase();
  const lastDot = cleaned.lastIndexOf('.');

  if (lastDot < 0) {
    return '';
  }

  return cleaned.slice(lastDot + 1);
}

function normalizeExpectedKind(extension: string, contentType: string): EventSponsoringLogoFileKind | null {
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

  if (extension === 'pdf' || normalizedType === 'application/pdf') {
    return 'pdf';
  }

  return null;
}

function normalizeContentType(kind: EventSponsoringLogoFileKind) {
  if (kind === 'jpg') {
    return 'image/jpeg' as const;
  }

  if (kind === 'png') {
    return 'image/png' as const;
  }

  if (kind === 'webp') {
    return 'image/webp' as const;
  }

  return 'application/pdf' as const;
}

export async function validateEventSponsoringLogoUpload(file: File): Promise<ValidatedEventSponsoringLogoUpload> {
  if (!(file instanceof File)) {
    throw new Error('Bitte eine Logo-Datei auswählen.');
  }

  const extension = normalizeFileExtension(file.name);
  const contentType = String(file.type || '').trim().toLowerCase();

  if (extension === 'svg' || contentType === 'image/svg+xml') {
    throw new Error('SVG-Dateien sind fuer Sponsoring-Logos nicht erlaubt.');
  }

  if (file.size <= 0) {
    throw new Error('Die ausgewaehlte Datei ist leer.');
  }

  if (file.size > MAX_LOGO_BYTES) {
    throw new Error('Logo-Dateien duerfen maximal 5 MB gross sein.');
  }

  const expectedKind = normalizeExpectedKind(extension, contentType);

  if (!expectedKind) {
    throw new Error('Es sind nur PNG, JPG, WEBP oder PDF erlaubt.');
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const detectedKind = detectLogoKind(bytes);

  if (!detectedKind) {
    throw new Error('Die Datei hat kein gueltiges Logo-Format.');
  }

  if (detectedKind !== expectedKind) {
    throw new Error('Dateiendung, MIME-Typ und Dateisignatur der Logo-Datei passen nicht zusammen.');
  }

  return {
    bytes,
    extension: detectedKind,
    contentType: normalizeContentType(detectedKind),
    sizeBytes: file.size,
  };
}