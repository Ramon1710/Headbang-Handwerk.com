import { ArrowRight, ImageIcon } from 'lucide-react';
import { SiteNavigation } from '@/components/site-navigation';
import { Footer } from '@/components/footer';
import { LiveEditableText } from '@/components/live-editable-text';
import { LiveLayoutSaveProvider } from '@/components/live-layout-save-context';
import { LiveResizableBox } from '@/components/live-resizable-box';
import { Button } from '@/components/ui/button';
import { logoutAction } from '@/app/admin/actions';
import { updateHomeMediaAction } from '@/app/admin/media-actions';
import { isAdminAuthenticated } from '@/lib/cms/auth';
import { resolveLiveBoxStyle, resolveLiveHtml } from '@/lib/cms/live-editor';
import { getCmsContent } from '@/lib/cms/storage';
import standBeispielKiImage from '../Stand Beispiel KI.png';
import wackenBackgroundImage from '../Wacken Hintergrund Bild.png';

type LiveEditorState = Awaited<ReturnType<typeof getCmsContent>>['site']['liveEditor'];

function getMediaErrorMessage(mediaError?: string) {
  if (!mediaError) {
    return null;
  }

  if (mediaError === 'missing-config') {
    return 'Firebase ist für Uploads noch nicht vollständig gesetzt. Prüfe FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY und FIREBASE_STORAGE_BUCKET.';
  }

  if (mediaError.endsWith('-invalid-config')) {
    return 'Firebase ist gesetzt, aber ungültig formatiert. Prüfe besonders FIREBASE_PRIVATE_KEY und FIREBASE_STORAGE_BUCKET.';
  }

  if (mediaError.endsWith('-bucket')) {
    return 'Der Firebase-Storage-Bucket wurde nicht gefunden. Prüfe FIREBASE_STORAGE_BUCKET in Vercel.';
  }

  if (mediaError.endsWith('-permission')) {
    return 'Der Firebase-Service-Account hat keine Schreibrechte auf den Storage-Bucket.';
  }

  return 'Upload fehlgeschlagen. Bitte Firebase-Storage prüfen.';
}

function getMediaSavedMessage(mediaSaved?: string) {
  if (!mediaSaved) {
    return null;
  }

  if (mediaSaved === 'home') {
    return 'Startseiten-Medien gespeichert.';
  }

  if (mediaSaved === 'logo') {
    return 'Hauptlogo gespeichert.';
  }

  return 'Änderungen gespeichert.';
}

function HomeActionCard({
  boxKey,
  titleKey,
  ctaKey,
  title,
  href,
  linkLabel,
  isAdmin,
  liveEditor,
}: {
  boxKey: string;
  titleKey: string;
  ctaKey: string;
  title: string;
  href: string;
  linkLabel: string;
  isAdmin: boolean;
  liveEditor: LiveEditorState;
}) {
  return (
    <LiveResizableBox
      boxKey={boxKey}
      initialStyle={resolveLiveBoxStyle(liveEditor, boxKey)}
      isAdmin={isAdmin}
      className="rounded-[1.4rem] border border-white/10 bg-[linear-gradient(180deg,rgba(22,14,10,0.9)_0%,rgba(10,7,5,0.82)_100%)] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.22)]"
    >
      <LiveEditableText
        as="p"
        className="text-xl font-black leading-tight text-white"
        editorKey={titleKey}
        initialHtml={resolveLiveHtml(liveEditor, titleKey, title)}
        isAdmin={isAdmin}
        title={title}
        normalizeTypography
      />
      {isAdmin ? (
        <div className="mt-4 flex w-full items-center justify-center gap-2 rounded-[0.65rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-5 py-2.5 text-sm font-bold tracking-wide text-[color:var(--color-accent-soft)]">
          <LiveEditableText
            as="span"
            className="text-sm font-bold tracking-wide text-[color:var(--color-accent-soft)]"
            editorKey={ctaKey}
            initialHtml={resolveLiveHtml(liveEditor, ctaKey, linkLabel)}
            isAdmin={isAdmin}
            title={`${title} Buttontext`}
            normalizeTypography
          />
          <ArrowRight className="h-4 w-4" />
        </div>
      ) : (
        <Button href={href} variant="secondary" className="mt-4 w-full justify-center">
          {resolveLiveHtml(liveEditor, ctaKey, linkLabel).replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '')}
          <ArrowRight className="h-4 w-4" />
        </Button>
      )}
    </LiveResizableBox>
  );
}

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<{ view?: string; mediaSaved?: string; mediaError?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const cms = await getCmsContent();
  const isAuthenticatedAdmin = await isAdminAuthenticated();
  const isAdmin = isAuthenticatedAdmin && params?.view !== 'user';
  const home = cms.site.home;
  const liveEditor = cms.site.liveEditor;
  const heroImageSrc = home.heroImage.assetUrl || standBeispielKiImage.src;
  const backgroundImageSrc = home.backgroundImage.assetUrl || wackenBackgroundImage.src;
  const mediaErrorMessage = getMediaErrorMessage(params?.mediaError);
  const mediaSavedMessage = getMediaSavedMessage(params?.mediaSaved);

  return (
    <>
      <SiteNavigation
        links={cms.site.navigationLinks}
        ctaLabel={cms.site.navigationCtaLabel}
        ctaHref={cms.site.navigationCtaHref}
      />
      <LiveLayoutSaveProvider enabled={isAdmin}>
        <main
          className="relative isolate overflow-hidden"
          style={{
            backgroundImage: `linear-gradient(rgba(7, 4, 2, 0.82), rgba(7, 4, 2, 0.95)), url(${backgroundImageSrc})`,
            backgroundPosition: 'center top, center top',
            backgroundRepeat: 'no-repeat, no-repeat',
            backgroundSize: 'cover, cover',
          }}
        >
          {isAdmin ? (
            <>
              <form action={logoutAction} className="fixed left-4 top-4 z-[61]">
                <button
                  type="submit"
                  className="rounded-2xl border border-[#ff9d3c]/50 bg-[#130d09]/94 px-4 py-3 text-sm font-black text-[#f4e5d2] shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-sm transition hover:border-[#ffb14d] hover:text-white"
                >
                  Admin-Ansicht verlassen
                </button>
              </form>
              <section className="fixed left-4 top-24 z-[61] w-[min(22rem,calc(100vw-2rem))] rounded-[1.4rem] border border-[#ff9d3c]/40 bg-[#130d09]/92 p-4 text-[#f4e5d2] shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#ffcf98]">Oben links</p>
                    <h2 className="mt-1 text-lg font-black text-white">Hauptlogo tauschen</h2>
                  </div>
                  {cms.site.logo.assetUrl ? (
                    <img src={cms.site.logo.assetUrl} alt={cms.site.logo.assetName || 'Aktuelles Logo'} className="h-12 w-20 rounded-lg bg-black/20 object-contain p-1" />
                  ) : (
                    <div className="flex h-12 w-20 items-center justify-center rounded-lg border border-white/10 bg-black/20 text-[0.65rem] font-semibold text-[#cdbca7]">
                      Standard
                    </div>
                  )}
                </div>
                <form action={updateHomeMediaAction} className="mt-4 grid gap-3">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-white">Logo-Datei</span>
                    <input type="file" name="logoAssetFile" accept=".png,.jpg,.jpeg,.webp,.svg" className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white file:mr-4 file:rounded-lg file:border-0 file:bg-[color:var(--color-accent)] file:px-4 file:py-2 file:font-semibold file:text-black" />
                  </label>
                  <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/15 px-4 py-3 text-sm text-[#d9c8b5]">
                    <input type="checkbox" name="removeLogoAsset" className="h-4 w-4" />
                    Hochgeladenes Logo entfernen
                  </label>
                  {mediaSavedMessage ? <p className="rounded-xl border border-green-500/30 bg-green-950/40 px-4 py-3 text-sm text-green-200">{mediaSavedMessage}</p> : null}
                  {mediaErrorMessage ? <p className="rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-200">{mediaErrorMessage}</p> : null}
                  <button type="submit" className="rounded-xl bg-[color:var(--color-accent)] px-5 py-3 text-sm font-black text-black transition hover:brightness-110">Logo speichern</button>
                </form>
              </section>
              <div className="fixed bottom-4 right-4 z-[60] max-w-sm rounded-2xl border border-[#ff9d3c]/50 bg-[#130d09]/92 px-4 py-3 text-sm text-[#f4e5d2] shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-sm">
                Klick auf Text zum Bearbeiten. Ziehe unten rechts an Kästchen, um ihre Größe zu ändern.
              </div>
            </>
          ) : null}

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_12%,rgba(255,143,42,0.18)_0%,transparent_30%),linear-gradient(180deg,rgba(6,3,2,0.15)_0%,rgba(6,3,2,0.82)_100%)]" />

          <div className="relative z-10 mx-auto max-w-7xl px-4 pb-24 pt-28 sm:px-6 lg:px-8">
            {isAdmin ? (
              <section className="mb-6 rounded-[1.6rem] border border-white/10 bg-[linear-gradient(180deg,rgba(22,14,10,0.92)_0%,rgba(10,7,5,0.84)_100%)] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[color:var(--color-accent-soft)]">Startseiten Medien</p>
                    <h2 className="mt-2 text-2xl font-black text-white">Bild und Hintergrund per Firebase pflegen</h2>
                  </div>
                  <div className="text-sm font-semibold">
                    {mediaSavedMessage ? <p className="rounded-xl border border-green-500/30 bg-green-950/40 px-4 py-3 text-green-200">{mediaSavedMessage}</p> : null}
                    {mediaErrorMessage ? <p className="rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-red-200">{mediaErrorMessage}</p> : null}
                  </div>
                </div>
                <form action={updateHomeMediaAction} className="mt-5 grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-white">Startseitenbild</span>
                    <input type="file" name="heroImageFile" accept=".png,.jpg,.jpeg,.webp" className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white file:mr-4 file:rounded-lg file:border-0 file:bg-[color:var(--color-accent)] file:px-4 file:py-2 file:font-semibold file:text-black" />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-white">Hintergrundbild</span>
                    <input type="file" name="backgroundImageFile" accept=".png,.jpg,.jpeg,.webp" className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white file:mr-4 file:rounded-lg file:border-0 file:bg-[color:var(--color-accent)] file:px-4 file:py-2 file:font-semibold file:text-black" />
                  </label>
                  <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/15 px-4 py-3 text-sm text-[color:var(--color-muted)]">
                    <input type="checkbox" name="removeHeroImage" className="h-4 w-4" />
                    Startseitenbild entfernen
                  </label>
                  <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/15 px-4 py-3 text-sm text-[color:var(--color-muted)]">
                    <input type="checkbox" name="removeBackgroundImage" className="h-4 w-4" />
                    Hintergrundbild entfernen
                  </label>
                  <div className="md:col-span-2 flex justify-end">
                    <button type="submit" className="rounded-xl bg-[color:var(--color-accent)] px-5 py-3 text-sm font-black text-black transition hover:brightness-110">Medien speichern</button>
                  </div>
                </form>
              </section>
            ) : null}

            <div className="grid gap-4 lg:grid-cols-[1.8fr_1fr] lg:gap-5">
              <div className="grid gap-4">
                <LiveResizableBox
                  boxKey="home.simple.head.box"
                  initialStyle={resolveLiveBoxStyle(liveEditor, 'home.simple.head.box')}
                  isAdmin={isAdmin}
                  className="rounded-[1.4rem] border border-white/10 bg-[linear-gradient(180deg,rgba(22,14,10,0.9)_0%,rgba(10,7,5,0.82)_100%)] px-6 py-6 text-center shadow-[0_18px_40px_rgba(0,0,0,0.22)]"
                >
                  <LiveEditableText
                    as="h1"
                    className="text-3xl font-black text-white sm:text-4xl"
                    editorKey="home.heroTitle"
                    initialHtml={resolveLiveHtml(liveEditor, 'home.heroTitle', home.heroTitle)}
                    isAdmin={isAdmin}
                    title="Startseite Überschrift"
                    normalizeTypography
                  />
                </LiveResizableBox>

                <LiveResizableBox
                  boxKey="home.simple.greeting.box"
                  initialStyle={resolveLiveBoxStyle(liveEditor, 'home.simple.greeting.box')}
                  isAdmin={isAdmin}
                  className="rounded-[1.4rem] border border-white/10 bg-[linear-gradient(180deg,rgba(22,14,10,0.9)_0%,rgba(10,7,5,0.82)_100%)] px-6 py-5 text-center shadow-[0_18px_40px_rgba(0,0,0,0.22)]"
                >
                  <LiveEditableText
                    as="p"
                    className="text-2xl font-bold text-[color:var(--color-accent-soft)] sm:text-3xl"
                    editorKey="home.heroLead"
                    initialHtml={resolveLiveHtml(liveEditor, 'home.heroLead', home.heroLead)}
                    isAdmin={isAdmin}
                    title="Startseite Willkommensgruß"
                    normalizeTypography
                  />
                </LiveResizableBox>

                <LiveResizableBox
                  boxKey="home.simple.info.box"
                  initialStyle={resolveLiveBoxStyle(liveEditor, 'home.simple.info.box')}
                  isAdmin={isAdmin}
                  className="min-h-[20rem] rounded-[1.4rem] border border-white/10 bg-[linear-gradient(180deg,rgba(22,14,10,0.92)_0%,rgba(10,7,5,0.85)_100%)] px-6 py-6 shadow-[0_18px_40px_rgba(0,0,0,0.22)]"
                >
                  <LiveEditableText
                    as="div"
                    className="text-lg leading-8 text-[#ead9c3]"
                    editorKey="home.heroBody"
                    initialHtml={resolveLiveHtml(liveEditor, 'home.heroBody', home.heroBody)}
                    isAdmin={isAdmin}
                    title="Startseite Infotext"
                    normalizeTypography
                  />
                </LiveResizableBox>
              </div>

              <div className="grid gap-4">
                <LiveResizableBox
                  boxKey="home.simple.image.box"
                  initialStyle={resolveLiveBoxStyle(liveEditor, 'home.simple.image.box')}
                  isAdmin={isAdmin}
                  className="h-full min-h-[22rem] overflow-hidden rounded-[1.4rem] border border-white/10 bg-[linear-gradient(180deg,rgba(22,14,10,0.92)_0%,rgba(10,7,5,0.85)_100%)] shadow-[0_18px_40px_rgba(0,0,0,0.22)]"
                >
                  {heroImageSrc ? (
                    <img src={heroImageSrc} alt={home.heroImage.assetName || 'Startseitenbild'} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full min-h-[22rem] items-center justify-center bg-black/20 text-[color:var(--color-muted)]">
                      <ImageIcon className="h-10 w-10" />
                    </div>
                  )}
                </LiveResizableBox>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <HomeActionCard boxKey="home.simple.form.box" titleKey="home.simple.form.title" ctaKey="home.simple.form.cta" title="Mitglied werden" href="/formular" linkLabel="Zum Formular" isAdmin={isAdmin} liveEditor={liveEditor} />
              <HomeActionCard boxKey="home.simple.partner.box" titleKey="home.simple.partner.title" ctaKey="home.simple.partner.cta" title="Partner werden" href="/partner-unterstuetzerinfo" linkLabel="Zum Inforeiter" isAdmin={isAdmin} liveEditor={liveEditor} />
              <HomeActionCard boxKey="home.simple.sponsor.box" titleKey="home.simple.sponsor.title" ctaKey="home.simple.sponsor.cta" title="Sponsor werden" href="/sponsoren" linkLabel="Zum Sponsoring" isAdmin={isAdmin} liveEditor={liveEditor} />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1fr_1.2fr]">
              <HomeActionCard boxKey="home.simple.support.box" titleKey="home.simple.support.title" ctaKey="home.simple.support.cta" title="Unterstützer werden" href="/partner-unterstuetzerinfo" linkLabel="Mehr erfahren" isAdmin={isAdmin} liveEditor={liveEditor} />

              <LiveResizableBox
                boxKey="home.simple.smallinfo.box"
                initialStyle={resolveLiveBoxStyle(liveEditor, 'home.simple.smallinfo.box')}
                isAdmin={isAdmin}
                className="rounded-[1.4rem] border border-white/10 bg-[linear-gradient(180deg,rgba(22,14,10,0.92)_0%,rgba(10,7,5,0.85)_100%)] px-6 py-6 shadow-[0_18px_40px_rgba(0,0,0,0.22)]"
              >
                <LiveEditableText
                  as="h3"
                  className="text-xl font-black text-white"
                  editorKey="home.updateTitle"
                  initialHtml={resolveLiveHtml(liveEditor, 'home.updateTitle', home.updateTitle)}
                  isAdmin={isAdmin}
                  title="Info Überschrift"
                  normalizeTypography
                />
                <LiveEditableText
                  as="p"
                  className="mt-3 text-base leading-7 text-[#ead9c3]"
                  editorKey="home.updateParagraphs.0"
                  initialHtml={resolveLiveHtml(liveEditor, 'home.updateParagraphs.0', home.updateParagraphs[0] || '')}
                  isAdmin={isAdmin}
                  title="Info Text"
                  normalizeTypography
                />
              </LiveResizableBox>

              <LiveResizableBox
                boxKey="home.simple.sponsorinfo.box"
                initialStyle={resolveLiveBoxStyle(liveEditor, 'home.simple.sponsorinfo.box')}
                isAdmin={isAdmin}
                className="rounded-[1.4rem] border border-white/10 bg-[linear-gradient(180deg,rgba(22,14,10,0.92)_0%,rgba(10,7,5,0.85)_100%)] px-6 py-6 shadow-[0_18px_40px_rgba(0,0,0,0.22)]"
              >
                <LiveEditableText
                  as="h3"
                  className="text-xl font-black text-white"
                  editorKey="home.closingTitle"
                  initialHtml={resolveLiveHtml(liveEditor, 'home.closingTitle', home.closingTitle)}
                  isAdmin={isAdmin}
                  title="Sponsor Info Überschrift"
                  normalizeTypography
                />
                <LiveEditableText
                  as="p"
                  className="mt-3 text-base leading-7 text-[#ead9c3]"
                  editorKey="home.closingLead"
                  initialHtml={resolveLiveHtml(liveEditor, 'home.closingLead', home.closingLead)}
                  isAdmin={isAdmin}
                  title="Sponsor Info Text"
                  normalizeTypography
                />
                {isAdmin ? (
                  <div className="mt-4 flex w-full items-center justify-center gap-2 rounded-[0.65rem] border border-[color:var(--color-accent)] bg-[linear-gradient(180deg,var(--color-accent)_0%,var(--color-accent-strong)_54%,color-mix(in_srgb,var(--color-accent-strong)_72%,black)_100%)] px-7 py-3.5 text-base font-bold tracking-wide text-white shadow-[0_8px_20px_color-mix(in_srgb,var(--color-accent)_35%,transparent),inset_0_1px_0_color-mix(in_srgb,var(--color-accent-soft)_60%,transparent)]">
                    <LiveEditableText
                      as="span"
                      className="text-base font-bold tracking-wide text-white"
                      editorKey="home.closingPrimaryCtaLabel"
                      initialHtml={resolveLiveHtml(liveEditor, 'home.closingPrimaryCtaLabel', home.closingPrimaryCtaLabel)}
                      isAdmin={isAdmin}
                      title="Sponsor Info Buttontext"
                      normalizeTypography
                    />
                    <ArrowRight className="h-4 w-4" />
                  </div>
                ) : (
                  <Button href="/sponsoren" className="mt-4 w-full justify-center">
                    {resolveLiveHtml(liveEditor, 'home.closingPrimaryCtaLabel', home.closingPrimaryCtaLabel).replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '')}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </LiveResizableBox>
            </div>
          </div>
        </main>
        <Footer content={cms.site.footer} isAdmin={isAdmin} liveEditor={liveEditor} />
      </LiveLayoutSaveProvider>
    </>
  );
}
