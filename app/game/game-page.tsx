import type { Metadata } from 'next';
import { EditablePageShell } from '@/components/editable-page-shell';
import { LiveEditableText } from '@/components/live-editable-text';
import { LiveResizableBox } from '@/components/live-resizable-box';
import { isAdminAuthenticated } from '@/lib/cms/auth';
import { resolveLiveBoxStyle, resolveLiveHtml, resolveLiveRichHtml } from '@/lib/cms/live-editor';
import { getCmsContent } from '@/lib/cms/storage';
import { redirect } from 'next/navigation';
import { GameClient } from './game-client';

export const metadata: Metadata = {
  title: 'Game – Headbang Minigames',
  description: 'Die Headbang-Handwerk Minigames mit Baustellen-Rocker und Hühnerjagd auf einer gemeinsamen Spielseite.',
};

const GAME_OPTIONS = {
  'baustellen-rocker': {
    label: 'Baustellen-Rocker',
    eyebrow: 'Game',
    titleStart: 'Der',
    titleAccent: 'Baustellen-Rocker',
    lead: 'Fang Werkzeuge und Biere mit deinem Helm, weiche rostigen Nägeln aus und halte bis zum Feierabend durch.',
  },
  huehnerjagt: {
    label: 'Hühnerjagd',
    eyebrow: 'Game',
    titleStart: 'Headbang',
    titleAccent: 'Hühnerjagd',
    lead: 'Triff die fliegenden Festival-Hühner, sammle Punkte und zocke die Hühnerjagd direkt im bekannten Game-Rahmen der Website.',
  },
} as const;

type GameMode = keyof typeof GAME_OPTIONS;

function resolveGameMode(value: string | undefined): GameMode {
  return value === 'huehnerjagt' || value === 'huenerjagd' ? 'huehnerjagt' : 'baustellen-rocker';
}

export default async function GamePage({
  searchParams,
}: {
  searchParams?: Promise<{ view?: string; game?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const cms = await getCmsContent();
  const isAuthenticatedAdmin = await isAdminAuthenticated();
  const isAdmin = isAuthenticatedAdmin && params?.view !== 'user';

  if (params?.game === 'huehnerjagt') {
    redirect(`/game?game=huenerjagd${params?.view === 'user' ? '&view=user' : ''}`);
  }

  const selectedGame = resolveGameMode(params?.game);
  const selectedOption = GAME_OPTIONS[selectedGame];
  const viewSuffix = params?.view === 'user' ? '&view=user' : '';

  return (
    <EditablePageShell cms={cms} isAdmin={isAdmin} mainClassName="min-h-screen bg-transparent pt-28 pb-24">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center">
        <LiveResizableBox
          boxKey="game.hero.box"
          initialStyle={resolveLiveBoxStyle(cms.site.liveEditor, 'game.hero.box')}
          isAdmin={isAdmin}
          className="copy-center content-flow mb-8 w-full"
        >
          <p className="text-center text-xs font-semibold uppercase tracking-[0.38em] text-[color:var(--color-accent-soft)]">{selectedOption.eyebrow}</p>
          <h1 className="page-title text-center">
            {selectedGame === 'baustellen-rocker' ? (
              <>
                <LiveEditableText
                  as="span"
                  className="inline"
                  editorKey="game.title"
                  initialHtml={resolveLiveHtml(cms.site.liveEditor, 'game.title', selectedOption.titleStart)}
                  isAdmin={isAdmin}
                  title="Game Titel Anfang"
                />{' '}
                <LiveEditableText
                  as="span"
                  className="inline text-[color:var(--color-accent)]"
                  editorKey="game.titleAccent"
                  initialHtml={resolveLiveHtml(cms.site.liveEditor, 'game.titleAccent', selectedOption.titleAccent)}
                  isAdmin={isAdmin}
                  title="Game Titel Hervorhebung"
                />
              </>
            ) : (
              <>
                <span className="inline">{selectedOption.titleStart}</span>{' '}
                <span className="inline text-[color:var(--color-accent)]">{selectedOption.titleAccent}</span>
              </>
            )}
          </h1>
          {selectedGame === 'baustellen-rocker' ? (
            <LiveEditableText
              as="div"
              className="mx-auto max-w-3xl body-copy-lg text-center [&_div]:mb-4 [&_div:last-child]:mb-0 [&_p]:mb-4 [&_p:last-child]:mb-0"
              editorKey="game.lead"
              initialHtml={resolveLiveRichHtml(cms.site.liveEditor, 'game.lead', `<p>${selectedOption.lead}</p>`)}
              isAdmin={isAdmin}
              title="Game Einleitung"
            />
          ) : (
            <p className="mx-auto max-w-3xl body-copy-lg text-center">{selectedOption.lead}</p>
          )}

          <div className="mx-auto flex w-full max-w-3xl flex-wrap justify-center gap-3">
            <a
              href={`/game?game=baustellen-rocker${viewSuffix}`}
              className={`rounded-2xl border px-5 py-3 text-sm font-black uppercase tracking-[0.18em] transition ${
                selectedGame === 'baustellen-rocker'
                  ? 'border-[color:var(--color-accent-soft)] bg-[linear-gradient(180deg,rgba(255,122,0,0.96)_0%,rgba(134,56,0,0.98)_100%)] text-black'
                  : 'border-[color:var(--color-border)] bg-[color:var(--color-surface)]/75 text-[color:var(--color-accent-soft)] hover:border-[color:var(--color-accent)]'
              }`}
            >
              {GAME_OPTIONS['baustellen-rocker'].label}
            </a>
            <a
              href={`/game?game=huenerjagd${viewSuffix}`}
              className={`rounded-2xl border px-5 py-3 text-sm font-black uppercase tracking-[0.18em] transition ${
                selectedGame === 'huehnerjagt'
                  ? 'border-[color:var(--color-accent-soft)] bg-[linear-gradient(180deg,rgba(255,122,0,0.96)_0%,rgba(134,56,0,0.98)_100%)] text-black'
                  : 'border-[color:var(--color-border)] bg-[color:var(--color-surface)]/75 text-[color:var(--color-accent-soft)] hover:border-[color:var(--color-accent)]'
              }`}
            >
              {GAME_OPTIONS.huehnerjagt.label}
            </a>
          </div>
        </LiveResizableBox>

        {selectedGame === 'baustellen-rocker' ? (
          <LiveResizableBox
            boxKey="game.canvas.box"
            initialStyle={resolveLiveBoxStyle(cms.site.liveEditor, 'game.canvas.box')}
            isAdmin={isAdmin}
            className="mx-auto w-full max-w-[760px]"
          >
            <GameClient />
          </LiveResizableBox>
        ) : (
          <div className="mx-auto w-full max-w-[860px] px-4 sm:px-6">
            <section className="w-full">
              <div className="mb-4 rounded-2xl border border-[color:var(--color-border)] bg-[linear-gradient(180deg,rgba(21,17,14,0.84)_0%,rgba(11,8,7,0.9)_100%)] px-4 py-4 text-center shadow-[0_18px_40px_rgba(0,0,0,0.25)]">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-accent-soft)]">Steuerung</p>
                <p className="mt-2 body-copy text-[color:var(--color-muted)]">
                  Desktop: zielen und schießen per Maus oder Touchpad. Handy: direkt im Spielfeld tippen. Der globale Highscore der Hühnerjagd bleibt erhalten.
                </p>
              </div>

              <div className="relative overflow-hidden rounded-[1.35rem] border-4 border-[color:var(--color-border)] bg-[radial-gradient(ellipse_at_center,rgba(31,24,20,1)_0%,rgba(5,5,5,1)_100%)] shadow-[0_0_25px_rgba(255,255,255,0.12),inset_0_0_30px_rgba(0,0,0,1)]">
                <iframe
                  src="/huehnerjagt/embed"
                  title="Headbang Hühnerjagd"
                  className="block h-[84svh] min-h-[720px] w-full border-0 bg-black sm:h-[980px]"
                  loading="eager"
                />
              </div>

              <p className="mt-4 text-center text-sm text-[color:var(--color-muted)]">
                Beide Spiele liegen jetzt gesammelt auf der Game-Seite und lassen sich hier direkt umschalten.
              </p>
            </section>
          </div>
        )}
      </div>
    </EditablePageShell>
  );
}