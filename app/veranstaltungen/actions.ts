'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/cms/auth';
import { getCmsContent, saveCmsContent } from '@/lib/cms/storage';
import { createDefaultEventStandConfig, normalizeEvent, parseBannerSlots } from '@/lib/event-stand';
import type { Event } from '@/lib/types';

function sanitizeText(value: FormDataEntryValue | null) {
  return String(value || '').trim();
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

function parseEventFromFormData(formData: FormData, existingId?: string, existingEvent?: Event): Event {
  const title = sanitizeText(formData.get('title'));
  const date = sanitizeText(formData.get('date'));
  const location = sanitizeText(formData.get('location'));
  const festivalName = sanitizeText(formData.get('festivalName'));
  const description = sanitizeText(formData.get('description'));
  const ctaText = sanitizeText(formData.get('ctaText'));
  const ctaUrl = sanitizeText(formData.get('ctaUrl'));
  const rawStatus = sanitizeText(formData.get('status'));
  const status = rawStatus === 'confirmed' || rawStatus === 'completed' ? rawStatus : 'planned';
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
    location,
    festivalName,
    description,
    status,
    standEnabled,
    ctaText: ctaText || 'Mehr erfahren',
    ctaUrl: ctaUrl || '/kontakt',
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
  const nextEvent = parseEventFromFormData(formData);

  if (!nextEvent.title || !nextEvent.date || !nextEvent.location) {
    redirect('/veranstaltungen?adminError=missing-event-fields');
  }

  nextEvent.id = ensureEventId(current.site.events, sanitizeText(formData.get('id')), nextEvent.title);

  await persistEvents([...current.site.events, nextEvent]);
  redirect('/veranstaltungen?adminSaved=event-added');
}

export async function updateEventAction(formData: FormData) {
  await assertAdmin();

  const eventId = sanitizeText(formData.get('id'));
  const current = await getCmsContent();

  if (!eventId) {
    redirect('/veranstaltungen?adminError=missing-event-id');
  }

  const existingEvent = current.site.events.find((event) => event.id === eventId);

  if (!existingEvent) {
    redirect('/veranstaltungen?adminError=missing-event');
  }

  const nextEvent = parseEventFromFormData(formData, eventId, existingEvent);

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