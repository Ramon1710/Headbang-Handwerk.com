import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { StandPageContent } from '@/components/stand-page-content';
import { isAdminAuthenticated } from '@/lib/cms/auth';
import { getCmsContent } from '@/lib/cms/storage';

interface EventStandPageProps {
  params: Promise<{ eventId: string }>;
  searchParams?: Promise<{ view?: string }>;
}

export async function generateMetadata({ params }: EventStandPageProps): Promise<Metadata> {
  const { eventId } = await params;
  const cms = await getCmsContent();
  const event = cms.site.events.find((entry) => entry.id === eventId);

  if (!event) {
    return {
      title: 'Festival-Stand – Headbang Handwerk',
    };
  }

  return {
    title: `${event.festivalName} 3D-Stand – Headbang Handwerk`,
    description: `3D-Stand und Bannerflächen für ${event.festivalName}.`,
  };
}

export default async function EventStandPage({ params, searchParams }: EventStandPageProps) {
  const { eventId } = await params;
  const query = searchParams ? await searchParams : undefined;
  const cms = await getCmsContent();
  const event = cms.site.events.find((entry) => entry.id === eventId);

  if (!event) {
    notFound();
  }

  const isAuthenticatedAdmin = await isAdminAuthenticated();
  const isAdmin = isAuthenticatedAdmin && query?.view !== 'user';

  return <StandPageContent cms={cms} isAdmin={isAdmin} event={event} />;
}