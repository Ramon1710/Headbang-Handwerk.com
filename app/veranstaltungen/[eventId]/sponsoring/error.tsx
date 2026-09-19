'use client';

export default function EventSponsoringError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="min-h-screen bg-transparent px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-[1.9rem] border border-[color:var(--color-border)]/80 bg-[linear-gradient(180deg,rgba(18,12,9,0.86)_0%,rgba(10,7,5,0.76)_100%)] p-8 shadow-[0_24px_60px_rgba(0,0,0,0.28)]">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[color:var(--color-accent-soft)]">Veranstaltungs-Sponsoring</p>
        <h1 className="mt-4 text-3xl font-black text-white sm:text-4xl">Die Sponsoringangebote konnten momentan nicht geladen werden.</h1>
        <p className="mt-4 max-w-2xl text-base leading-8 text-[color:var(--color-muted)]">
          Bitte versucht es erneut. Wenn das Problem bestehen bleibt, nutzt voruebergehend den Kontaktbereich oder versucht es spaeter noch einmal.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button type="button" onClick={reset} className="inline-flex items-center rounded-xl border border-[color:var(--color-accent)]/50 bg-black/15 px-4 py-2 text-sm font-semibold text-[color:var(--color-accent-soft)] transition hover:border-[color:var(--color-accent)] hover:text-white">
            Erneut laden
          </button>
          <a href="/veranstaltungen" className="inline-flex items-center rounded-xl border border-[color:var(--color-border)] px-4 py-2 text-sm font-semibold text-[color:var(--color-foreground)] transition hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-accent-soft)]">
            Zurueck zu den Veranstaltungen
          </a>
        </div>
      </div>
    </main>
  );
}