import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { loginAction } from '@/app/admin/actions';
import { isAdminAuthenticated } from '@/lib/cms/auth';

export const metadata: Metadata = {
  title: 'Admin Login – Headbang Handwerk',
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  const redirectTo = params.next && params.next.startsWith('/') ? params.next : '/admin';

  if (await isAdminAuthenticated()) {
    redirect(redirectTo);
  }

  return (
    <main className="min-h-screen bg-transparent px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md rounded-[1.8rem] border border-[color:var(--color-border)]/80 bg-[linear-gradient(180deg,rgba(18,12,9,0.86)_0%,rgba(10,7,5,0.78)_100%)] p-8 shadow-[0_24px_60px_rgba(0,0,0,0.28)]">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[color:var(--color-accent-soft)]">Geschützter Bereich</p>
        <h1 className="mt-4 text-3xl font-black text-[color:var(--color-foreground)]">Website nur nach Login sichtbar</h1>
        <p className="mt-4 text-sm leading-7 text-[color:var(--color-muted)]">
          Ohne gültige Anmeldung werden keine Seiteninhalte angezeigt. Nach dem Login landest du wieder auf der gewünschten Seite und kannst zusätzlich den Admin-Bereich nutzen.
        </p>

        {params.error ? (
          <div className="mt-6 rounded-2xl border border-red-500/40 bg-red-950/30 px-4 py-3 text-sm text-red-200">
            Login fehlgeschlagen. Prüfe Benutzername und Passwort.
          </div>
        ) : null}

        <form action={loginAction} className="mt-8 space-y-5">
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[color:var(--color-foreground)]">Benutzername</span>
            <input
              name="username"
              type="text"
              required
              className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-[color:var(--color-foreground)] outline-none transition focus:border-[color:var(--color-accent)]"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[color:var(--color-foreground)]">Passwort</span>
            <input
              name="password"
              type="password"
              required
              className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-[color:var(--color-foreground)] outline-none transition focus:border-[color:var(--color-accent)]"
            />
          </label>

          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-xl border border-[color:var(--color-accent)] bg-[linear-gradient(180deg,var(--color-accent)_0%,var(--color-accent-strong)_100%)] px-5 py-3 font-bold text-white shadow-[0_10px_24px_color-mix(in_srgb,var(--color-accent)_35%,transparent)]"
          >
            Einloggen
          </button>
        </form>
      </div>
    </main>
  );
}