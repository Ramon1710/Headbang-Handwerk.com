import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { EventSponsoringPublicPage } from '@/components/event-sponsoring-public-page';
import { isAdminAuthenticated } from '@/lib/cms/auth';
import { getCmsContent } from '@/lib/cms/storage';
import {
  buildEventSponsoringPublicPageView,
  getEventSponsoringPreviewMessage,
  resolveEventSponsoringPublicAccess,
} from '@/lib/event-sponsoring/public';
import {
  getEventSponsoringConfigByEventId,
  listEventSponsoringPackagesByEventId,
} from '@/lib/event-sponsoring/store';

interface EventSponsoringPageProps {
  params: Promise<{ eventId: string }>;
}

async function loadEventSponsoringRouteData(eventId: string) {
  const cms = await getCmsContent();
  const event = cms.site.events.find((entry) => entry.id === eventId);

  if (!event) {
    return { cms, event: null, config: null, packages: [] };
  }

  try {
    const [config, packages] = await Promise.all([
      getEventSponsoringConfigByEventId(eventId),
      listEventSponsoringPackagesByEventId(eventId),
    ]);

    return { cms, event, config, packages };
  } catch {
    return { cms, event, config: null, packages: [] };
  }
}

export async function generateMetadata({ params }: EventSponsoringPageProps): Promise<Metadata> {
  const { eventId } = await params;
  const isAdmin = await isAdminAuthenticated();
  const data = await loadEventSponsoringRouteData(eventId);

  if (!data.event) {
    return {
      title: 'Veranstaltungs-Sponsoring – Headbang Handwerk',
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const access = resolveEventSponsoringPublicAccess({
    event: data.event,
    config: data.config,
    packages: data.packages,
    isAdmin,
  });

  const title = data.config?.publicTitle || 'Veranstaltungs-Sponsoring';
  const description = data.config?.publicDescription || `Sponsoring-Informationen für ${data.event.festivalName || data.event.title}.`;

  return {
    title: `${data.event.festivalName || data.event.title} – ${title}`,
    description,
    ...(access.allowed && !access.isAdminPreview
      ? {}
      : {
          robots: {
            index: false,
            follow: false,
          },
        }),
  };
}

export default async function EventSponsoringPage({ params }: EventSponsoringPageProps) {
  const { eventId } = await params;
  const isAdmin = await isAdminAuthenticated();
  const data = await loadEventSponsoringRouteData(eventId);

  if (!data.event) {
    notFound();
  }

  const access = resolveEventSponsoringPublicAccess({
    event: data.event,
    config: data.config,
    packages: data.packages,
    isAdmin,
  });

  if (!access.allowed || !data.config) {
    notFound();
  }

  const view = buildEventSponsoringPublicPageView({
    event: data.event,
    config: data.config,
    packages: data.packages,
    isAdminPreview: access.isAdminPreview,
    previewReason: access.isAdminPreview ? access.reason : undefined,
  });

  const adminManageHref = `/admin/veranstaltungen/${encodeURIComponent(data.event.id)}/sponsoring`;

  return (
    <>
      {access.isAdminPreview ? (
        <div className="sr-only">{getEventSponsoringPreviewMessage(access.reason)}</div>
      ) : null}
      <EventSponsoringPublicPage cms={data.cms} isAdmin={isAdmin} view={view} adminManageHref={adminManageHref} />
    </>
  );
}