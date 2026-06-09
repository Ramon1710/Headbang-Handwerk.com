import type { Metadata } from 'next';
import { StandPageContent } from '@/components/stand-page-content';
import { isAdminAuthenticated } from '@/lib/cms/auth';
import { getCmsContent } from '@/lib/cms/storage';

export const metadata: Metadata = {
  title: '3D-Stand & Bannerflächen – Headbang Handwerk',
  description: 'Bucht Bannerflächen an unserem 3D-Messestand auf Metal-Festivals.',
};

export default async function DreiDStandPage({
  searchParams,
}: {
  searchParams?: Promise<{ view?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const cms = await getCmsContent();
  const isAuthenticatedAdmin = await isAdminAuthenticated();
  const isAdmin = isAuthenticatedAdmin && params?.view !== 'user';
  return <StandPageContent cms={cms} isAdmin={isAdmin} />;
}
