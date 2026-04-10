import type { ReactNode } from 'react';
import type { CmsContent } from '@/lib/cms/schema';
import { logoutAction } from '@/app/admin/actions';
import { Footer } from './footer';
import { LiveLayoutSaveProvider } from './live-layout-save-context';
import { SiteNavigation } from './site-navigation';

interface EditablePageShellProps {
  cms: CmsContent;
  isAdmin: boolean;
  mainClassName: string;
  children: ReactNode;
}

export function EditablePageShell({ cms, isAdmin, mainClassName, children }: EditablePageShellProps) {
  return (
    <>
      <SiteNavigation
        links={cms.site.navigationLinks}
        ctaLabel={cms.site.navigationCtaLabel}
        ctaHref={cms.site.navigationCtaHref}
      />
      <LiveLayoutSaveProvider enabled={isAdmin}>
        <main className={mainClassName}>
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
              <div className="fixed bottom-4 right-4 z-[60] max-w-sm rounded-2xl border border-[#ff9d3c]/50 bg-[#130d09]/92 px-4 py-3 text-sm text-[#f4e5d2] shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-sm">
                Klick auf Text zum Bearbeiten. Ziehe unten rechts an Kästchen, um ihre Größe zu ändern.
              </div>
            </>
          ) : null}
          {children}
        </main>
        <Footer content={cms.site.footer} isAdmin={isAdmin} liveEditor={cms.site.liveEditor} />
      </LiveLayoutSaveProvider>
    </>
  );
}