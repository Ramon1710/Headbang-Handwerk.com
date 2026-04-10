import { Instagram, Facebook, Youtube } from 'lucide-react';
import type { FooterContent, LiveEditorContent } from '@/lib/cms/schema';
import { resolveLiveHtml, resolveLiveBoxStyle } from '@/lib/cms/live-editor';
import { LiveEditableText } from './live-editable-text';
import { LiveResizableBox } from './live-resizable-box';

const icons = {
  facebook: Facebook,
  instagram: Instagram,
  youtube: Youtube,
};

export function Footer({
  content,
  isAdmin = false,
  liveEditor,
}: {
  content: FooterContent;
  isAdmin?: boolean;
  liveEditor?: LiveEditorContent;
}) {
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-16 border-t border-[color:var(--color-border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-background)_88%,black)_0%,var(--color-background)_100%)]">
      <div className="fire-divider" />
      <div className="w-full px-4 py-14 text-center sm:px-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center">
          <LiveResizableBox
            boxKey="footer.brand.box"
            initialStyle={resolveLiveBoxStyle(liveEditor, 'footer.brand.box')}
            isAdmin={isAdmin}
            className="mb-5"
          >
            <p className="text-[1.9rem] font-semibold text-[color:var(--color-accent-soft)] sm:text-[2.2rem]">
              <LiveEditableText
                as="span"
                className="inline"
                editorKey="footer.brandHeadline"
                initialHtml={resolveLiveHtml(liveEditor, 'footer.brandHeadline', content.brandHeadline)}
                isAdmin={isAdmin}
                title="Footer Überschrift"
              />{' '}
              <LiveEditableText
                as="span"
                className="inline text-[color:var(--color-foreground)]"
                editorKey="footer.brandHighlight"
                initialHtml={resolveLiveHtml(liveEditor, 'footer.brandHighlight', content.brandHighlight)}
                isAdmin={isAdmin}
                title="Footer Hervorhebung"
              />
            </p>
          </LiveResizableBox>

          <LiveResizableBox
            boxKey="footer.social.box"
            initialStyle={resolveLiveBoxStyle(liveEditor, 'footer.social.box')}
            isAdmin={isAdmin}
            className="mb-10"
          >
            <div className="flex items-center justify-center gap-4">
            {content.socialLinks.map(({ platform, label, href }) => {
              const Icon = icons[platform];

              return (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-surface-2)_92%,black)_0%,color-mix(in_srgb,var(--color-surface)_76%,black)_100%)] text-[color:var(--color-accent-soft)] ring-1 ring-[color:var(--color-border)] transition-all hover:text-[color:var(--color-foreground)] hover:ring-[color:var(--color-accent)]"
              >
                <Icon className="w-5 h-5" />
              </a>
              );
            })}
            </div>
          </LiveResizableBox>

          <div className="flex w-full justify-center">
            <LiveResizableBox
              boxKey="footer.legal.box"
              initialStyle={resolveLiveBoxStyle(liveEditor, 'footer.legal.box')}
              isAdmin={isAdmin}
              className="w-full max-w-4xl"
            >
              <div className="flex w-full flex-wrap items-center justify-center gap-x-5 gap-y-3 border-t border-[color:var(--color-border)] pt-5 text-center text-sm text-[color:var(--color-muted)]">
                <p>
                  © {year}{' '}
                  <LiveEditableText
                    as="span"
                    className="inline"
                    editorKey="footer.copyrightName"
                    initialHtml={resolveLiveHtml(liveEditor, 'footer.copyrightName', content.copyrightName)}
                    isAdmin={isAdmin}
                    title="Footer Copyright"
                  />
                </p>
                <a href="/impressum" className="transition-colors hover:text-[color:var(--color-accent-soft)]">Impressum</a>
                <a href="/datenschutz" className="transition-colors hover:text-[color:var(--color-accent-soft)]">Datenschutz</a>
                <a href="/agb" className="transition-colors hover:text-[color:var(--color-accent-soft)]">AGB</a>
                <a href="/kontakt" className="transition-colors hover:text-[color:var(--color-accent-soft)]">Kontakt</a>
              </div>
            </LiveResizableBox>
          </div>
        </div>
      </div>
    </footer>
  );
}
