import type { Metadata } from 'next';
import { EditablePageShell } from '@/components/editable-page-shell';
import { LiveEditableText } from '@/components/live-editable-text';
import { LiveResizableBox } from '@/components/live-resizable-box';
import { Button } from '@/components/ui/button';
import { updateAboutTeamImagesAction } from '@/app/admin/media-actions';
import { isAdminAuthenticated } from '@/lib/cms/auth';
import { resolveLiveBoxStyle, resolveLiveHtml, resolveLiveRichHtml, textParagraphHtml } from '@/lib/cms/live-editor';
import { getCmsContent } from '@/lib/cms/storage';
import { ArrowRight, Drum, Flame, Hammer, Rocket, ShieldCheck, Users2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Über uns – Headbang Handwerk',
};

const sectionIcons = [Users2, Hammer, Rocket, ShieldCheck, Flame, Drum];

function getSectionFallbackHtml(section: Awaited<ReturnType<typeof getCmsContent>>['site']['about']['sections'][number]) {
  const paragraphs = section.paragraphs.map((paragraph) => textParagraphHtml(paragraph, 'body-copy text-[#e8d9c7]')).join('');
  const bullets = section.bullets?.length
    ? `<ul class="mt-5 space-y-3 text-sm leading-7 text-[#f0e3d3]">${section.bullets
        .map((bullet) => `<li class="flex items-start gap-3"><span class="mt-1 h-2.5 w-2.5 rounded-full bg-[color:var(--color-accent)]"></span><span>${bullet}</span></li>`)
        .join('')}</ul>`
    : '';

  return `${paragraphs}${bullets}`;
}

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
  const teamMembers = about.teamMembers;

  return (
    <EditablePageShell cms={cms} isAdmin={isAdmin} mainClassName="min-h-screen bg-transparent pt-28 pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {isAdmin ? (
            <section className="mb-10 rounded-[1.8rem] border border-[color:var(--color-border)]/70 bg-[linear-gradient(180deg,rgba(22,14,10,0.88)_0%,rgba(10,7,5,0.82)_100%)] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[color:var(--color-accent-soft)]">Team Bilder</p>
                  <h2 className="mt-2 text-2xl font-black text-white">Fotos und Alternativtexte für das Team pflegen</h2>
                </div>
                <div className="text-sm font-semibold">
                  {params?.adminSaved ? <p className="rounded-xl border border-green-500/30 bg-green-950/40 px-4 py-3 text-green-200">Team-Bilder gespeichert.</p> : null}
                  {mediaErrorMessage ? <p className="rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-red-200">{mediaErrorMessage}</p> : null}
                </div>
              </div>

              <form action={updateAboutTeamImagesAction} className="mt-6 grid gap-4 lg:grid-cols-3">
                {teamMembers.map((member, index) => (
                  <div key={`${member.role}-${index}`} className="rounded-[1.3rem] border border-white/8 bg-black/15 p-4">
                    <p className="mb-3 text-sm font-semibold text-white">Teamfeld {index + 1}</p>
                    <label className="mb-3 block">
                      <span className="mb-2 block text-sm font-semibold text-[#e7d7c5]">Alternativtext</span>
                      <input name={`teamImageAlt${index}`} defaultValue={member.imageAlt || member.role} className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                    </label>
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

          <LiveResizableBox boxKey="about.hero.box" initialStyle={resolveLiveBoxStyle(liveEditor, 'about.hero.box')} isAdmin={isAdmin} allowPosition={false} applySavedHeight={false} className="copy-center content-flow mb-14 text-center">
            <p className="eyebrow text-[color:var(--color-accent-soft)]">Vereinsporträt</p>
            <h1 className="page-title mb-6">
              <LiveEditableText as="span" className="inline" editorKey="about.title" initialHtml={resolveLiveHtml(liveEditor, 'about.title', about.title)} isAdmin={isAdmin} title="Über uns Titel" />{' '}
              <LiveEditableText as="span" className="inline" editorKey="about.accentWord" initialHtml={resolveLiveHtml(liveEditor, 'about.accentWord', about.accentWord)} isAdmin={isAdmin} title="Über uns Hervorhebung" />
            </h1>
            <div className="mx-auto max-w-4xl space-y-5">
              {about.introParagraphs.map((paragraph, index) => (
                <LiveEditableText
                  key={`${index}-${paragraph.slice(0, 24)}`}
                  as="p"
                  className={index === 0 ? 'body-copy-lg text-[#f0e3d3]' : 'body-copy text-[#dccab7]'}
                  editorKey={`about.introParagraphs.${index}`}
                  initialHtml={resolveLiveHtml(liveEditor, `about.introParagraphs.${index}`, paragraph)}
                  isAdmin={isAdmin}
                  title={`Über uns Absatz ${index + 1}`}
                />
              ))}
            </div>
          </LiveResizableBox>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {about.sections.map((section, index) => {
              const Icon = sectionIcons[index] || ArrowRight;

              return (
                <LiveResizableBox
                  key={`${section.title}-${index}`}
                  boxKey={`about.sections.${index}.box`}
                  initialStyle={resolveLiveBoxStyle(liveEditor, `about.sections.${index}.box`)}
                  isAdmin={isAdmin}
                  allowPosition={false}
                  applySavedHeight={false}
                  className={`section-shell content-box h-full ${index === 0 || index === 5 ? 'xl:col-span-2' : ''}`}
                >
                  <div className="mb-5 flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--color-accent)]/10 ring-1 ring-[color:var(--color-accent)]/20">
                      <Icon className="h-5 w-5 text-[color:var(--color-accent)]" />
                    </div>
                    <div>
                      <LiveEditableText as="p" className="text-xs font-black uppercase tracking-[0.22em] text-[color:var(--color-accent-soft)]" editorKey={`about.sections.${index}.eyebrow`} initialHtml={resolveLiveHtml(liveEditor, `about.sections.${index}.eyebrow`, section.eyebrow)} isAdmin={isAdmin} title={`Über uns Abschnitt ${index + 1} Augenbraue`} />
                      <LiveEditableText as="h2" className="section-title mt-2 text-[1.9rem] leading-[0.98] text-white" editorKey={`about.sections.${index}.title`} initialHtml={resolveLiveHtml(liveEditor, `about.sections.${index}.title`, section.title)} isAdmin={isAdmin} title={`Über uns Abschnitt ${index + 1} Titel`} />
                    </div>
                  </div>
                  <LiveEditableText as="div" className="content-flow [&_li]:list-none [&_li]:pl-0 [&_p]:text-[#e8d9c7] [&_span]:inline-block" editorKey={`about.sections.${index}.content`} initialHtml={resolveLiveRichHtml(liveEditor, `about.sections.${index}.content`, getSectionFallbackHtml(section))} isAdmin={isAdmin} title={`Über uns Abschnitt ${index + 1} Inhalt`} normalizeTypography />
                </LiveResizableBox>
              );
            })}
          </div>

          <LiveResizableBox boxKey="about.team.box" initialStyle={resolveLiveBoxStyle(liveEditor, 'about.team.box')} isAdmin={isAdmin} allowPosition={false} applySavedHeight={false} className="section-shell content-box mb-12 mt-16 text-center">
            <LiveEditableText as="h2" className="section-title mb-4" editorKey="about.teamTitle" initialHtml={resolveLiveHtml(liveEditor, 'about.teamTitle', about.teamTitle)} isAdmin={isAdmin} title="Über uns Team Titel" />
            <LiveEditableText as="p" className="body-copy mx-auto mb-8 max-w-3xl text-[#dbcbb9]" editorKey="about.teamLead" initialHtml={resolveLiveHtml(liveEditor, 'about.teamLead', about.teamLead)} isAdmin={isAdmin} title="Über uns Team Einleitung" normalizeTypography />
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {teamMembers.map((member, index) => (
                <LiveResizableBox key={`${member.role}-${index}`} boxKey={`about.teamMembers.${index}.box`} initialStyle={resolveLiveBoxStyle(liveEditor, `about.teamMembers.${index}.box`)} isAdmin={isAdmin} allowPosition={false} applySavedHeight={false} className="h-full rounded-[1.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(28,19,14,0.96)_0%,rgba(11,8,6,0.9)_100%)] p-4 text-left shadow-[0_18px_36px_rgba(0,0,0,0.22)]">
                  <div className="overflow-hidden rounded-[1.2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(42,31,24,0.95)_0%,rgba(21,15,11,0.86)_100%)]">
                    {member.image.assetUrl ? (
                      <img src={member.image.assetUrl} alt={member.imageAlt || member.role} className="h-64 w-full object-cover" />
                    ) : (
                      <div className="flex h-64 items-center justify-center text-center text-sm font-semibold uppercase tracking-[0.18em] text-[#92745b]">
                        Bild folgt
                      </div>
                    )}
                  </div>
                  <div className="mt-4 space-y-3">
                    <LiveEditableText as="h3" className="text-lg font-black text-white" editorKey={`about.teamMembers.${index}.role`} initialHtml={resolveLiveHtml(liveEditor, `about.teamMembers.${index}.role`, member.role)} isAdmin={isAdmin} title={`Über uns Teamrolle ${index + 1}`} />
                    <LiveEditableText as="p" className="body-copy text-sm text-[#dccab7]" editorKey={`about.teamMembers.${index}.description`} initialHtml={resolveLiveHtml(liveEditor, `about.teamMembers.${index}.description`, member.description)} isAdmin={isAdmin} title={`Über uns Teamtext ${index + 1}`} normalizeTypography />
                  </div>
                </LiveResizableBox>
              ))}
            </div>
          </LiveResizableBox>

          <LiveResizableBox boxKey="about.closing.box" initialStyle={resolveLiveBoxStyle(liveEditor, 'about.closing.box')} isAdmin={isAdmin} allowPosition={false} applySavedHeight={false} className="overflow-hidden rounded-[2rem] border border-[color:var(--color-border)]/70 bg-[linear-gradient(135deg,rgba(255,122,0,0.14)_0%,rgba(19,13,9,0.92)_34%,rgba(10,7,5,0.96)_100%)] px-6 py-10 text-center shadow-[0_24px_60px_rgba(0,0,0,0.28)] sm:px-10">
            <LiveEditableText as="p" className="text-xs font-black uppercase tracking-[0.22em] text-[color:var(--color-accent-soft)]" editorKey="about.closingEyebrow" initialHtml={resolveLiveHtml(liveEditor, 'about.closingEyebrow', about.closingEyebrow)} isAdmin={isAdmin} title="Über uns Abschluss Eyebrow" />
            <LiveEditableText as="h2" className="section-title mx-auto mt-4 max-w-3xl text-white" editorKey="about.closingTitle" initialHtml={resolveLiveHtml(liveEditor, 'about.closingTitle', about.closingTitle)} isAdmin={isAdmin} title="Über uns Abschluss Titel" />
            <LiveEditableText as="p" className="body-copy mx-auto mt-5 max-w-2xl text-[#ecdcc9]" editorKey="about.closingBody" initialHtml={resolveLiveHtml(liveEditor, 'about.closingBody', about.closingBody)} isAdmin={isAdmin} title="Über uns Abschluss Text" normalizeTypography />
            <div className="mt-8 flex justify-center">
              <Button href={about.ctaHref} size="lg">
                <LiveEditableText as="span" className="inline" editorKey="about.ctaLabel" initialHtml={resolveLiveHtml(liveEditor, 'about.ctaLabel', about.ctaLabel)} isAdmin={isAdmin} title="Über uns CTA" />
              </Button>
            </div>
          </LiveResizableBox>
        </div>
    </EditablePageShell>
  );
}
