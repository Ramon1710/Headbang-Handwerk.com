'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getCmsContent } from '@/lib/cms/storage';
import { consumeEventSponsoringRequestRateLimit, getEventSponsoringRequestRateLimitKey } from '@/lib/event-sponsoring/request-rate-limit';
import { getEventSponsoringStore } from '@/lib/event-sponsoring/store';
import { submitEventSponsoringRequest } from '@/lib/event-sponsoring/request';

function sanitizeText(value: FormDataEntryValue | null) {
  return String(value || '').trim();
}

function buildRequestRoute(eventId: string, packageId: string) {
  return `/veranstaltungen/${encodeURIComponent(eventId)}/sponsoring/anfrage?package=${encodeURIComponent(packageId)}`;
}

function buildPublicReference(requestId: string) {
  return requestId.replace(/-/g, '').slice(0, 8).toUpperCase();
}

function getPublicErrorCode(error: unknown) {
  const message = error instanceof Error ? error.message : '';

  if (message.includes('Einwilligung') || message.includes('Rechnungszahlung') || message.includes('Logoplatzierung')) {
    return 'consent';
  }

  if (message.includes('Logo') || message.includes('Datei') || message.includes('Dateityp') || message.includes('MB')) {
    return 'upload';
  }

  if (message.includes('zu viele') || message.includes('rate')) {
    return 'submit';
  }

  return 'submit';
}

export async function submitEventSponsoringRequestAction(formData: FormData) {
  const eventId = sanitizeText(formData.get('eventId'));
  const packageId = sanitizeText(formData.get('packageId'));

  if (sanitizeText(formData.get('website')) !== '') {
    redirect(`${buildRequestRoute(eventId, packageId)}&submitted=1`);
  }

  const headerStore = await headers();
  const rateLimit = consumeEventSponsoringRequestRateLimit(
    getEventSponsoringRequestRateLimitKey({
      eventId,
      forwardedFor: headerStore.get('x-forwarded-for'),
      realIp: headerStore.get('x-real-ip'),
      userAgent: headerStore.get('user-agent'),
    }),
  );

  if (!rateLimit.allowed) {
    redirect(`${buildRequestRoute(eventId, packageId)}&error=submit`);
  }

  try {
    const result = await submitEventSponsoringRequest(
      {
        eventId,
        packageId,
        idempotencyKey: sanitizeText(formData.get('idempotencyKey')),
        companyName: sanitizeText(formData.get('companyName')),
        companyWebsite: sanitizeText(formData.get('companyWebsite')),
        contactFirstName: sanitizeText(formData.get('contactFirstName')),
        contactLastName: sanitizeText(formData.get('contactLastName')),
        email: sanitizeText(formData.get('email')),
        phone: sanitizeText(formData.get('phone')),
        billingStreet: sanitizeText(formData.get('billingStreet')),
        billingHouseNumber: sanitizeText(formData.get('billingHouseNumber')),
        billingPostalCode: sanitizeText(formData.get('billingPostalCode')),
        billingCity: sanitizeText(formData.get('billingCity')),
        billingCountryCode: sanitizeText(formData.get('billingCountryCode')),
        message: sanitizeText(formData.get('message')),
        supportTypes: formData.getAll('supportTypes').map((entry) => String(entry || '').trim()),
        publicDisplayEnabled: String(formData.get('publicDisplayEnabled') || '') === 'on',
        acceptDataProcessing: String(formData.get('acceptDataProcessing') || '') === 'on',
        acceptInvoicePayment: String(formData.get('acceptInvoicePayment') || '') === 'on',
        acceptManualLogoPlacement: String(formData.get('acceptManualLogoPlacement') || '') === 'on',
        logoFile: formData.get('logoFile') instanceof File ? (formData.get('logoFile') as File) : null,
      },
      {
        store: getEventSponsoringStore(),
        async getEventById(targetEventId) {
          const cms = await getCmsContent();
          return cms.site.events.find((event) => event.id === targetEventId) || null;
        },
      },
    );

    redirect(`${buildRequestRoute(eventId, packageId)}&submitted=1&ref=${encodeURIComponent(buildPublicReference(result.request.id))}`);
  } catch (error) {
    redirect(`${buildRequestRoute(eventId, packageId)}&error=${encodeURIComponent(getPublicErrorCode(error))}`);
  }
}