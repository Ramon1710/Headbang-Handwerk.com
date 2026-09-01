import type { ComponentType, SVGProps } from 'react';
import { Facebook, Instagram, Mail } from 'lucide-react';
import headbangLogo from '../Headbang Handwerk e.V. Logo Final PNG.png';
import { updateFooterAction } from '@/app/admin/chrome-actions';
import type { FooterContent, FooterLink, LiveEditorContent } from '@/lib/cms/schema';
import { resolveLiveHtml, resolveLiveBoxStyle } from '@/lib/cms/live-editor';
import { isExternalUrl, normalizeSafeSocialUrl } from '@/lib/site';
import { LiveEditableText } from './live-editable-text';
import { LiveResizableBox } from './live-resizable-box';

function TikTokIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M14.5 3c.31 2.09 1.48 3.96 3.36 5.16A7.88 7.88 0 0 0 21 9.3v3.42a10.94 10.94 0 0 1-3.38-.54v4.86c0 3.82-3.09 6.92-6.92 6.92a6.92 6.92 0 1 1 0-13.84c.34 0 .68.03 1.01.08v3.5a3.8 3.8 0 0 0-1.01-.14 3.48 3.48 0 1 0 3.48 3.48V3h3.32Z" />
    </svg>
  );
}

type FooterSocialPlatform = 'facebook' | 'instagram' | 'tiktok' | 'email';

interface VisibleFooterSocialLink {
  platform: FooterSocialPlatform;
  label: string;
  href: string;
}

const icons: Record<FooterSocialPlatform, ComponentType<SVGProps<SVGSVGElement>>> = {
  facebook: Facebook,
  instagram: Instagram,
  tiktok: TikTokIcon,
  email: Mail,
};

function buildVisibleSocialLinks(content: FooterContent, resolvedContactEmail: string) {
  const links: VisibleFooterSocialLink[] = [];

  for (const platform of ['facebook', 'instagram', 'tiktok'] as const) {
    const socialLink = content.socialLinks.find((link) => link.platform === platform);
    const href = normalizeSafeSocialUrl(socialLink?.href || '');

    if (!href || !socialLink) {
      continue;
    }

    links.push({
      platform,
      label: socialLink.label,
      href,
    });
  }

  if (resolvedContactEmail) {
    links.push({
      platform: 'email',
      label: 'E-Mail',
      href: `mailto:${resolvedContactEmail}`,
    });
  }

  return links;
}

function buildEditorFooterLinks(links: FooterLink[] | undefined, length: number) {
  return Array.from({ length }, (_, index) => links?.[index] || { id: '', label: '', href: '' });
}

export function Footer({
  content,
  isAdmin = false,
  liveEditor,
  logoSrc,
  contactEmail,
}: {
  content: FooterContent;
  isAdmin?: boolean;
  liveEditor?: LiveEditorContent;
  logoSrc?: string;
  contactEmail?: string;
}) {
  const year = new Date().getFullYear();
  const resolvedLogoSrc = logoSrc || headbangLogo.src;
  const resolvedContactEmail = (content.contactEmail || contactEmail || '').trim();
  const informationLinks = content.informationLinks || [];
  const footerContactLinks = content.contactLinks || [];
  const visibleSocialLinks = buildVisibleSocialLinks(content, resolvedContactEmail);
  const editorInformationLinks = buildEditorFooterLinks(informationLinks, 4);
  const editorContactLinks = buildEditorFooterLinks(footerContactLinks, 2);

  return (
    <footer className="relative mt-6 border-t border-[color:var(--color-border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-background)_88%,black)_0%,var(--color-background)_100%)] sm:mt-8">
      <div className="fire-divider" />
      <div className="site-shell w-full px-4 py-14 text-center sm:px-6">
        {isAdmin ? (
          <section className="mb-8 rounded-[1.4rem] border border-[#ff9d3c]/30 bg-[#130d09]/92 p-5 text-left shadow-[0_20px_50px_rgba(0,0,0,0.25)] backdrop-blur-sm">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#ffcf98]">Footer</p>
              <p className="mt-1 text-sm text-[#f3dec4]">Beschreibung, Social Links, Informationen und Kontakt für alle öffentlichen Seiten pflegen.</p>
            </div>
            <form action={updateFooterAction} className="grid gap-4">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-white">Beschreibung</span>
                <textarea name="footerDescription" defaultValue={content.description || ''} rows={4} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
              </label>

              <div className="grid gap-4 lg:grid-cols-3">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-white">Facebook URL</span>
                  <input name="footerFacebookUrl" defaultValue={content.socialLinks.find((link) => link.platform === 'facebook')?.href || ''} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-white">Instagram URL</span>
                  <input name="footerInstagramUrl" defaultValue={content.socialLinks.find((link) => link.platform === 'instagram')?.href || ''} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-white">TikTok URL optional</span>
                  <input name="footerTiktokUrl" defaultValue={content.socialLinks.find((link) => link.platform === 'tiktok')?.href || ''} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                </label>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-white">Überschrift Informationen</span>
                  <input name="footerInformationHeading" defaultValue={content.informationHeading || 'Informationen'} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-white">Überschrift Kontakt</span>
                  <input name="footerContactHeading" defaultValue={content.contactHeading || 'Kontakt'} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                </label>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <div className="rounded-[1rem] border border-white/10 bg-black/15 p-4">
                  <p className="mb-3 text-sm font-semibold text-white">Informationslinks</p>
                  {editorInformationLinks.map((link, index) => (
                    <div key={`${link.id || 'info'}-${index}`} className="mb-3 grid gap-3 md:grid-cols-2">
                      <input type="hidden" name={`footerInformationId:${index}`} value={link.id || ''} />
                      <input name={`footerInformationLabel:${index}`} defaultValue={link.label} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                      <input name={`footerInformationHref:${index}`} defaultValue={link.href} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                    </div>
                  ))}
                </div>

                <div className="rounded-[1rem] border border-white/10 bg-black/15 p-4">
                  <p className="mb-3 text-sm font-semibold text-white">Kontaktlinks und E-Mail</p>
                  {editorContactLinks.map((link, index) => (
                    <div key={`${link.id || 'contact'}-${index}`} className="mb-3 grid gap-3 md:grid-cols-2">
                      <input type="hidden" name={`footerContactId:${index}`} value={link.id || ''} />
                      <input name={`footerContactLabel:${index}`} defaultValue={link.label} placeholder="Linktext" className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                      <input name={`footerContactHref:${index}`} defaultValue={link.href} placeholder="/kontakt" className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                    </div>
                  ))}
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-white">Footer E-Mail optional</span>
                    <input name="footerContactEmail" defaultValue={content.contactEmail || resolvedContactEmail} placeholder={resolvedContactEmail || 'name@beispiel.de'} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                  </label>
                </div>
              </div>

              <div className="flex justify-end">
                <button type="submit" className="rounded-xl bg-[color:var(--color-accent)] px-5 py-3 text-sm font-black text-black transition hover:brightness-110">Footer speichern</button>
              </div>
            </form>
          </section>
        ) : null}

        <div className="grid gap-6 text-left lg:grid-cols-[1.05fr_0.9fr_0.75fr] lg:items-start">
          <LiveResizableBox
            boxKey="footer.top.brand.box"
            initialStyle={resolveLiveBoxStyle(liveEditor, 'footer.top.brand.box')}
            isAdmin={isAdmin}
            className="rounded-[1.4rem] border border-white/10 bg-[linear-gradient(180deg,rgba(22,14,10,0.92)_0%,rgba(10,7,5,0.85)_100%)] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.22)]"
          >
            <div className="flex items-center gap-4">
              <img src={resolvedLogoSrc} alt="Headbang Handwerk Logo" className="h-20 w-24 object-contain drop-shadow-[0_8px_18px_rgba(0,0,0,0.65)] sm:h-24 sm:w-28" />
              <div className="section-title text-left text-[1.45rem] leading-[0.95] sm:text-[1.8rem] xl:text-[2.05rem]">
                <LiveEditableText as="div" className="block" editorKey="footer.brandHeadline" initialHtml={resolveLiveHtml(liveEditor, 'footer.brandHeadline', content.brandHeadline)} isAdmin={isAdmin} title="Footer Überschrift" />
                <LiveEditableText as="div" className="block" editorKey="footer.brandHighlight" initialHtml={resolveLiveHtml(liveEditor, 'footer.brandHighlight', content.brandHighlight)} isAdmin={isAdmin} title="Footer Hervorhebung" />
              </div>
            </div>
            <p className="body-copy mt-5 max-w-2xl">{content.description}</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {visibleSocialLinks.map((link) => {
                const Icon = icons[link.platform];

                return (
                  <a
                    key={`${link.platform}-${link.label}`}
                    href={link.href}
                    aria-label={link.label}
                    target={isExternalUrl(link.href) && !link.href.startsWith('mailto:') ? '_blank' : undefined}
                    rel={isExternalUrl(link.href) && !link.href.startsWith('mailto:') ? 'noreferrer noopener' : undefined}
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-surface-2)_92%,black)_0%,color-mix(in_srgb,var(--color-surface)_76%,black)_100%)] text-[color:var(--text-link)] ring-1 ring-[color:var(--color-border)] transition-all hover:ring-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)] focus:ring-offset-2 focus:ring-offset-[color:var(--color-background)]"
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                );
              })}
            </div>
          </LiveResizableBox>

          <LiveResizableBox
            boxKey="footer.top.information.box"
            initialStyle={resolveLiveBoxStyle(liveEditor, 'footer.top.information.box')}
            isAdmin={isAdmin}
            className="rounded-[1.4rem] border border-white/10 bg-[linear-gradient(180deg,rgba(22,14,10,0.92)_0%,rgba(10,7,5,0.85)_100%)] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.22)]"
          >
            <h2 className="section-title break-words text-left text-[1.05rem] leading-[0.98] sm:text-[1.25rem] xl:text-[1.4rem]">{content.informationHeading}</h2>
            <div className="mt-5 flex flex-col gap-3">
              {informationLinks.map((link) => (
                <a key={`${link.id || link.href}-${link.label}`} href={link.href} className="link-copy text-sm font-semibold transition-colors hover:text-white focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)] focus:ring-offset-2 focus:ring-offset-[color:var(--color-background)]">
                  {link.label}
                </a>
              ))}
            </div>
          </LiveResizableBox>

          <LiveResizableBox
            boxKey="footer.top.contact.box"
            initialStyle={resolveLiveBoxStyle(liveEditor, 'footer.top.contact.box')}
            isAdmin={isAdmin}
            className="rounded-[1.4rem] border border-white/10 bg-[linear-gradient(180deg,rgba(22,14,10,0.92)_0%,rgba(10,7,5,0.85)_100%)] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.22)]"
          >
            <h2 className="section-title break-words text-left text-[1.05rem] leading-[0.98] sm:text-[1.25rem] xl:text-[1.4rem]">{content.contactHeading}</h2>
            <div className="mt-5 flex flex-col gap-3">
              {footerContactLinks.map((link) => (
                <a key={`${link.id || link.href}-${link.label}`} href={link.href} className="link-copy text-sm font-semibold transition-colors hover:text-white focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)] focus:ring-offset-2 focus:ring-offset-[color:var(--color-background)]">
                  {link.label}
                </a>
              ))}
              {resolvedContactEmail ? (
                <a href={`mailto:${resolvedContactEmail}`} className="link-copy text-sm font-semibold transition-colors hover:text-white focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)] focus:ring-offset-2 focus:ring-offset-[color:var(--color-background)]">
                  {resolvedContactEmail}
                </a>
              ) : null}
            </div>
          </LiveResizableBox>
        </div>

        <div className="mt-8 flex w-full justify-center">
          <LiveResizableBox
            boxKey="footer.legal.box"
            initialStyle={resolveLiveBoxStyle(liveEditor, 'footer.legal.box')}
            isAdmin={isAdmin}
            className="w-full max-w-4xl"
          >
            <div className="body-copy flex w-full flex-wrap items-center justify-center gap-x-5 gap-y-3 border-t border-[color:var(--color-border)] pt-5 text-center text-sm">
              <p>
                © {year}{' '}
                <LiveEditableText as="span" className="inline" editorKey="footer.copyrightName" initialHtml={resolveLiveHtml(liveEditor, 'footer.copyrightName', content.copyrightName)} isAdmin={isAdmin} title="Footer Copyright" />
              </p>
              <a href="/impressum" className="link-copy transition-colors">Impressum</a>
              <a href="/datenschutz" className="link-copy transition-colors">Datenschutz</a>
              <a href="/agb" className="link-copy transition-colors">AGB</a>
              <a href="/kontakt" className="link-copy transition-colors">Kontakt</a>
            </div>
          </LiveResizableBox>
        </div>
      </div>
    </footer>
  );
}
