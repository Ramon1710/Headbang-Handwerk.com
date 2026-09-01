'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/cms/auth';
import {
  isFirebaseStorageBucketNotFoundError,
  isFirebaseStoragePermissionError,
  isFirebaseStorageUploadError,
  uploadCmsAsset,
} from '@/lib/cms/file-storage';
import { hasFirebaseConfig, isFirebaseAuthError, isInvalidFirebaseConfigError } from '@/lib/cms/firebase';
import { getCmsContent, saveCmsContent } from '@/lib/cms/storage';
import {
  normalizeStructuredEventDate,
  normalizeEventStatus,
  validateEventImageFile,
  validateOptionalStructuredEventDates,
  validateStructuredEventDates,
} from '@/lib/events';
import { createDefaultEventStandConfig, normalizeEvent, parseBannerSlots } from '@/lib/event-stand';
import { resolveEventCtaUrl } from '@/lib/site';
import type { Event } from '@/lib/types';

function sanitizeText(value: FormDataEntryValue | null) {
  return String(value || '').trim();
}

function redirectWithAdminError(message: string): never {
  redirect(`/veranstaltungen?adminError=${encodeURIComponent(message)}`);
}

function redirectForUploadError(error: unknown): never {
  if (isInvalidFirebaseConfigError(error)) {
    redirectWithAdminError('Firebase ist fuer Bild-Uploads ungueltig konfiguriert. Bitte besonders FIREBASE_PRIVATE_KEY und FIREBASE_STORAGE_BUCKET pruefen.');
  }

  if (isFirebaseStorageBucketNotFoundError(error)) {
    redirectWithAdminError('Der Firebase-Storage-Bucket fuer Veranstaltungsbilder wurde nicht gefunden.');
  }

  if (isFirebaseStoragePermissionError(error)) {
    redirectWithAdminError('Dem Firebase-Service-Account fehlen Schreibrechte fuer Veranstaltungsbilder.');
  }

  if (isFirebaseStorageUploadError(error) || isFirebaseAuthError(error)) {
    redirectWithAdminError('Das Veranstaltungsbild konnte nicht hochgeladen werden. Bitte Firebase Storage pruefen.');
  }

  throw error;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function ensureEventId(events: Event[], requestedId: string, title: string) {
  const base = slugify(requestedId || title || `event-${Date.now()}`) || `event-${Date.now()}`;

  if (!events.some((event) => event.id === base)) {
    return base;
  }

  let counter = 2;
  let nextId = `${base}-${counter}`;

  while (events.some((event) => event.id === nextId)) {
    counter += 1;
    nextId = `${base}-${counter}`;
  }

  return nextId;
}

async function applyEventImageFromFormData(formData: FormData, event: Event, existingEvent?: Event) {
  const removeImage = String(formData.get('removeImage') || '') === 'on';
  const imageFile = formData.get('imageFile');

  if (removeImage) {
    event.imageUrl = undefined;
    event.imageAlt = undefined;
  }

  if (!(imageFile instanceof File) || imageFile.size <= 0) {
    return event;
  }

  const fileError = validateEventImageFile(imageFile);

  if (fileError) {
    redirectWithAdminError(fileError);
  }

  if (!hasFirebaseConfig()) {
    redirectWithAdminError('Fuer Veranstaltungsbilder fehlt aktuell die Firebase-Konfiguration.');
  }

  try {
    const uploadedAsset = await uploadCmsAsset(imageFile, 'events', 'veranstaltungsbild');
    event.imageUrl = uploadedAsset.url;
    event.imageAlt = sanitizeText(formData.get('imageAlt')) || existingEvent?.imageAlt || event.title;
  } catch (error) {
    redirectForUploadError(error);
  }

  return event;
}

function parseEventFromFormData(formData: FormData, existingId?: string, existingEvent?: Event): Event {
  const title = sanitizeText(formData.get('title'));
  const date = sanitizeText(formData.get('date'));
  const startDate = sanitizeText(formData.get('startDate'));
  const endDate = sanitizeText(formData.get('endDate'));
  const location = sanitizeText(formData.get('location'));
  const festivalName = sanitizeText(formData.get('festivalName'));
  const description = sanitizeText(formData.get('description'));
  const ctaText = sanitizeText(formData.get('ctaText'));
  const ctaUrl = sanitizeText(formData.get('ctaUrl'));
  const imageUrl = sanitizeText(formData.get('imageUrl'));
  const imageAlt = sanitizeText(formData.get('imageAlt'));
  const status = normalizeEventStatus(sanitizeText(formData.get('status')), 'planned');
  const standEnabled = String(formData.get('standEnabled') || '') === 'on';
  const standAssetUrl = sanitizeText(formData.get('standAssetUrl'));
  const standAssetName = sanitizeText(formData.get('standAssetName'));
  const standAssetContentType = sanitizeText(formData.get('standAssetContentType'));
  const standLead = sanitizeText(formData.get('standLead'));
  const standBannerSlots = sanitizeText(formData.get('standBannerSlots'));
  const fallbackStand = existingEvent?.stand || createDefaultEventStandConfig();

  return {
    id: existingId || '',
    title,
    date,
    startDate: normalizeStructuredEventDate(startDate),
    endDate: normalizeStructuredEventDate(endDate),
    location,
    festivalName,
    description,
    status,
    standEnabled,
    ctaText: ctaText || 'Mehr erfahren',
    ctaUrl: resolveEventCtaUrl(ctaUrl),
    imageUrl: imageUrl || existingEvent?.imageUrl,
    imageAlt: imageAlt || existingEvent?.imageAlt,
    stand: {
      assetUrl: standAssetUrl,
      assetName: standAssetName,
      assetContentType: standAssetContentType,
      lead: standLead,
      bannerSlots: parseBannerSlots(standBannerSlots, fallbackStand.bannerSlots),
    },
  };
}

async function assertAdmin() {
  if (!(await isAdminAuthenticated())) {
    redirect('/admin-login?next=/veranstaltungen');
  }
}

async function persistEvents(events: Event[]) {
  const current = await getCmsContent();
  const normalizedEvents = events.map(normalizeEvent);

  await saveCmsContent({
    ...current,
    site: {
      ...current.site,
      events: normalizedEvents,
    },
  });

  revalidatePath('/', 'layout');
  revalidatePath('/veranstaltungen');
  revalidatePath('/drei-d-stand');
  for (const event of normalizedEvents) {
    revalidatePath(`/veranstaltungen/${event.id}/3d-stand`);
  }
}

export async function addEventAction(formData: FormData) {
  await assertAdmin();

  const current = await getCmsContent();
  let nextEvent = parseEventFromFormData(formData);

  if (!nextEvent.title || !nextEvent.date || !nextEvent.location) {
    redirectWithAdminError('Bitte Titel, Datumsanzeige und Ort der Veranstaltung ausfuellen.');
  }

  const dateValidationError = validateStructuredEventDates(
    sanitizeText(formData.get('startDate')),
    sanitizeText(formData.get('endDate'))
  );

  if (dateValidationError) {
    redirectWithAdminError(dateValidationError);
  }

  nextEvent = await applyEventImageFromFormData(formData, nextEvent);
  nextEvent.id = ensureEventId(current.site.events, sanitizeText(formData.get('id')), nextEvent.title);

  await persistEvents([...current.site.events, nextEvent]);
  redirect('/veranstaltungen?adminSaved=event-added');
}

export async function updateEventAction(formData: FormData) {
  await assertAdmin();

  const eventId = sanitizeText(formData.get('id'));
  const current = await getCmsContent();

  if (!eventId) {
    redirectWithAdminError('Die Veranstaltungs-ID fehlt.');
  }

  const existingEvent = current.site.events.find((event) => event.id === eventId);

  if (!existingEvent) {
    redirectWithAdminError('Die Veranstaltung wurde nicht gefunden.');
  }

  const dateValidationError = validateOptionalStructuredEventDates(
    sanitizeText(formData.get('startDate')),
    sanitizeText(formData.get('endDate'))
  );

  if (dateValidationError) {
    redirectWithAdminError(dateValidationError);
  }

  let nextEvent = parseEventFromFormData(formData, eventId, existingEvent);
  nextEvent = await applyEventImageFromFormData(formData, nextEvent, existingEvent);

  await persistEvents(current.site.events.map((event) => (event.id === eventId ? normalizeEvent({ ...existingEvent, ...nextEvent, stand: nextEvent.stand || existingEvent.stand }) : event)));
  redirect('/veranstaltungen?adminSaved=event-updated');
}

export async function removeEventAction(formData: FormData) {
  await assertAdmin();

  const eventId = sanitizeText(formData.get('id'));
  const current = await getCmsContent();

  await persistEvents(current.site.events.filter((event) => event.id !== eventId));
  redirect('/veranstaltungen?adminSaved=event-removed');
}

export async function toggleEventStatusAction(formData: FormData) {
  await assertAdmin();

  const eventId = sanitizeText(formData.get('id'));
  const current = await getCmsContent();

  await persistEvents(
    current.site.events.map((event) => {
      if (event.id !== eventId) {
        return event;
      }

      if (event.status === 'completed' || event.status === 'cancelled') {
        return event;
      }

      return {
        ...event,
        status: event.status === 'confirmed' ? 'planned' : 'confirmed',
      };
    })
  );

  redirect('/veranstaltungen?adminSaved=event-status');
}

export async function toggleEventStandAction(formData: FormData) {
  await assertAdmin();

  const eventId = sanitizeText(formData.get('id'));
  const current = await getCmsContent();

  await persistEvents(
    current.site.events.map((event) => {
      if (event.id !== eventId) {
        return event;
      }

      return {
        ...event,
        standEnabled: !event.standEnabled,
      };
    })
  );

  redirect('/veranstaltungen?adminSaved=event-stand');
}