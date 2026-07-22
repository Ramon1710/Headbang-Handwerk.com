import type { Metadata } from 'next';
import { EditablePageShell } from '@/components/editable-page-shell';
import { LiveEditableText } from '@/components/live-editable-text';
import { LiveResizableBox } from '@/components/live-resizable-box';
import { isAdminAuthenticated } from '@/lib/cms/auth';
import { resolveLiveBoxStyle, resolveLiveHtml } from '@/lib/cms/live-editor';
import { getCmsContent } from '@/lib/cms/storage';
import { GameClient } from './game-client';

export const metadata: Metadata = {
  title: 'Game – Der Baustellen-Rocker',
  description: 'Das Headbang-Handwerk Minigame: Werkzeuge und Biere fangen, Nägeln ausweichen und bis zum Feierabend durchhalten.',
};

export default async function GamePage({
  searchParams,
}: {
  searchParams?: Promise<{ view?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const cms = await getCmsContent();
  const isAuthenticatedAdmin = await isAdminAuthenticated();
  const isAdmin = isAuthenticatedAdmin && params?.view !== 'user';

  return (
    <EditablePageShell cms={cms} isAdmin={isAdmin} mainClassName="min-h-screen bg-transparent pt-28 pb-24">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center">
        <LiveResizableBox
          boxKey="game.hero.box"
          initialStyle={resolveLiveBoxStyle(cms.site.liveEditor, 'game.hero.box')}
          isAdmin={isAdmin}
          className="copy-center content-flow mb-8 w-full"
        >
          <p className="text-center text-xs font-semibold uppercase tracking-[0.38em] text-[color:var(--color-accent-soft)]">Game</p>
          <h1 className="page-title text-center">
            <LiveEditableText
              as="span"
              className="inline"
              editorKey="game.title"
              initialHtml={resolveLiveHtml(cms.site.liveEditor, 'game.title', 'Der')}
              isAdmin={isAdmin}
              title="Game Titel Anfang"
            />{' '}
            <LiveEditableText
              as="span"
              className="inline text-[color:var(--color-accent)]"
              editorKey="game.titleAccent"
              initialHtml={resolveLiveHtml(cms.site.liveEditor, 'game.titleAccent', 'Baustellen-Rocker')}
              isAdmin={isAdmin}
              title="Game Titel Hervorhebung"
            />
          </h1>
          <LiveEditableText
            as="p"
            className="mx-auto max-w-3xl body-copy-lg text-center"
            editorKey="game.lead"
            initialHtml={resolveLiveHtml(cms.site.liveEditor, 'game.lead', 'Fang Werkzeuge und Biere mit deinem Helm, weiche rostigen Nägeln aus und halte bis zum Feierabend durch.')}
            isAdmin={isAdmin}
            title="Game Einleitung"
          />
        </LiveResizableBox>

        <LiveResizableBox
          boxKey="game.canvas.box"
          initialStyle={resolveLiveBoxStyle(cms.site.liveEditor, 'game.canvas.box')}
          isAdmin={isAdmin}
          className="mx-auto w-full max-w-[760px]"
        >
          <GameClient />
        </LiveResizableBox>
      </div>
    </EditablePageShell>
  );
}