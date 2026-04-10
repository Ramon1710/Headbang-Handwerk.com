import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { logoutAction, updateCmsAction } from './actions';
import { cmsContentToFormValues } from '@/lib/cms/form-data';
import { isAdminAuthenticated } from '@/lib/cms/auth';
import { cmsStorageMode, getCmsContent } from '@/lib/cms/storage';

export const metadata: Metadata = {
  title: 'Admin – Headbang Handwerk',
};

function InputField({ label, name, defaultValue, type = 'text' }: { label: string; name: string; defaultValue: string; type?: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-[color:var(--color-foreground)]">{label}</span>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-[color:var(--color-foreground)] outline-none transition focus:border-[color:var(--color-accent)]"
      />
    </label>
  );
}

function TextareaField({ label, name, defaultValue, rows = 4 }: { label: string; name: string; defaultValue: string; rows?: number }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-[color:var(--color-foreground)]">{label}</span>
      <textarea
        name={name}
        defaultValue={defaultValue}
        rows={rows}
        className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-[color:var(--color-foreground)] outline-none transition focus:border-[color:var(--color-accent)]"
      />
    </label>
  );
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; saveError?: string }>;
}) {
  if (!(await isAdminAuthenticated())) {
    redirect('/admin/login');
  }

  const cms = await getCmsContent();
  const params = await searchParams;
  const formValues = cmsContentToFormValues(cms);
  const storageMode = cmsStorageMode();

  return (
    <main className="min-h-screen bg-transparent px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-5 rounded-[1.9rem] border border-[color:var(--color-border)]/80 bg-[linear-gradient(180deg,rgba(18,12,9,0.86)_0%,rgba(10,7,5,0.76)_100%)] p-8 shadow-[0_24px_60px_rgba(0,0,0,0.28)] lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[color:var(--color-accent-soft)]">Admin Bereich</p>
            <h1 className="mt-3 text-4xl font-black text-[color:var(--color-foreground)]">Texte und Farben direkt bearbeiten</h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[color:var(--color-muted)]">
              Diese Inhalte werden serverseitig geladen. In Produktion auf Vercel sollten die Änderungen in einer externen MySQL-Datenbank gespeichert werden.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="rounded-full border border-[color:var(--color-border)] bg-black/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-accent-soft)]">
              Speicher: {storageMode === 'mysql' ? 'MySQL' : storageMode === 'local-file' ? 'Lokale Datei' : 'Nur Anzeige'}
            </div>
            <form action={logoutAction}>
              <button type="submit" className="rounded-xl border border-[color:var(--color-border)] px-4 py-2 text-sm font-semibold text-[color:var(--color-foreground)] transition hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-accent-soft)]">
                Logout
              </button>
            </form>
          </div>
        </div>

        <form action={updateCmsAction} className="mt-8 space-y-8 pb-12">
          {storageMode === 'readonly-fallback' ? (
            <div className="rounded-2xl border border-amber-500/40 bg-amber-950/30 px-5 py-4 text-sm text-amber-100">
              Auf Vercel ist aktuell keine CMS-Datenbank gesetzt. Die Admin-Seite lädt, aber Änderungen können noch nicht dauerhaft gespeichert werden.
            </div>
          ) : null}

          {params.saved ? (
            <div className="rounded-2xl border border-green-500/40 bg-green-950/30 px-5 py-4 text-sm text-green-200">
              Änderungen gespeichert. Die Website rendert ab jetzt mit den neuen Werten.
            </div>
          ) : null}

          {params.saveError ? (
            <div className="rounded-2xl border border-red-500/40 bg-red-950/30 px-5 py-4 text-sm text-red-200">
              Speichern fehlgeschlagen. Für Vercel musst du zuerst CMS_DATABASE_URL setzen.
            </div>
          ) : null}

          <section className="grid gap-6 rounded-[1.8rem] border border-[color:var(--color-border)]/70 bg-[color:var(--color-surface)]/70 p-7 lg:grid-cols-2">
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-black text-[color:var(--color-foreground)]">SEO und Navigation</h2>
            </div>
            <InputField label="Seitentitel" name="siteTitle" defaultValue={formValues.siteTitle} />
            <InputField label="Navigation CTA Link" name="navCtaHref" defaultValue={formValues.navCtaHref} />
            <TextareaField label="Meta Beschreibung" name="siteDescription" defaultValue={formValues.siteDescription} rows={4} />
            <InputField label="Navigation CTA Text" name="navCtaLabel" defaultValue={formValues.navCtaLabel} />
            <div className="lg:col-span-2">
              <TextareaField label="Keywords, eine Zeile pro Eintrag" name="keywords" defaultValue={formValues.keywords} rows={5} />
            </div>
          </section>

          <section className="grid gap-6 rounded-[1.8rem] border border-[color:var(--color-border)]/70 bg-[color:var(--color-surface)]/70 p-7 lg:grid-cols-2">
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-black text-[color:var(--color-foreground)]">Startseite</h2>
            </div>
            <InputField label="Hero Badge" name="heroBadge" defaultValue={formValues.heroBadge} />
            <InputField label="Hero Titel" name="heroTitle" defaultValue={formValues.heroTitle} />
            <TextareaField label="Hero Einleitung" name="heroLead" defaultValue={formValues.heroLead} rows={4} />
            <TextareaField label="Hero Fließtext" name="heroBody" defaultValue={formValues.heroBody} rows={6} />
            <InputField label="Primärer Button Text" name="heroPrimaryCtaLabel" defaultValue={formValues.heroPrimaryCtaLabel} />
            <InputField label="Primärer Button Link" name="heroPrimaryCtaHref" defaultValue={formValues.heroPrimaryCtaHref} />
            <InputField label="Sekundärer Button Text" name="heroSecondaryCtaLabel" defaultValue={formValues.heroSecondaryCtaLabel} />
            <InputField label="Sekundärer Button Link" name="heroSecondaryCtaHref" defaultValue={formValues.heroSecondaryCtaHref} />
            <InputField label="Hero Kennzahl 1 Wert" name="heroMetricOneValue" defaultValue={formValues.heroMetricOneValue} />
            <InputField label="Hero Kennzahl 1 Text" name="heroMetricOneLabel" defaultValue={formValues.heroMetricOneLabel} />
            <InputField label="Hero Kennzahl 2 Wert" name="heroMetricTwoValue" defaultValue={formValues.heroMetricTwoValue} />
            <InputField label="Hero Kennzahl 2 Text" name="heroMetricTwoLabel" defaultValue={formValues.heroMetricTwoLabel} />
            <InputField label="Hero Kennzahl 3 Wert" name="heroMetricThreeValue" defaultValue={formValues.heroMetricThreeValue} />
            <InputField label="Hero Kennzahl 3 Text" name="heroMetricThreeLabel" defaultValue={formValues.heroMetricThreeLabel} />
            <InputField label="Fokus Titel" name="focusTitle" defaultValue={formValues.focusTitle} />
            <InputField label="Update Titel" name="updateTitle" defaultValue={formValues.updateTitle} />
            <div className="lg:col-span-2">
              <TextareaField label="Fokus Punkte, eine Zeile pro Punkt" name="focusPoints" defaultValue={formValues.focusPoints} rows={5} />
            </div>
            <div className="lg:col-span-2">
              <TextareaField label="Update Absätze, eine Zeile pro Absatz" name="updateParagraphs" defaultValue={formValues.updateParagraphs} rows={5} />
            </div>
            <InputField label="Abschluss Titel" name="closingTitle" defaultValue={formValues.closingTitle} />
            <TextareaField label="Abschluss Lead" name="closingLead" defaultValue={formValues.closingLead} rows={4} />
            <div className="lg:col-span-2">
              <TextareaField label="Abschluss Statement" name="closingStatement" defaultValue={formValues.closingStatement} rows={4} />
            </div>
          </section>

          <section className="grid gap-6 rounded-[1.8rem] border border-[color:var(--color-border)]/70 bg-[color:var(--color-surface)]/70 p-7 lg:grid-cols-2">
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-black text-[color:var(--color-foreground)]">Footer und Social Links</h2>
            </div>
            <InputField label="Footer Überschrift" name="footerHeadline" defaultValue={formValues.footerHeadline} />
            <InputField label="Footer Zusatz" name="footerHighlight" defaultValue={formValues.footerHighlight} />
            <InputField label="Facebook URL" name="facebookUrl" defaultValue={formValues.facebookUrl} />
            <InputField label="Instagram URL" name="instagramUrl" defaultValue={formValues.instagramUrl} />
            <InputField label="YouTube URL" name="youtubeUrl" defaultValue={formValues.youtubeUrl} />
          </section>

          <section className="grid gap-6 rounded-[1.8rem] border border-[color:var(--color-border)]/70 bg-[color:var(--color-surface)]/70 p-7 lg:grid-cols-3">
            <div className="lg:col-span-3">
              <h2 className="text-2xl font-black text-[color:var(--color-foreground)]">Farben</h2>
            </div>
            <InputField label="Hintergrund" name="themeBackground" defaultValue={formValues.themeBackground} type="color" />
            <InputField label="Text" name="themeForeground" defaultValue={formValues.themeForeground} type="color" />
            <InputField label="Akzent" name="themeAccent" defaultValue={formValues.themeAccent} type="color" />
            <InputField label="Akzent stark" name="themeAccentStrong" defaultValue={formValues.themeAccentStrong} type="color" />
            <InputField label="Akzent weich" name="themeAccentSoft" defaultValue={formValues.themeAccentSoft} type="color" />
            <InputField label="Surface" name="themeSurface" defaultValue={formValues.themeSurface} type="color" />
            <InputField label="Surface alt" name="themeSurfaceAlt" defaultValue={formValues.themeSurfaceAlt} type="color" />
            <InputField label="Border" name="themeBorder" defaultValue={formValues.themeBorder} type="color" />
            <InputField label="Muted" name="themeMuted" defaultValue={formValues.themeMuted} type="color" />
          </section>

          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-xl border border-[color:var(--color-accent)] bg-[linear-gradient(180deg,var(--color-accent)_0%,var(--color-accent-strong)_100%)] px-6 py-3 font-bold text-white shadow-[0_10px_24px_color-mix(in_srgb,var(--color-accent)_35%,transparent)]"
            >
              Änderungen speichern
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}