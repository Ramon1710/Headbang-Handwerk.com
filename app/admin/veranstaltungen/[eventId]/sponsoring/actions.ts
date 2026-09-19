'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireHeadbangAdminAction } from '@/lib/cms/auth';
import { getCmsContent, saveCmsContent } from '@/lib/cms/storage';
import { normalizeEvent } from '@/lib/event-stand';
import {
  ensureDefaultEventSponsoringBannersForAdmin,
  ensureDefaultEventSponsoringPackagesForAdmin,
  ensureDefaultEventSponsoringSlotsForAdmin,
  saveEventSponsoringBannerForAdmin,
  saveEventSponsoringBannerLayoutForAdmin,
  saveEventDetailViewModeForAdmin,
  saveEventSponsoringConfigForAdmin,
  saveEventSponsoringPackageForAdmin,
} from '@/lib/event-sponsoring/admin';
import { sendEventSponsoringRequestNotification } from '@/lib/event-sponsoring/request';
import { getEventSponsoringRequestById, getEventSponsoringStore } from '@/lib/event-sponsoring/store';
import { normalizeEventDetailViewMode } from '@/lib/events';
import { normalizeEventSponsoringRequest } from '@/lib/event-sponsoring/validation';

function sanitizeText(value: FormDataEntryValue | null) {
  return String(value || '').trim();
}

function getAdminRoute(eventId: string) {
  return `/admin/veranstaltungen/${encodeURIComponent(eventId)}/sponsoring`;
}

function redirectWithError(eventId: string, message: string): never {
  redirect(`${getAdminRoute(eventId)}?adminError=${encodeURIComponent(message)}`);
}

function redirectWithSaved(eventId: string, saved: string): never {
  redirect(`${getAdminRoute(eventId)}?adminSaved=${encodeURIComponent(saved)}`);
}

function parseSlotsJson(value: string) {
  if (!value) {
    throw new Error('Das Slot-Layout fehlt.');
  }

  const parsed = JSON.parse(value);

  if (!Array.isArray(parsed)) {
    throw new Error('Das Slot-Layout ist ungueltig.');
  }

  return parsed as Array<Record<string, unknown>>;
}

async function getEventById(eventId: string) {
  const cms = await getCmsContent();
  return cms.site.events.find((event) => event.id === eventId) || null;
}

async function saveEvent(updatedEvent: Awaited<ReturnType<typeof getEventById>> extends infer T ? Exclude<T, null> : never) {
  const cms = await getCmsContent();
  const existingEvent = cms.site.events.find((event) => event.id === updatedEvent.id);

  if (!existingEvent) {
    throw new Error('Die Veranstaltung wurde nicht gefunden.');
  }

  await saveCmsContent({
    ...cms,
    site: {
      ...cms.site,
      events: cms.site.events.map((event) => (event.id === updatedEvent.id ? normalizeEvent({ ...existingEvent, ...updatedEvent, stand: updatedEvent.stand || existingEvent.stand }) : event)),
    },
  });
}

function revalidateAdminRoute(eventId: string) {
  revalidatePath('/veranstaltungen');
  revalidatePath(getAdminRoute(eventId));
  revalidatePath(`/veranstaltungen/${eventId}/3d-stand`);
  revalidatePath(`/veranstaltungen/${eventId}/sponsoring`);
  revalidatePath(`/veranstaltungen/${eventId}/sponsoring/anfrage`);
}

function createDependencies() {
  return {
    store: getEventSponsoringStore(),
    requireAdmin: () => requireHeadbangAdminAction('/admin/veranstaltungen'),
    getEventById,
    saveEvent,
  };
}

export async function saveEventDetailViewModeAction(formData: FormData) {
  const eventId = sanitizeText(formData.get('eventId'));

  try {
    await saveEventDetailViewModeForAdmin(
      {
        eventId,
        detailViewMode: normalizeEventDetailViewMode(sanitizeText(formData.get('detailViewMode'))),
      },
      createDependencies(),
    );
    revalidateAdminRoute(eventId);
  } catch (error) {
    if (error instanceof Error) {
      redirectWithError(eventId, error.message);
    }

    throw error;
  }

  redirectWithSaved(eventId, 'detail-view');
}

export async function saveEventSponsoringConfigAction(formData: FormData) {
  const eventId = sanitizeText(formData.get('eventId'));

  try {
    await saveEventSponsoringConfigForAdmin(
      {
        eventId,
        enabled: String(formData.get('enabled') || '') === 'on',
        publicTitle: sanitizeText(formData.get('publicTitle')),
        publicDescription: sanitizeText(formData.get('publicDescription')),
        currencyCode: sanitizeText(formData.get('currencyCode')),
        anonymousSupportEnabled: String(formData.get('anonymousSupportEnabled') || '') === 'on',
        anonymousMinimumAmountEuro: sanitizeText(formData.get('anonymousMinimumAmountEuro')),
        customSponsoringEnabled: String(formData.get('customSponsoringEnabled') || '') === 'on',
        showOccupiedLogosPublicly: String(formData.get('showOccupiedLogosPublicly') || '') === 'on',
      },
      createDependencies(),
    );
    revalidateAdminRoute(eventId);
  } catch (error) {
    if (error instanceof Error) {
      redirectWithError(eventId, error.message);
    }

    throw error;
  }

  redirectWithSaved(eventId, 'config');
}

export async function seedEventSponsoringPackagesAction(formData: FormData) {
  const eventId = sanitizeText(formData.get('eventId'));

  try {
    const result = await ensureDefaultEventSponsoringPackagesForAdmin({ eventId }, createDependencies());
    revalidateAdminRoute(eventId);

    if (result.createdKinds.length === 0) {
      redirectWithSaved(eventId, 'packages-defaults-already-present');
    }
  } catch (error) {
    if (error instanceof Error) {
      redirectWithError(eventId, error.message);
    }

    throw error;
  }

  redirectWithSaved(eventId, 'packages-defaults-created');
}

export async function saveEventSponsoringPackageAction(formData: FormData) {
  const eventId = sanitizeText(formData.get('eventId'));

  try {
    await saveEventSponsoringPackageForAdmin(
      {
        eventId,
        packageId: sanitizeText(formData.get('packageId')),
        name: sanitizeText(formData.get('name')),
        description: sanitizeText(formData.get('description')),
        featuresText: String(formData.get('featuresText') || ''),
        priceEuro: sanitizeText(formData.get('priceEuro')),
        active: String(formData.get('active') || '') === 'on',
        sortOrder: sanitizeText(formData.get('sortOrder')),
      },
      createDependencies(),
    );
    revalidateAdminRoute(eventId);
  } catch (error) {
    if (error instanceof Error) {
      redirectWithError(eventId, error.message);
    }

    throw error;
  }

  redirectWithSaved(eventId, 'package-updated');
}

export async function seedEventSponsoringBannersAction(formData: FormData) {
  const eventId = sanitizeText(formData.get('eventId'));

  try {
    const result = await ensureDefaultEventSponsoringBannersForAdmin({ eventId }, createDependencies());
    revalidateAdminRoute(eventId);

    if (result.createdBannerIds.length === 0) {
      redirectWithSaved(eventId, 'banners-defaults-already-present');
    }
  } catch (error) {
    if (error instanceof Error) {
      redirectWithError(eventId, error.message);
    }

    throw error;
  }

  redirectWithSaved(eventId, 'banners-defaults-created');
}

export async function seedEventSponsoringSlotsAction(formData: FormData) {
  const eventId = sanitizeText(formData.get('eventId'));

  try {
    const result = await ensureDefaultEventSponsoringSlotsForAdmin({ eventId }, createDependencies());
    revalidateAdminRoute(eventId);

    if (result.createdBannerIds.length === 0) {
      redirectWithSaved(eventId, 'slots-defaults-already-present');
    }
  } catch (error) {
    if (error instanceof Error) {
      redirectWithError(eventId, error.message);
    }

    throw error;
  }

  redirectWithSaved(eventId, 'slots-defaults-created');
}

export async function saveEventSponsoringBannerAction(formData: FormData) {
  const eventId = sanitizeText(formData.get('eventId'));

  try {
    await saveEventSponsoringBannerForAdmin(
      {
        eventId,
        bannerId: sanitizeText(formData.get('bannerId')),
        name: sanitizeText(formData.get('name')),
        active: String(formData.get('active') || '') === 'on',
      },
      createDependencies(),
    );
    revalidateAdminRoute(eventId);
  } catch (error) {
    if (error instanceof Error) {
      redirectWithError(eventId, error.message);
    }

    throw error;
  }

  redirectWithSaved(eventId, 'banner-updated');
}

export async function saveEventSponsoringBannerLayoutAction(formData: FormData) {
  const eventId = sanitizeText(formData.get('eventId'));

  try {
    await saveEventSponsoringBannerLayoutForAdmin(
      {
        eventId,
        bannerId: sanitizeText(formData.get('bannerId')),
        baseLayoutVersion: Number.parseInt(sanitizeText(formData.get('baseLayoutVersion')), 10),
        slots: parseSlotsJson(String(formData.get('slotsJson') || '')),
      },
      createDependencies(),
    );
    revalidateAdminRoute(eventId);
  } catch (error) {
    if (error instanceof Error) {
      redirectWithError(eventId, error.message);
    }

    throw error;
  }

  redirectWithSaved(eventId, 'banner-layout-updated');
}

export async function updateEventSponsoringRequestStatusAction(formData: FormData) {
  const eventId = sanitizeText(formData.get('eventId'));
  const requestId = sanitizeText(formData.get('requestId'));
  const status = sanitizeText(formData.get('status'));

  try {
    await requireHeadbangAdminAction('/admin/veranstaltungen');
    const store = getEventSponsoringStore();

    await store.runTransaction(async (transaction) => {
      const existing = await transaction.getRequest(requestId);

      if (!existing || existing.eventId !== eventId) {
        throw new Error('Die Sponsoringanfrage wurde nicht gefunden.');
      }

      await transaction.saveRequest(normalizeEventSponsoringRequest({ ...existing, status }, { existing }));
    });

    revalidateAdminRoute(eventId);
  } catch (error) {
    if (error instanceof Error) {
      redirectWithError(eventId, error.message);
    }

    throw error;
  }

  redirectWithSaved(eventId, 'request-status-updated');
}

export async function retryEventSponsoringRequestEmailAction(formData: FormData) {
  const eventId = sanitizeText(formData.get('eventId'));
  const requestId = sanitizeText(formData.get('requestId'));

  try {
    await requireHeadbangAdminAction('/admin/veranstaltungen');
    const existing = await getEventSponsoringRequestById(requestId, { store: getEventSponsoringStore() });

    if (!existing || existing.eventId !== eventId) {
      throw new Error('Die Sponsoringanfrage wurde nicht gefunden.');
    }

    if (existing.emailDelivery.state !== 'failed') {
      throw new Error('Der interne Mailversand kann nur nach einem fehlgeschlagenen Versand erneut angestossen werden.');
    }

    await sendEventSponsoringRequestNotification(requestId, {
      store: getEventSponsoringStore(),
      async getEventById(targetEventId) {
        return getEventById(targetEventId);
      },
    });
    revalidateAdminRoute(eventId);
  } catch (error) {
    if (error instanceof Error) {
      redirectWithError(eventId, error.message);
    }

    throw error;
  }

  redirectWithSaved(eventId, 'request-email-retried');
}
