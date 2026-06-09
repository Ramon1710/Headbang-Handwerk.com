import type { Metadata } from 'next';
import { EditablePageShell } from '@/components/editable-page-shell';
import { LiveEditableText } from '@/components/live-editable-text';
import { LiveResizableBox } from '@/components/live-resizable-box';
import { Button } from '@/components/ui/button';
import { updateAboutTeamImagesAction } from '@/app/admin/media-actions';
import { isAdminAuthenticated } from '@/lib/cms/auth';
import { resolveLiveBoxStyle, resolveLiveHtml, resolveLiveRichHtml, textParagraphHtml } from '@/lib/cms/live-editor';
import { getCmsContent } from '@/lib/cms/storage';
import { Heart, Target, Rocket } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Über uns – Headbang Handwerk',
};

const values = [
  { icon: Heart, title: 'Leidenschaft', desc: 'Wir lieben Metal und Handwerk gleichermaßen – und das spürt man bei allem, was wir tun.' },
  { icon: Target, title: 'Mission', desc: 'Nachwuchs fürs Handwerk gewinnen, dort wo die Jugend wirklich ist: auf Festivals.' },
  { icon: Rocket, title: 'Vision', desc: 'Headbang Handwerk europaweit auf allen großen Metal-Festivals etablieren.' },
];

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

export default async function UeberUnsPage({
  searchParams,
}: {
  searchParams?: Promise<{ view?: string; adminSaved?: string; mediaError?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const cms = await getCmsContent();
  const isAuthenticatedAdmin = await isAdminAuthenticated();
  const isAdmin = isAuthenticatedAdmin && params?.view !== 'user';
  const about = cms.site.about;
  const liveEditor = cms.site.liveEditor;
  const mediaErrorMessage = getMediaErrorMessage(params?.mediaError);

  return (
    <EditablePageShell cms={cms} isAdmin={isAdmin} mainClassName="min-h-screen bg-transparent pt-28 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isAdmin ? (
            <section className="mb-10 rounded-[1.8rem] border border-[color:var(--color-border)]/70 bg-[linear-gradient(180deg,rgba(22,14,10,0.88)_0%,rgba(10,7,5,0.82)_100%)] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[color:var(--color-accent-soft)]">Team Bilder</p>
                  <h2 className="mt-2 text-2xl font-black text-white">Fotos für das Team hochladen und tauschen</h2>
                </div>
                <div className="text-sm font-semibold">
                  {params?.adminSaved ? <p className="rounded-xl border border-green-500/30 bg-green-950/40 px-4 py-3 text-green-200">Team-Bilder gespeichert.</p> : null}
                  {mediaErrorMessage ? <p className="rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-red-200">{mediaErrorMessage}</p> : null}
                </div>
              </div>

              <form action={updateAboutTeamImagesAction} className="mt-6 grid gap-4 lg:grid-cols-3">
                {about.teamRoles.map((role, index) => (
                  <div key={`${role}-${index}`} className="rounded-[1.3rem] border border-white/8 bg-black/15 p-4">
                    <p className="mb-3 text-sm font-semibold text-white">Teamfeld {index + 1}</p>
                    <input type="file" name={`teamImageFile${index}`} accept=".png,.jpg,.jpeg,.webp" className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white file:mr-4 file:rounded-lg file:border-0 file:bg-[color:var(--color-accent)] file:px-4 file:py-2 file:font-semibold file:text-black" />
                    <label className="mt-3 flex items-center gap-3 rounded-xl border border-white/8 bg-black/10 px-4 py-3 text-sm text-[color:var(--color-muted)]">
                      <input type="checkbox" name={`removeTeamImage${index}`} className="h-4 w-4" />
                      Bild entfernen
                    </label>
                  </div>
                ))}
                <div className="lg:col-span-3 flex justify-end">
                  <button type="submit" className="rounded-xl bg-[color:var(--color-accent)] px-5 py-3 text-sm font-black text-black transition hover:brightness-110">Team-Bilder speichern</button>
                </div>
              </form>
            </section>
          ) : null}

          <LiveResizableBox boxKey="about.intro.box" initialStyle={resolveLiveBoxStyle(liveEditor, 'about.intro.box')} isAdmin={isAdmin} className="copy-center content-flow mb-16">
            <h1 className="mb-6 text-4xl font-black text-white sm:text-5xl">
              <LiveEditableText as="span" className="inline" editorKey="about.title" initialHtml={resolveLiveHtml(liveEditor, 'about.title', about.title)} isAdmin={isAdmin} title="Über uns Titel" />{' '}
              <LiveEditableText as="span" className="inline text-[color:var(--color-accent)]" editorKey="about.accentWord" initialHtml={resolveLiveHtml(liveEditor, 'about.accentWord', about.accentWord)} isAdmin={isAdmin} title="Über uns Hervorhebung" />
            </h1>
            {about.introParagraphs.map((paragraph, index) => (
              <LiveEditableText
                key={`${index}-${paragraph.slice(0, 24)}`}
                as="p"
                className={index === 0 ? 'text-lg leading-relaxed text-gray-400' : 'leading-relaxed text-gray-400'}
                editorKey={`about.introParagraphs.${index}`}
                initialHtml={resolveLiveHtml(liveEditor, `about.introParagraphs.${index}`, paragraph)}
                isAdmin={isAdmin}
                title={`Über uns Absatz ${index + 1}`}
              />
            ))}
          </LiveResizableBox>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {values.map(({ icon: Icon }, index) => {
              const value = about.values[index];
              const valueKey = value?.title || `value-${index}`;

              return (
                <LiveResizableBox key={valueKey} boxKey={`about.values.${index}.box`} initialStyle={resolveLiveBoxStyle(liveEditor, `about.values.${index}.box`)} isAdmin={isAdmin} className="section-shell p-6 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--color-accent)]/10 ring-1 ring-[color:var(--color-accent)]/20">
                    <Icon className="h-6 w-6 text-[color:var(--color-accent)]" />
                  </div>
                  <LiveEditableText as="div" className="mx-auto max-w-xs" editorKey={`about.values.${index}.content`} initialHtml={resolveLiveRichHtml(liveEditor, `about.values.${index}.content`, `${textParagraphHtml(value?.title || '', 'mb-2 text-lg font-bold text-white')}${textParagraphHtml(value?.description || '', 'text-sm leading-relaxed text-gray-300')}`)} isAdmin={isAdmin} title={`Über uns Wert ${index + 1}`} />
                </LiveResizableBox>
              );
            })}
          </div>

          <LiveResizableBox boxKey="about.team.box" initialStyle={resolveLiveBoxStyle(liveEditor, 'about.team.box')} isAdmin={isAdmin} className="section-shell p-8 mb-12 text-center">
            <LiveEditableText as="h2" className="mb-6 text-2xl font-bold text-white" editorKey="about.teamTitle" initialHtml={resolveLiveHtml(liveEditor, 'about.teamTitle', about.teamTitle)} isAdmin={isAdmin} title="Über uns Team Titel" />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {about.teamRoles.map((role, index) => (
                <div key={`${role}-${index}`} className="flex h-full flex-row items-center justify-center gap-4 text-left md:flex-col md:text-center">
                  <LiveResizableBox boxKey={`about.teamRoles.${index}.box`} initialStyle={resolveLiveBoxStyle(liveEditor, `about.teamRoles.${index}.box`)} isAdmin={isAdmin} className="w-[10rem] shrink-0 md:w-full">
                    <div className="h-40 w-full overflow-hidden rounded-[1.4rem] bg-[linear-gradient(180deg,rgba(42,31,24,0.95)_0%,rgba(21,15,11,0.86)_100%)] ring-1 ring-white/6">
                      {about.teamImages[index]?.assetUrl ? (
                        <img src={about.teamImages[index].assetUrl} alt={about.teamImages[index].assetName || role} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-5xl text-gray-600">👤</div>
                      )}
                    </div>
                  </LiveResizableBox>
                  <div className="flex max-w-[12rem] flex-1 items-center md:justify-center">
                    <LiveEditableText as="p" className="text-xs leading-tight text-gray-400 md:text-center" editorKey={`about.teamRoles.${index}`} initialHtml={resolveLiveHtml(liveEditor, `about.teamRoles.${index}`, role)} isAdmin={isAdmin} title={`Über uns Teamrolle ${index + 1}`} />
                  </div>
                </div>
              ))}
            </div>
          </LiveResizableBox>

          <LiveResizableBox boxKey="about.cta.box" initialStyle={resolveLiveBoxStyle(liveEditor, 'about.cta.box')} isAdmin={isAdmin} className="text-center">
            <Button href={about.ctaHref} size="lg">
              <LiveEditableText as="span" className="inline" editorKey="about.ctaLabel" initialHtml={resolveLiveHtml(liveEditor, 'about.ctaLabel', about.ctaLabel)} isAdmin={isAdmin} title="Über uns CTA" />
            </Button>
          </LiveResizableBox>
        </div>
    </EditablePageShell>
  );
}
