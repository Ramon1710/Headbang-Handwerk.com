import type { Metadata } from 'next';
import { EditablePageShell } from '@/components/editable-page-shell';
import { LiveEditableText } from '@/components/live-editable-text';
import { LiveResizableBox } from '@/components/live-resizable-box';
import { updateAboutTeamImagesAction } from '@/app/admin/media-actions';
import { isAdminAuthenticated } from '@/lib/cms/auth';
import { resolveLiveBoxStyle, resolveLiveHtml, resolveLiveRichHtml } from '@/lib/cms/live-editor';
import { getCmsContent } from '@/lib/cms/storage';

export const metadata: Metadata = {
  title: 'Über uns – Headbang Handwerk',
};

const ABOUT_STORY_FALLBACK_HTML = `
<p class="mb-6 text-2xl font-black leading-tight text-white">Handwerk gehört dorthin, wo Menschen begeistert werden.</p>
<p class="mb-5">Das Handwerk ist unverzichtbar – und trotzdem oft viel zu unsichtbar. Dabei entstehen genau hier Innovationen, Leidenschaft und Zukunft.</p>
<p class="mb-5">Headbang Handwerk ist ein gemeinnütziger Verein, der neue Wege geht, um Menschen für das Handwerk zu begeistern. Gemeinsam mit Betrieben, Bildungseinrichtungen, Handwerksorganisationen, Verbänden, Veranstaltern und weiteren Partnern entwickeln wir Projekte, die Handwerk erlebbar machen und neue Zielgruppen erreichen.</p>
<p class="mb-6 text-xl font-black text-white">Wie das aussehen kann?</p>
<p class="mb-5">Wir schaffen keine klassischen Informationsstände – wir schaffen Erlebnisse.</p>
<p class="mb-4">Dazu entwickeln wir gemeinsam mit unseren Partnern unter anderem:</p>
<ul class="mb-6 space-y-3">
  <li>• Mitmachstände auf Festivals, Veranstaltungen und Messen</li>
  <li>• Handwerk zum Anfassen – von klassischen Gewerken bis zu modernen Technologien</li>
  <li>• Innovative Themen wie Smart Home, Virtual Reality, Digitalisierung oder Robotik zum Ausprobieren</li>
  <li>• Berufsorientierung durch den direkten Austausch mit Betrieben, Auszubildenden und Bildungseinrichtungen</li>
  <li>• Kooperationen zwischen Handwerk, Kultur, Musik, Bildung und Gesellschaft</li>
  <li>• Kreative Öffentlichkeitsarbeit, die zeigt, wie vielfältig, modern und spannend Handwerk heute ist</li>
</ul>
<p class="mb-5">Jedes Projekt entsteht gemeinsam mit unseren Partnern und wird individuell auf den jeweiligen Veranstaltungsort und die Zielgruppe abgestimmt. So entstehen keine Standardlösungen, sondern echte Erlebnisse mit Mehrwert – für Besucher, Betriebe und das Handwerk gleichermaßen.</p>
<p class="mb-5">Ein Beispiel dafür ist unsere Idee, Handwerk auf Festivals wie auf einem der weltweit größten Metalfestival erlebbar zu machen. Nicht mit einem klassischen Infostand, sondern mit Mitmachaktionen, innovativen Technologien, Gesprächen mit Handwerksbetrieben und kreativen Formaten, die Menschen begeistern und zeigen, was modernes Handwerk heute leisten kann.</p>
<p class="mb-5">Denn unser Ziel ist nicht ein einzelnes Festival oder ein einzelnes Projekt.</p>
<p class="mb-5">Unser Ziel ist es, das Handwerk dort sichtbar zu machen, wo Menschen zusammenkommen, begeistert werden und neue Perspektiven entdecken.</p>
<p class="mb-5">Denn wir sind überzeugt:</p>
<p class="mb-6 text-xl font-black text-white">Menschen erinnern sich nicht an Flyer. Sie erinnern sich an Erlebnisse.</p>
<p class="text-xl font-black text-white">Handwerk. Laut. Sichtbar.</p>
`;

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

          <LiveResizableBox boxKey="about.hero.box" initialStyle={resolveLiveBoxStyle(liveEditor, 'about.hero.box')} isAdmin={isAdmin} className="copy-center content-flow mb-14 text-center">
            <LiveEditableText as="h1" className="page-title mb-0" editorKey="about.pageTitle" initialHtml={resolveLiveHtml(liveEditor, 'about.pageTitle', 'Über uns')} isAdmin={isAdmin} title="Über uns Titel" />
          </LiveResizableBox>

          <LiveResizableBox boxKey="about.team.box" initialStyle={resolveLiveBoxStyle(liveEditor, 'about.team.box')} isAdmin={isAdmin} className="section-shell content-box mb-12 mt-16 text-center">
            <LiveEditableText as="h2" className="section-title mb-8" editorKey="about.teamTitle" initialHtml={resolveLiveHtml(liveEditor, 'about.teamTitle', 'Der Vorstand')} isAdmin={isAdmin} title="Über uns Team Titel" />
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {teamMembers.map((member, index) => (
                <div key={`${member.role}-${index}`} className="h-full rounded-[1.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(28,19,14,0.96)_0%,rgba(11,8,6,0.9)_100%)] p-4 text-left shadow-[0_18px_36px_rgba(0,0,0,0.22)]">
                  <LiveResizableBox
                    boxKey={`about.teamMembers.${index}.image.box`}
                    initialStyle={resolveLiveBoxStyle(liveEditor, `about.teamMembers.${index}.image.box`)}
                    isAdmin={isAdmin}
                    className="min-h-[16rem] overflow-hidden rounded-[1.2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(42,31,24,0.95)_0%,rgba(21,15,11,0.86)_100%)]"
                  >
                    {member.image.assetUrl ? (
                      <div className="flex h-full w-full items-center justify-center">
                        <img src={member.image.assetUrl} alt={member.imageAlt || member.role} className="h-full w-full object-cover object-center" />
                      </div>
                    ) : (
                      <div className="flex h-full min-h-[16rem] items-center justify-center text-center text-sm font-semibold uppercase tracking-[0.18em] text-[#92745b]">
                        Bild folgt
                      </div>
                    )}
                  </LiveResizableBox>
                  <div className="mt-4">
                    <LiveEditableText as="h3" className="text-lg font-black text-white" editorKey={`about.teamMembers.${index}.role`} initialHtml={resolveLiveHtml(liveEditor, `about.teamMembers.${index}.role`, member.role)} isAdmin={isAdmin} title={`Über uns Teamrolle ${index + 1}`} />
                  </div>
                </div>
              ))}
            </div>
          </LiveResizableBox>

          <LiveResizableBox boxKey="about.story.box" initialStyle={resolveLiveBoxStyle(liveEditor, 'about.story.box')} isAdmin={isAdmin} className="overflow-hidden rounded-[2rem] border border-[color:var(--color-border)]/70 bg-[linear-gradient(135deg,rgba(255,122,0,0.08)_0%,rgba(19,13,9,0.92)_28%,rgba(10,7,5,0.96)_100%)] px-6 py-10 shadow-[0_24px_60px_rgba(0,0,0,0.28)] sm:px-10">
            <LiveEditableText as="div" className="body-copy mx-auto max-w-4xl text-[#ecdcc9] [&_li]:list-none [&_ul]:pl-0 [&_p]:leading-8" editorKey="about.story.content" initialHtml={resolveLiveRichHtml(liveEditor, 'about.story.content', ABOUT_STORY_FALLBACK_HTML)} isAdmin={isAdmin} title="Über uns Inhalt" normalizeTypography />
          </LiveResizableBox>
        </div>
    </EditablePageShell>
  );
}
