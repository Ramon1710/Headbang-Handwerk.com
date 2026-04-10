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

function SelectField({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue: string;
  options: Array<{ label: string; value: string }>;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-[color:var(--color-foreground)]">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-[color:var(--color-foreground)] outline-none transition focus:border-[color:var(--color-accent)]"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; saveError?: 'missing-config' | 'invalid-firebase' | 'firebase-auth' | 'stand-upload' | string }>;
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
              Diese Inhalte werden serverseitig geladen. In Produktion auf Vercel sollten die Änderungen in Firebase Firestore gespeichert werden.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="rounded-full border border-[color:var(--color-border)] bg-black/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-accent-soft)]">
              Speicher: {storageMode === 'firebase' ? 'Firebase' : storageMode === 'local-file' ? 'Lokale Datei' : 'Nur Anzeige'}
            </div>
            <form action={logoutAction}>
              <button type="submit" className="rounded-xl border border-[color:var(--color-border)] px-4 py-2 text-sm font-semibold text-[color:var(--color-foreground)] transition hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-accent-soft)]">
                Logout
              </button>
            </form>
          </div>
        </div>

        <form action={updateCmsAction} encType="multipart/form-data" className="mt-8 space-y-8 pb-12">
          {storageMode === 'readonly-fallback' ? (
            <div className="rounded-2xl border border-amber-500/40 bg-amber-950/30 px-5 py-4 text-sm text-amber-100">
              Auf Vercel ist aktuell Firebase noch nicht vollständig gesetzt. Die Admin-Seite lädt, aber Änderungen können noch nicht dauerhaft gespeichert werden.
            </div>
          ) : null}

          {params.saved ? (
            <div className="rounded-2xl border border-green-500/40 bg-green-950/30 px-5 py-4 text-sm text-green-200">
              Änderungen gespeichert. Die Website rendert ab jetzt mit den neuen Werten.
            </div>
          ) : null}

          {params.saveError ? (
            <div className="rounded-2xl border border-red-500/40 bg-red-950/30 px-5 py-4 text-sm text-red-200">
              {params.saveError === 'firebase-auth'
                ? 'Speichern fehlgeschlagen. Firebase antwortet mit UNAUTHENTICATED. Prüfe FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY und ob der Service Account im richtigen Projekt erstellt wurde.'
                : params.saveError === 'stand-upload'
                ? 'Die 3D-Stand-Datei konnte nicht hochgeladen werden. Prüfe FIREBASE_STORAGE_BUCKET in Vercel oder den Zugriff des Service Accounts auf Firebase Storage.'
                : params.saveError === 'invalid-firebase'
                ? 'Speichern fehlgeschlagen. Firebase ist gesetzt, aber der Service-Account-Key ist noch ungültig oder falsch formatiert.'
                : 'Speichern fehlgeschlagen. Für Vercel musst du zuerst FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL und FIREBASE_PRIVATE_KEY setzen.'}
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
              <h2 className="text-2xl font-black text-[color:var(--color-foreground)]">Sponsoren-Seite</h2>
            </div>
            <InputField label="Titel links" name="sponsorsTitle" defaultValue={formValues.sponsorsTitle} />
            <InputField label="Akzentwort" name="sponsorsAccentWord" defaultValue={formValues.sponsorsAccentWord} />
            <div className="lg:col-span-2">
              <TextareaField label="Einleitung" name="sponsorsLead" defaultValue={formValues.sponsorsLead} rows={4} />
            </div>
            <InputField label="Benefits Überschrift" name="sponsorsBenefitsTitle" defaultValue={formValues.sponsorsBenefitsTitle} />
            <InputField label="Individuelles CTA Link" name="sponsorsCustomPackageCtaHref" defaultValue={formValues.sponsorsCustomPackageCtaHref} />
            <div className="lg:col-span-2">
              <TextareaField label="Benefits, eine Zeile pro Eintrag" name="sponsorsBenefits" defaultValue={formValues.sponsorsBenefits} rows={6} />
            </div>
            <InputField label="Individuelles Modul Titel" name="sponsorsCustomPackageTitle" defaultValue={formValues.sponsorsCustomPackageTitle} />
            <InputField label="Individuelles CTA Text" name="sponsorsCustomPackageCtaLabel" defaultValue={formValues.sponsorsCustomPackageCtaLabel} />
            <div className="lg:col-span-2">
              <TextareaField label="Individueller Hinweistext" name="sponsorsCustomPackageText" defaultValue={formValues.sponsorsCustomPackageText} rows={4} />
            </div>
          </section>

          <section className="grid gap-6 rounded-[1.8rem] border border-[color:var(--color-border)]/70 bg-[color:var(--color-surface)]/70 p-7 lg:grid-cols-2">
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-black text-[color:var(--color-foreground)]">Über uns</h2>
            </div>
            <InputField label="Titel links" name="aboutTitle" defaultValue={formValues.aboutTitle} />
            <InputField label="Akzentwort" name="aboutAccentWord" defaultValue={formValues.aboutAccentWord} />
            <div className="lg:col-span-2">
              <TextareaField label="Einleitung, eine Zeile pro Absatz" name="aboutIntroParagraphs" defaultValue={formValues.aboutIntroParagraphs} rows={5} />
            </div>
            <InputField label="Wert 1 Titel" name="aboutValueOneTitle" defaultValue={formValues.aboutValueOneTitle} />
            <TextareaField label="Wert 1 Text" name="aboutValueOneDescription" defaultValue={formValues.aboutValueOneDescription} rows={3} />
            <InputField label="Wert 2 Titel" name="aboutValueTwoTitle" defaultValue={formValues.aboutValueTwoTitle} />
            <TextareaField label="Wert 2 Text" name="aboutValueTwoDescription" defaultValue={formValues.aboutValueTwoDescription} rows={3} />
            <InputField label="Wert 3 Titel" name="aboutValueThreeTitle" defaultValue={formValues.aboutValueThreeTitle} />
            <TextareaField label="Wert 3 Text" name="aboutValueThreeDescription" defaultValue={formValues.aboutValueThreeDescription} rows={3} />
            <InputField label="Team Überschrift" name="aboutTeamTitle" defaultValue={formValues.aboutTeamTitle} />
            <InputField label="CTA Link" name="aboutCtaHref" defaultValue={formValues.aboutCtaHref} />
            <div className="lg:col-span-2">
              <TextareaField label="Team Rollen, eine Zeile pro Rolle" name="aboutTeamRoles" defaultValue={formValues.aboutTeamRoles} rows={4} />
            </div>
            <InputField label="CTA Text" name="aboutCtaLabel" defaultValue={formValues.aboutCtaLabel} />
          </section>

          <section className="grid gap-6 rounded-[1.8rem] border border-[color:var(--color-border)]/70 bg-[color:var(--color-surface)]/70 p-7 lg:grid-cols-2">
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-black text-[color:var(--color-foreground)]">Kontakt</h2>
            </div>
            <InputField label="Seitentitel" name="contactTitle" defaultValue={formValues.contactTitle} />
            <InputField label="E-Mail" name="contactEmail" defaultValue={formValues.contactEmail} />
            <div className="lg:col-span-2">
              <TextareaField label="Einleitung" name="contactLead" defaultValue={formValues.contactLead} rows={4} />
            </div>
            <InputField label="Instagram Anzeige-Text" name="contactInstagramLabel" defaultValue={formValues.contactInstagramLabel} />
            <InputField label="Facebook Anzeige-Text" name="contactFacebookLabel" defaultValue={formValues.contactFacebookLabel} />
            <InputField label="Formular Überschrift" name="contactFormTitle" defaultValue={formValues.contactFormTitle} />
          </section>

          <section className="grid gap-6 rounded-[1.8rem] border border-[color:var(--color-border)]/70 bg-[color:var(--color-surface)]/70 p-7 lg:grid-cols-2">
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-black text-[color:var(--color-foreground)]">3D-Stand</h2>
            </div>
            <InputField label="Badge" name="standBadge" defaultValue={formValues.standBadge} />
            <InputField label="Titel links" name="standTitle" defaultValue={formValues.standTitle} />
            <InputField label="Akzentwort" name="standAccentWord" defaultValue={formValues.standAccentWord} />
            <InputField label="Übersichtstitel" name="standOverviewTitle" defaultValue={formValues.standOverviewTitle} />
            <div className="lg:col-span-2">
              <TextareaField label="Einleitung" name="standLead" defaultValue={formValues.standLead} rows={4} />
            </div>
            <InputField label="Platzhalter Titel" name="standOverviewPlaceholderTitle" defaultValue={formValues.standOverviewPlaceholderTitle} />
            <InputField label="Platzhalter Zusatz" name="standOverviewPlaceholderText" defaultValue={formValues.standOverviewPlaceholderText} />
            <label className="block lg:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-[color:var(--color-foreground)]">3D-Stand-Datei hochladen</span>
              <input
                type="file"
                name="standAssetFile"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.svg,.mp4,.mov,.glb,.gltf,.usdz"
                className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-[color:var(--color-foreground)] outline-none transition file:mr-4 file:rounded-lg file:border-0 file:bg-[color:var(--color-accent)] file:px-4 file:py-2 file:font-semibold file:text-white focus:border-[color:var(--color-accent)]"
              />
              <span className="mt-2 block text-xs text-[color:var(--color-muted)]">
                Unterstützt z.B. PDF, PNG, JPG, SVG, MP4 oder 3D-Dateien wie GLB/GLTF.
              </span>
            </label>
            <div className="rounded-2xl border border-[color:var(--color-border)]/70 bg-black/15 px-4 py-4 text-sm text-[color:var(--color-muted)] lg:col-span-2">
              {formValues.standAssetUrl ? (
                <>
                  Aktuelle Datei: <a href={formValues.standAssetUrl} target="_blank" rel="noreferrer" className="font-semibold text-[color:var(--color-accent-soft)] underline underline-offset-4">{formValues.standAssetName || 'Datei öffnen'}</a>
                </>
              ) : (
                'Aktuell ist noch keine 3D-Stand-Datei hinterlegt.'
              )}
            </div>
            <label className="flex items-center gap-3 rounded-xl border border-[color:var(--color-border)]/70 bg-black/10 px-4 py-3 text-sm text-[color:var(--color-foreground)] lg:col-span-2">
              <input type="checkbox" name="standAssetRemove" className="h-4 w-4 rounded border-[color:var(--color-border)] bg-black/20" />
              Vorhandene 3D-Stand-Datei beim Speichern entfernen
            </label>
            <InputField label="Frontbanner Label" name="standFrontBannerLabel" defaultValue={formValues.standFrontBannerLabel} />
            <InputField label="Rückbanner Label" name="standBackBannerLabel" defaultValue={formValues.standBackBannerLabel} />
            <InputField label="Linke Seitenmarke" name="standLeftLabel" defaultValue={formValues.standLeftLabel} />
            <InputField label="Rechte Seitenmarke" name="standRightLabel" defaultValue={formValues.standRightLabel} />
            <InputField label="Überschrift verfügbare Flächen" name="standAvailableTitle" defaultValue={formValues.standAvailableTitle} />
            <InputField label="Überschrift reserviert" name="standReservedTitle" defaultValue={formValues.standReservedTitle} />
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

          <section className="grid gap-6 rounded-[1.8rem] border border-[color:var(--color-border)]/70 bg-[color:var(--color-surface)]/70 p-7 lg:grid-cols-3">
            <div className="lg:col-span-3">
              <h2 className="text-2xl font-black text-[color:var(--color-foreground)]">Kästen Typografie</h2>
            </div>
            <SelectField
              label="Label Schrift"
              name="boxLabelFont"
              defaultValue={formValues.boxLabelFont}
              options={[{ label: 'Exo 2', value: 'exo' }, { label: 'Cinzel', value: 'cinzel' }]}
            />
            <SelectField
              label="Titel Schrift"
              name="boxTitleFont"
              defaultValue={formValues.boxTitleFont}
              options={[{ label: 'Cinzel', value: 'cinzel' }, { label: 'Exo 2', value: 'exo' }]}
            />
            <SelectField
              label="Text Schrift"
              name="boxBodyFont"
              defaultValue={formValues.boxBodyFont}
              options={[{ label: 'Exo 2', value: 'exo' }, { label: 'Cinzel', value: 'cinzel' }]}
            />
            <InputField label="Label Größe" name="boxLabelSize" defaultValue={formValues.boxLabelSize} />
            <InputField label="Titel Größe" name="boxTitleSize" defaultValue={formValues.boxTitleSize} />
            <InputField label="Text Größe" name="boxBodySize" defaultValue={formValues.boxBodySize} />
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