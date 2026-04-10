import type { Metadata } from 'next';
import { EditablePageShell } from '@/components/editable-page-shell';
import { LiveEditableText } from '@/components/live-editable-text';
import { LiveResizableBox } from '@/components/live-resizable-box';
import { Button } from '@/components/ui/button';
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

export default async function UeberUnsPage({
  searchParams,
}: {
  searchParams?: Promise<{ view?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const cms = await getCmsContent();
  const isAuthenticatedAdmin = await isAdminAuthenticated();
  const isAdmin = isAuthenticatedAdmin && params?.view !== 'user';
  const about = cms.site.about;
  const liveEditor = cms.site.liveEditor;

  return (
    <EditablePageShell cms={cms} isAdmin={isAdmin} mainClassName="min-h-screen bg-transparent pt-28 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                <LiveResizableBox key={role} boxKey={`about.teamRoles.${index}.box`} initialStyle={resolveLiveBoxStyle(liveEditor, `about.teamRoles.${index}.box`)} isAdmin={isAdmin} className="text-center">
                  <div className="w-20 h-20 rounded-full bg-[linear-gradient(180deg,rgba(42,31,24,0.95)_0%,rgba(21,15,11,0.86)_100%)] ring-1 ring-white/6 mx-auto mb-3 flex items-center justify-center text-gray-600 text-2xl">
                    👤
                  </div>
                  <LiveEditableText as="p" className="text-sm text-gray-400" editorKey={`about.teamRoles.${index}`} initialHtml={resolveLiveHtml(liveEditor, `about.teamRoles.${index}`, role)} isAdmin={isAdmin} title={`Über uns Teamrolle ${index + 1}`} />
                </LiveResizableBox>
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
