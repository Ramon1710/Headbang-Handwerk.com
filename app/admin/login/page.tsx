import { redirect } from 'next/navigation';

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  const next = params.next && params.next.startsWith('/') ? params.next : '/';
  const target = new URL('/admin-login', 'http://localhost');
  target.searchParams.set('next', next);

  if (params.error) {
    target.searchParams.set('error', params.error);
  }

  redirect(`${target.pathname}${target.search}`);
}