import type { Event } from '@/lib/types';

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const BERLIN_TIME_ZONE = 'Europe/Berlin';

export const EVENT_IMAGE_MAX_UPLOAD_BYTES = 3.5 * 1024 * 1024;

const EVENT_IMAGE_CONTENT_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const EVENT_IMAGE_FILE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

export type EventStatus = Event['status'];

export function isEventStatus(value: string): value is EventStatus {
  return value === 'planned' || value === 'confirmed' || value === 'completed' || value === 'cancelled';
}

export function normalizeEventStatus(value: unknown, fallback: EventStatus = 'planned'): EventStatus {
  const candidate = String(value ?? '').trim();
  return isEventStatus(candidate) ? candidate : fallback;
}

export function isValidIsoDateString(value: string) {
  if (!ISO_DATE_PATTERN.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map((part) => Number.parseInt(part, 10));
  const utcDate = new Date(Date.UTC(year, month - 1, day));

  return (
    Number.isFinite(year) &&
    Number.isFinite(month) &&
    Number.isFinite(day) &&
    utcDate.getUTCFullYear() === year &&
    utcDate.getUTCMonth() === month - 1 &&
    utcDate.getUTCDate() === day
  );
}

export function normalizeStructuredEventDate(value: unknown) {
  const candidate = String(value ?? '').trim();

  if (!candidate || !isValidIsoDateString(candidate)) {
    return undefined;
  }

  return candidate;
}

export function getBerlinTodayDateString(now = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: BERLIN_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = formatter.formatToParts(now);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  if (!year || !month || !day) {
    throw new Error('Berlin-Datum konnte nicht bestimmt werden.');
  }

  return `${year}-${month}-${day}`;
}

export function getEffectiveEventEndDate(event: Pick<Event, 'startDate' | 'endDate'>) {
  return event.endDate || event.startDate;
}

function compareEventIdentity(left: Event, right: Event) {
  const titleComparison = left.title.localeCompare(right.title, 'de');

  if (titleComparison !== 0) {
    return titleComparison;
  }

  return left.id.localeCompare(right.id, 'de');
}

export function getUpcomingEvents(
  events: Event[],
  options?: { limit?: number; referenceDate?: string }
) {
  const referenceDate = normalizeStructuredEventDate(options?.referenceDate) || getBerlinTodayDateString();
  const limit = Math.max(1, options?.limit ?? 3);

  return events
    .map((event, index) => ({ event, index }))
    .filter(({ event }) => {
      if (!event.startDate || !isValidIsoDateString(event.startDate)) {
        return false;
      }

      if (event.status === 'cancelled') {
        return false;
      }

      const effectiveEndDate = getEffectiveEventEndDate(event);

      if (!effectiveEndDate || !isValidIsoDateString(effectiveEndDate)) {
        return false;
      }

      return effectiveEndDate >= referenceDate;
    })
    .sort((left, right) => {
      if (left.event.startDate !== right.event.startDate) {
        return left.event.startDate!.localeCompare(right.event.startDate!);
      }

      const leftEndDate = getEffectiveEventEndDate(left.event) || left.event.startDate!;
      const rightEndDate = getEffectiveEventEndDate(right.event) || right.event.startDate!;

      if (leftEndDate !== rightEndDate) {
        return leftEndDate.localeCompare(rightEndDate);
      }

      const identityComparison = compareEventIdentity(left.event, right.event);

      if (identityComparison !== 0) {
        return identityComparison;
      }

      return left.index - right.index;
    })
    .slice(0, limit)
    .map(({ event }) => event);
}

export function validateStructuredEventDates(startDate: string, endDate: string) {
  if (!startDate) {
    return 'Das Startdatum ist erforderlich.';
  }

  if (!isValidIsoDateString(startDate)) {
    return 'Das Startdatum muss ein gueltiges Datum im Format JJJJ-MM-TT sein.';
  }

  if (!endDate) {
    return null;
  }

  if (!isValidIsoDateString(endDate)) {
    return 'Das Enddatum muss leer bleiben oder ein gueltiges Datum im Format JJJJ-MM-TT sein.';
  }

  if (endDate < startDate) {
    return 'Das Enddatum darf nicht vor dem Startdatum liegen.';
  }

  return null;
}

export function validateOptionalStructuredEventDates(startDate: string, endDate: string) {
  if (!startDate) {
    return null;
  }

  return validateStructuredEventDates(startDate, endDate);
}

export function validateEventImageFile(file: File) {
  const lowerFileName = file.name.toLowerCase();
  const hasAllowedExtension = EVENT_IMAGE_FILE_EXTENSIONS.some((extension) => lowerFileName.endsWith(extension));
  const hasAllowedContentType = !file.type || EVENT_IMAGE_CONTENT_TYPES.has(file.type);

  if (!hasAllowedExtension || !hasAllowedContentType) {
    return 'Bitte nur PNG, JPG oder WEBP als Veranstaltungsbild hochladen.';
  }

  if (file.size > EVENT_IMAGE_MAX_UPLOAD_BYTES) {
    return 'Das Veranstaltungsbild ist zu gross. Erlaubt sind maximal 3,5 MB.';
  }

  return null;
}