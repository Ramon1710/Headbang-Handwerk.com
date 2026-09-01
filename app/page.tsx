import type { CSSProperties } from 'react';
import { ArrowRight, CalendarDays, EyeOff, ImageIcon, MapPin, Newspaper, Users2 } from 'lucide-react';
import { SiteNavigation } from '@/components/site-navigation';
import { Footer } from '@/components/footer';
import { LiveLayoutSaveProvider } from '@/components/live-layout-save-context';
import { LiveResizableBox } from '@/components/live-resizable-box';
import { ConfirmSubmitButton } from '@/components/confirm-submit-button';
import { FormValueSubmitButton } from '@/components/form-value-submit-button';
import { Button } from '@/components/ui/button';
import {
  addHomeNewsAction,
  deleteHomeNewsAction,
  moveHomeNewsAction,
  updateHomeDisplaySettingsAction,
  updateHomeEventsSectionAction,
  updateHomeHeroAction,
  updateHomeMembershipAction,
  updateHomeNewsAction,
  updateHomeNewsSectionAction,
} from '@/app/admin/home-actions';
import { isAdminAuthenticated } from '@/lib/cms/auth';
import { resolveLiveBoxStyle } from '@/lib/cms/live-editor';
import { getCmsContent } from '@/lib/cms/storage';
import { getUpcomingEvents } from '@/lib/events';
import {
  HOME_DISPLAY_SETTING_SPECS,
  getVisibleHomeNewsItems,
  resolveHomeEventCtaHref,
  resolveHomeNewsLinkHref,
  resolveHomeNewsPublishedLabel,
} from '@/lib/home';
import { isExternalUrl } from '@/lib/site';
import { cn } from '@/lib/utils';
import standBeispielKiImage from '../Stand Beispiel KI.png';
import wackenBackgroundImage from '../Wacken Hintergrund Bild.png';
import type { HomeDisplaySettings, HomeNewsItem, MediaAsset } from '@/lib/cms/schema';

const EVENT_IMAGE_FALLBACK_SRC = '/Headbang Stand Bild.png';

function getSavedMessage(saved?: string) {
  if (!saved) {
    return null;
  }

  const messages: Record<string, string> = {
    hero: 'Hero-Bereich gespeichert.',
    events: 'Veranstaltungs-Vorschau gespeichert.',
    'news-section': 'News-Sektion gespeichert.',
    'news-added': 'News-Eintrag angelegt.',
    'news-updated': 'News-Eintrag gespeichert.',
    'news-deleted': 'News-Eintrag gelöscht.',
    'news-sorted': 'News-Reihenfolge gespeichert.',
    membership: 'Mitgliederbereich gespeichert.',
    display: 'Darstellungswerte gespeichert.',
  };

  return messages[saved] || 'Änderungen gespeichert.';
}

function getImagePreviewSrc(asset: MediaAsset, fallbackSrc: string) {
  return asset.assetUrl || fallbackSrc;
}

function getHeroStyles(settings: HomeDisplaySettings): CSSProperties {
  return {
    minHeight: `clamp(${settings.heroHeightMobile}px, 72vh, ${settings.heroHeightDesktop}px)`,
  };
}

function getSectionSpacingStyles(settings: HomeDisplaySettings): CSSProperties {
  return {
    marginTop: `clamp(${settings.sectionSpacingMobile}px, 8vw, ${settings.sectionSpacingDesktop}px)`,
  };
}

function getSectionTitleStyles(settings: HomeDisplaySettings): CSSProperties {
  return {
    fontSize: `clamp(${settings.sectionTitleSizeMobile}px, 4vw, ${settings.sectionTitleSizeDesktop}px)`,
    lineHeight: 0.95,
  };
}

function getHeroTitleStyles(settings: HomeDisplaySettings): CSSProperties {
  return {
    fontSize: `clamp(${settings.heroTitleSizeMobile}px, 7vw, ${settings.heroTitleSizeDesktop}px)`,
    lineHeight: 0.94,
  };
}

function getPreviewGridClasses(itemCount: number) {
  if (itemCount <= 1) {
    return 'mx-auto max-w-3xl grid grid-cols-1';
  }

  if (itemCount === 2) {
    return 'mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-2';
  }

  return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
}

function getDesktopPreviewGridClasses(itemCount: number) {
  if (itemCount <= 1) {
    return 'md:mx-auto md:max-w-3xl md:grid md:grid-cols-1';
  }

  if (itemCount === 2) {
    return 'md:mx-auto md:max-w-6xl md:grid md:grid-cols-2';
  }

  return 'md:grid md:grid-cols-2 lg:grid-cols-3';
}

function AdminPanel({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[1.6rem] border border-[#ff9d3c]/30 bg-[#130d09]/92 p-5 shadow-[0_18px_40px_rgba(0,0,0,0.28)] backdrop-blur-sm">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#ffcf98]">Startseite</p>
        <h2 className="mt-1 text-xl font-black text-white">{title}</h2>
        <p className="mt-2 text-sm text-[#ead7bf]">{description}</p>
      </div>
      {children}
    </section>
  );
}

function HomeEventPreviewCard({ event, imageHeight }: { event: Awaited<ReturnType<typeof getCmsContent>>['site']['events'][number]; imageHeight: number }) {
  const ctaHref = resolveHomeEventCtaHref(event.ctaUrl);
  const ctaLabel = event.ctaText?.trim() || 'Zur Veranstaltungsübersicht';
  const statusLabel = event.status === 'planned' ? 'Geplant' : event.status === 'confirmed' ? 'Bestätigt' : null;

  return (
    <article className="group overflow-hidden rounded-[1.7rem] border border-white/10 bg-[linear-gradient(180deg,rgba(23,15,11,0.94)_0%,rgba(10,7,5,0.9)_100%)] shadow-[0_20px_50px_rgba(0,0,0,0.24)]">
      <div className="overflow-hidden border-b border-white/10 bg-black/30">
        <img src={event.imageUrl || EVENT_IMAGE_FALLBACK_SRC} alt={event.imageAlt || event.title} className="w-full object-cover transition duration-300 group-hover:scale-[1.02]" style={{ height: `${imageHeight}px` }} />
      </div>
      <div className="p-6">
        {statusLabel ? <span className="inline-flex rounded-full border border-[color:var(--color-accent)]/40 bg-[color:var(--color-accent)]/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-[color:var(--color-accent-soft)]">{statusLabel}</span> : null}
        <h3 className="section-title mt-4 text-[1.55rem] leading-[0.98] text-white">{event.title}</h3>
        <div className="mt-4 space-y-2 text-sm text-[#e7d7c5]">
          <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-[color:var(--color-accent)]" />{event.date}</p>
          <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-[color:var(--color-accent)]" />{event.location}</p>
        </div>
        <p className="body-copy mt-4 text-[#e7d7c5]">{event.description}</p>
        <div className="mt-6">
          <Button href={ctaHref} variant="secondary" className="w-full justify-center" target={isExternalUrl(ctaHref) ? '_blank' : undefined} rel={isExternalUrl(ctaHref) ? 'noreferrer noopener' : undefined}>
            {ctaLabel}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </article>
  );
}

function HomeNewsPreviewCard({ item, imageHeight }: { item: HomeNewsItem; imageHeight: number }) {
  const publishedLabel = resolveHomeNewsPublishedLabel(item.publishedAt);
  const linkHref = resolveHomeNewsLinkHref(item.linkHref || '');

  return (
    <article className="overflow-hidden rounded-[1.7rem] border border-white/10 bg-[linear-gradient(180deg,rgba(24,16,12,0.94)_0%,rgba(10,7,5,0.88)_100%)] shadow-[0_20px_50px_rgba(0,0,0,0.24)]">
      {item.imageUrl ? (
        <div className="overflow-hidden border-b border-white/10 bg-black/30">
          <img src={item.imageUrl} alt={item.imageAlt || item.title} className="w-full object-cover" style={{ height: `${imageHeight}px` }} />
        </div>
      ) : null}
      <div className="p-6">
        {publishedLabel ? <p className="text-xs font-black uppercase tracking-[0.18em] text-[color:var(--color-accent-soft)]">{publishedLabel}</p> : null}
        <h3 className="section-title mt-3 text-[1.4rem] leading-[0.98] text-white">{item.title}</h3>
        <p className="body-copy mt-4 whitespace-pre-line text-[#eadbc8]">{item.excerpt}</p>
        {linkHref ? (
          <div className="mt-6">
            <Button href={linkHref} variant="secondary" className="w-full justify-center" target={isExternalUrl(linkHref) ? '_blank' : undefined} rel={isExternalUrl(linkHref) ? 'noreferrer noopener' : undefined}>
              {item.linkLabel || 'Mehr erfahren'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        ) : null}
      </div>
    </article>
  );
}

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<{ view?: string; homeSaved?: string; homeError?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const cms = await getCmsContent();
  const isAuthenticatedAdmin = await isAdminAuthenticated();
  const isAdmin = isAuthenticatedAdmin && params?.view !== 'user';
  const home = cms.site.home;
  const heroImageSrc = getImagePreviewSrc(home.heroImage, standBeispielKiImage.src);
  const membershipImageSrc = home.membershipImage.assetUrl;
  const backgroundImageSrc = home.backgroundImage.assetUrl || wackenBackgroundImage.src;
  const upcomingEvents = getUpcomingEvents(cms.site.events, { limit: 3 });
  const nextMobileEvent = upcomingEvents.slice(0, 1);
  const visibleNewsItems = getVisibleHomeNewsItems(home.newsItems, 3);
  const savedMessage = getSavedMessage(params?.homeSaved);
  const layoutSettings = home.displaySettings;
  const liveEditor = cms.site.liveEditor;

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
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_12%,rgba(255,143,42,0.18)_0%,transparent_30%),linear-gradient(180deg,rgba(6,3,2,0.15)_0%,rgba(6,3,2,0.82)_100%)]" />

          <div className="site-shell relative z-10 px-4 pb-14 pt-28 sm:px-6 lg:px-8 lg:pt-32">
            {savedMessage ? <p className="mb-6 rounded-2xl border border-green-500/30 bg-green-950/40 px-5 py-4 text-sm font-semibold text-green-200">{savedMessage}</p> : null}
            {params?.homeError ? <p className="mb-6 rounded-2xl border border-red-500/30 bg-red-950/40 px-5 py-4 text-sm font-semibold text-red-200">{params.homeError}</p> : null}

            {isAdmin ? (
              <div className="grid gap-5 xl:grid-cols-2">
                <AdminPanel title="Hero" description="Hero-Texte, sichere Buttonziele und das große Titelbild der Startseite pflegen.">
                  <form action={updateHomeHeroAction} className="grid gap-4">
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-white">Hauptüberschrift</span>
                      <textarea name="heroTitle" defaultValue={home.heroTitle} rows={3} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-white">Zusatzzeile</span>
                      <input name="heroSubtitle" defaultValue={home.heroSubtitle} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-white">Beschreibung optional</span>
                      <textarea name="heroDescription" defaultValue={home.heroDescription} rows={4} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                    </label>
                    <div className="grid gap-4 lg:grid-cols-2">
                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-white">Button 1 Text</span>
                        <input name="heroPrimaryCtaLabel" defaultValue={home.heroPrimaryCtaLabel} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-white">Button 1 Ziel</span>
                        <input name="heroPrimaryCtaHref" defaultValue={home.heroPrimaryCtaHref} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-white">Button 2 Text</span>
                        <input name="heroSecondaryCtaLabel" defaultValue={home.heroSecondaryCtaLabel} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-white">Button 2 Ziel</span>
                        <input name="heroSecondaryCtaHref" defaultValue={home.heroSecondaryCtaHref} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                      </label>
                    </div>
                    <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-white">Hero-Bild</span>
                        <input type="file" name="heroImageFile" accept=".png,.jpg,.jpeg,.webp" className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white file:mr-4 file:rounded-lg file:border-0 file:bg-[color:var(--color-accent)] file:px-4 file:py-2 file:font-semibold file:text-black" />
                        <span className="mt-2 block text-xs text-[#c9b7a3]">Erlaubt: PNG, JPG, WEBP bis 3,5 MB.</span>
                      </label>
                      <div className="overflow-hidden rounded-xl border border-white/10 bg-black/20">
                        <img src={heroImageSrc} alt={home.heroImageAlt || home.heroTitle} className="h-36 w-full object-cover" style={{ objectPosition: `${home.heroImagePositionX}% ${home.heroImagePositionY}%` }} />
                      </div>
                    </div>
                    <div className="grid gap-4 lg:grid-cols-3">
                      <label className="block lg:col-span-2">
                        <span className="mb-2 block text-sm font-semibold text-white">Alternativtext</span>
                        <input name="heroImageAlt" defaultValue={home.heroImageAlt} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                      </label>
                      <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/15 px-4 py-3 text-sm text-[#dbc8b4]">
                        <input type="checkbox" name="removeHeroImage" className="h-4 w-4" />
                        Hero-Bild entfernen
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-white">Bildfokus X</span>
                        <input type="range" name="heroImagePositionX" min="0" max="100" step="1" defaultValue={home.heroImagePositionX} className="w-full" />
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-white">Bildfokus Y</span>
                        <input type="range" name="heroImagePositionY" min="0" max="100" step="1" defaultValue={home.heroImagePositionY} className="w-full" />
                      </label>
                    </div>
                    <div className="flex justify-end">
                      <button type="submit" className="rounded-xl bg-[color:var(--color-accent)] px-5 py-3 text-sm font-black text-black transition hover:brightness-110">Hero speichern</button>
                    </div>
                  </form>
                </AdminPanel>

                <AdminPanel title="Veranstaltungen-Vorschau" description="Texte und Fallbacks der automatisch geladenen nächsten drei Veranstaltungen steuern.">
                  <form action={updateHomeEventsSectionAction} className="grid gap-4">
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-white">Überschrift</span>
                      <input name="eventsSectionTitle" defaultValue={home.eventsSectionTitle} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-white">Einleitung optional</span>
                      <textarea name="eventsSectionIntro" defaultValue={home.eventsSectionIntro} rows={3} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-white">Buttontext</span>
                      <input name="eventsSectionCtaLabel" defaultValue={home.eventsSectionCtaLabel} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-white">Hinweis bei fehlenden Terminen</span>
                      <textarea name="eventsEmptyText" defaultValue={home.eventsEmptyText} rows={3} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                    </label>
                    <div className="flex justify-end">
                      <button type="submit" className="rounded-xl bg-[color:var(--color-accent)] px-5 py-3 text-sm font-black text-black transition hover:brightness-110">Veranstaltungen speichern</button>
                    </div>
                  </form>
                </AdminPanel>

                <AdminPanel title="News" description="News-Sektion, einzelne Einträge, Sichtbarkeit, Reihenfolge und Bilder direkt auf der Startseite verwalten.">
                  <div className="grid gap-5">
                    <form action={updateHomeNewsSectionAction} className="grid gap-4 rounded-2xl border border-white/10 bg-black/15 p-4">
                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-white">Überschrift</span>
                        <input name="newsSectionTitle" defaultValue={home.newsSectionTitle} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-white">Einleitung optional</span>
                        <textarea name="newsSectionIntro" defaultValue={home.newsSectionIntro} rows={3} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-white">Hinweis bei fehlenden News</span>
                        <textarea name="newsEmptyText" defaultValue={home.newsEmptyText} rows={3} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                      </label>
                      <div className="flex justify-end">
                        <button type="submit" className="rounded-xl bg-[color:var(--color-accent)] px-5 py-3 text-sm font-black text-black transition hover:brightness-110">News-Sektion speichern</button>
                      </div>
                    </form>

                    <form action={addHomeNewsAction} className="grid gap-4 rounded-2xl border border-white/10 bg-black/15 p-4">
                      <h3 className="text-lg font-black text-white">Neuen News-Eintrag anlegen</h3>
                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-white">Titel</span>
                        <input name="title" className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-white">Kurztext</span>
                        <textarea name="excerpt" rows={4} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                      </label>
                      <div className="grid gap-4 lg:grid-cols-2">
                        <label className="block">
                          <span className="mb-2 block text-sm font-semibold text-white">Veröffentlicht am optional</span>
                          <input type="date" name="publishedAt" className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                        </label>
                        <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/15 px-4 py-3 text-sm text-[#dbc8b4]">
                          <input type="checkbox" name="visible" defaultChecked className="h-4 w-4" />
                          Öffentlich sichtbar
                        </label>
                      </div>
                      <div className="grid gap-4 lg:grid-cols-2">
                        <label className="block">
                          <span className="mb-2 block text-sm font-semibold text-white">Linktext optional</span>
                          <input name="linkLabel" className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                        </label>
                        <label className="block">
                          <span className="mb-2 block text-sm font-semibold text-white">Linkziel optional</span>
                          <input name="linkHref" className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                        </label>
                      </div>
                      <div className="grid gap-4 lg:grid-cols-2">
                        <label className="block">
                          <span className="mb-2 block text-sm font-semibold text-white">Bild optional</span>
                          <input type="file" name="imageFile" accept=".png,.jpg,.jpeg,.webp" className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white file:mr-4 file:rounded-lg file:border-0 file:bg-[color:var(--color-accent)] file:px-4 file:py-2 file:font-semibold file:text-black" />
                        </label>
                        <label className="block">
                          <span className="mb-2 block text-sm font-semibold text-white">Alternativtext</span>
                          <input name="imageAlt" className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                        </label>
                      </div>
                      <div className="flex justify-end">
                        <button type="submit" className="rounded-xl bg-[color:var(--color-accent)] px-5 py-3 text-sm font-black text-black transition hover:brightness-110">News anlegen</button>
                      </div>
                    </form>

                    {home.newsItems.length ? (
                      <div className="grid gap-4">
                        {home.newsItems.map((item, index) => (
                          <form key={item.id} action={updateHomeNewsAction} className="grid gap-4 rounded-2xl border border-white/10 bg-black/15 p-4">
                            <input type="hidden" name="newsId" value={item.id} />
                            <input type="hidden" name="direction" value="" />
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <h3 className="text-lg font-black text-white">News {index + 1}</h3>
                              <div className="flex flex-wrap gap-2">
                                <FormValueSubmitButton formAction={moveHomeNewsAction} hiddenFieldName="direction" hiddenFieldValue="up" type="submit" className="rounded-lg border border-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#f3dec4]">Nach oben</FormValueSubmitButton>
                                <FormValueSubmitButton formAction={moveHomeNewsAction} hiddenFieldName="direction" hiddenFieldValue="down" type="submit" className="rounded-lg border border-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#f3dec4]">Nach unten</FormValueSubmitButton>
                              </div>
                            </div>
                            <label className="block">
                              <span className="mb-2 block text-sm font-semibold text-white">Titel</span>
                              <input name="title" defaultValue={item.title} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                            </label>
                            <label className="block">
                              <span className="mb-2 block text-sm font-semibold text-white">Kurztext</span>
                              <textarea name="excerpt" defaultValue={item.excerpt} rows={4} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                            </label>
                            <div className="grid gap-4 lg:grid-cols-2">
                              <label className="block">
                                <span className="mb-2 block text-sm font-semibold text-white">Veröffentlicht am optional</span>
                                <input type="date" name="publishedAt" defaultValue={item.publishedAt} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                              </label>
                              <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/15 px-4 py-3 text-sm text-[#dbc8b4]">
                                <input type="checkbox" name="visible" defaultChecked={item.visible} className="h-4 w-4" />
                                Öffentlich sichtbar
                              </label>
                            </div>
                            <div className="grid gap-4 lg:grid-cols-2">
                              <label className="block">
                                <span className="mb-2 block text-sm font-semibold text-white">Linktext optional</span>
                                <input name="linkLabel" defaultValue={item.linkLabel || ''} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                              </label>
                              <label className="block">
                                <span className="mb-2 block text-sm font-semibold text-white">Linkziel optional</span>
                                <input name="linkHref" defaultValue={item.linkHref || ''} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                              </label>
                            </div>
                            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                              <label className="block">
                                <span className="mb-2 block text-sm font-semibold text-white">Bild optional</span>
                                <input type="file" name="imageFile" accept=".png,.jpg,.jpeg,.webp" className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white file:mr-4 file:rounded-lg file:border-0 file:bg-[color:var(--color-accent)] file:px-4 file:py-2 file:font-semibold file:text-black" />
                              </label>
                              {item.imageUrl ? (
                                <div className="overflow-hidden rounded-xl border border-white/10 bg-black/20">
                                  <img src={item.imageUrl} alt={item.imageAlt || item.title} className="h-28 w-full object-cover" />
                                </div>
                              ) : (
                                <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-white/10 bg-black/10 text-[#bfae99]">Kein Bild</div>
                              )}
                            </div>
                            <div className="grid gap-4 lg:grid-cols-2">
                              <label className="block">
                                <span className="mb-2 block text-sm font-semibold text-white">Alternativtext</span>
                                <input name="imageAlt" defaultValue={item.imageAlt} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                              </label>
                              <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/15 px-4 py-3 text-sm text-[#dbc8b4]">
                                <input type="checkbox" name="removeImage" className="h-4 w-4" />
                                Bild entfernen
                              </label>
                            </div>
                            <div className="flex flex-wrap justify-between gap-3">
                              <div className="flex flex-wrap gap-3">
                                <ConfirmSubmitButton formAction={deleteHomeNewsAction} type="submit" confirmMessage="Diesen News-Eintrag wirklich löschen?" className="rounded-xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm font-black text-red-100 transition hover:bg-red-900/50">
                                  News löschen
                                </ConfirmSubmitButton>
                                <button type="submit" className="rounded-xl bg-[color:var(--color-accent)] px-5 py-3 text-sm font-black text-black transition hover:brightness-110">News speichern</button>
                              </div>
                            </div>
                          </form>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </AdminPanel>

                <AdminPanel title="Mitgliederaufruf" description="Große Abschlussfläche mit Text, Bild und sicherem Ziel zur Mitgliedsseite pflegen.">
                  <form action={updateHomeMembershipAction} className="grid gap-4">
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-white">Überschrift</span>
                      <textarea name="membershipTitle" defaultValue={home.membershipTitle} rows={3} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-white">Beschreibung</span>
                      <textarea name="membershipBody" defaultValue={home.membershipBody} rows={4} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                    </label>
                    <div className="grid gap-4 lg:grid-cols-2">
                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-white">Buttontext</span>
                        <input name="membershipCtaLabel" defaultValue={home.membershipCtaLabel} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-white">Buttonziel</span>
                        <input name="membershipCtaHref" defaultValue={home.membershipCtaHref} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                      </label>
                    </div>
                    <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-white">Bild optional</span>
                        <input type="file" name="membershipImageFile" accept=".png,.jpg,.jpeg,.webp" className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white file:mr-4 file:rounded-lg file:border-0 file:bg-[color:var(--color-accent)] file:px-4 file:py-2 file:font-semibold file:text-black" />
                      </label>
                      {membershipImageSrc ? (
                        <div className="overflow-hidden rounded-xl border border-white/10 bg-black/20">
                          <img src={membershipImageSrc} alt={home.membershipImageAlt || home.membershipTitle} className="h-36 w-full object-cover" style={{ objectPosition: `${home.membershipImagePositionX}% ${home.membershipImagePositionY}%` }} />
                        </div>
                      ) : (
                        <div className="flex h-36 items-center justify-center rounded-xl border border-dashed border-white/10 bg-black/10 text-[#bfae99]">Kein Bild</div>
                      )}
                    </div>
                    <div className="grid gap-4 lg:grid-cols-3">
                      <label className="block lg:col-span-2">
                        <span className="mb-2 block text-sm font-semibold text-white">Alternativtext</span>
                        <input name="membershipImageAlt" defaultValue={home.membershipImageAlt} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                      </label>
                      <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/15 px-4 py-3 text-sm text-[#dbc8b4]">
                        <input type="checkbox" name="removeMembershipImage" className="h-4 w-4" />
                        Bild entfernen
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-white">Bildfokus X</span>
                        <input type="range" name="membershipImagePositionX" min="0" max="100" step="1" defaultValue={home.membershipImagePositionX} className="w-full" />
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-white">Bildfokus Y</span>
                        <input type="range" name="membershipImagePositionY" min="0" max="100" step="1" defaultValue={home.membershipImagePositionY} className="w-full" />
                      </label>
                    </div>
                    <div className="flex justify-end">
                      <button type="submit" className="rounded-xl bg-[color:var(--color-accent)] px-5 py-3 text-sm font-black text-black transition hover:brightness-110">Mitgliederbereich speichern</button>
                    </div>
                  </form>
                </AdminPanel>

                <AdminPanel title="Darstellung und Größen" description="Wichtige responsive Größen mit festen Mindest- und Maximalwerten pflegen. Es werden nur sichere numerische Werte gespeichert.">
                  <form action={updateHomeDisplaySettingsAction} className="grid gap-4 md:grid-cols-2">
                    {Object.entries(HOME_DISPLAY_SETTING_SPECS).map(([key, spec]) => (
                      <label key={key} className="block rounded-2xl border border-white/10 bg-black/15 p-4">
                        <span className="mb-2 block text-sm font-semibold text-white">{key}</span>
                        <input type="number" name={key} min={spec.min} max={spec.max} step="1" defaultValue={home.displaySettings[key as keyof HomeDisplaySettings]} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                        <span className="mt-2 block text-xs text-[#c9b7a3]">Standard {spec.defaultValue}, Minimum {spec.min}, Maximum {spec.max}</span>
                      </label>
                    ))}
                    <div className="md:col-span-2 flex justify-end">
                      <button type="submit" className="rounded-xl bg-[color:var(--color-accent)] px-5 py-3 text-sm font-black text-black transition hover:brightness-110">Darstellung speichern</button>
                    </div>
                  </form>
                </AdminPanel>
              </div>
            ) : null}

            <LiveResizableBox boxKey="home.hero.box" initialStyle={resolveLiveBoxStyle(liveEditor, 'home.hero.box')} isAdmin={isAdmin} className="w-full">
              <section className="relative overflow-hidden rounded-[2rem] border border-white/10 shadow-[0_28px_70px_rgba(0,0,0,0.28)]" style={getHeroStyles(layoutSettings)}>
                <img src={heroImageSrc} alt={home.heroImageAlt || home.heroTitle} className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: `${home.heroImagePositionX}% ${home.heroImagePositionY}%` }} />
                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,4,2,0.92)_0%,rgba(7,4,2,0.76)_44%,rgba(7,4,2,0.48)_100%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,136,36,0.18)_0%,transparent_28%)]" />
                <div className="relative z-10 flex h-full items-end justify-center px-6 py-8 sm:px-8 lg:px-12 lg:py-12">
                  <div className="max-w-3xl text-center">
                    <p className="text-xs font-black uppercase tracking-[0.28em] text-[color:var(--color-accent-soft)]">Headbang Handwerk</p>
                    <h1 className="section-title mt-4 max-w-4xl text-white drop-shadow-[0_8px_20px_rgba(0,0,0,0.5)]" style={getHeroTitleStyles(layoutSettings)}>{home.heroTitle}</h1>
                    <p className="mt-5 text-xl font-semibold text-[#f3e6d7] sm:text-2xl">{home.heroSubtitle}</p>
                    {home.heroDescription ? <p className="body-copy mt-5 max-w-2xl whitespace-pre-line text-[#f0dfcd] sm:mx-auto">{home.heroDescription}</p> : null}
                    <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
                      <Button href={home.heroPrimaryCtaHref} size="lg">{home.heroPrimaryCtaLabel}<ArrowRight className="h-4 w-4" /></Button>
                      <Button href={home.heroSecondaryCtaHref} size="lg" variant="secondary">{home.heroSecondaryCtaLabel}</Button>
                    </div>
                  </div>
                </div>
              </section>
            </LiveResizableBox>

            <LiveResizableBox boxKey="home.events.box" initialStyle={resolveLiveBoxStyle(liveEditor, 'home.events.box')} isAdmin={isAdmin} className="w-full" applySavedHeight={false}>
              <section style={getSectionSpacingStyles(layoutSettings)}>
                <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                  <div className="max-w-3xl">
                    <p className="text-xs font-black uppercase tracking-[0.28em] text-[color:var(--color-accent-soft)]">Live aus dem CMS</p>
                    <h2 className="section-title mt-3 text-white" style={getSectionTitleStyles(layoutSettings)}>{home.eventsSectionTitle}</h2>
                    {home.eventsSectionIntro ? <p className="body-copy mt-4 whitespace-pre-line text-[#ecdbca]">{home.eventsSectionIntro}</p> : null}
                  </div>
                  <Button href="/veranstaltungen" variant="secondary">{home.eventsSectionCtaLabel}</Button>
                </div>
                {upcomingEvents.length ? (
                  <>
                    <div className="md:hidden" style={{ gap: `${layoutSettings.cardGap}px` }}>
                      {nextMobileEvent.map((event) => <HomeEventPreviewCard key={event.id} event={event} imageHeight={layoutSettings.eventImageHeight} />)}
                    </div>
                    <div className={cn('hidden', getDesktopPreviewGridClasses(upcomingEvents.length))} style={{ gap: `${layoutSettings.cardGap}px` }}>
                      {upcomingEvents.map((event) => <HomeEventPreviewCard key={event.id} event={event} imageHeight={layoutSettings.eventImageHeight} />)}
                    </div>
                  </>
                ) : (
                  <div className="rounded-[1.7rem] border border-dashed border-white/15 bg-[linear-gradient(180deg,rgba(18,12,9,0.86)_0%,rgba(9,6,4,0.76)_100%)] px-6 py-7 text-[#ead9c5]">
                    <p className="body-copy whitespace-pre-line">{home.eventsEmptyText}</p>
                  </div>
                )}
                {upcomingEvents.length ? (
                  <div className="mt-8 flex justify-center">
                    <Button href="/veranstaltungen" size="lg">{home.eventsSectionCtaLabel}</Button>
                  </div>
                ) : null}
              </section>
            </LiveResizableBox>

            <LiveResizableBox boxKey="home.news.box" initialStyle={resolveLiveBoxStyle(liveEditor, 'home.news.box')} isAdmin={isAdmin} className="w-full" applySavedHeight={false}>
              <section style={getSectionSpacingStyles(layoutSettings)}>
                <div className="mb-8 max-w-3xl">
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-[color:var(--color-accent-soft)]">Aktuelles</p>
                  <h2 className="section-title mt-3 text-white" style={getSectionTitleStyles(layoutSettings)}>{home.newsSectionTitle}</h2>
                  {home.newsSectionIntro ? <p className="body-copy mt-4 whitespace-pre-line text-[#ecdbca]">{home.newsSectionIntro}</p> : null}
                </div>
                {visibleNewsItems.length ? (
                  <div className={cn(getPreviewGridClasses(visibleNewsItems.length), visibleNewsItems.length === 1 ? 'items-start' : '')} style={{ gap: `${layoutSettings.cardGap}px` }}>
                    {visibleNewsItems.map((item) => <HomeNewsPreviewCard key={item.id} item={item} imageHeight={layoutSettings.newsImageHeight} />)}
                  </div>
                ) : (
                  <div className="rounded-[1.7rem] border border-dashed border-white/15 bg-[linear-gradient(180deg,rgba(18,12,9,0.86)_0%,rgba(9,6,4,0.76)_100%)] px-6 py-7 text-[#ead9c5]">
                    <p className="body-copy whitespace-pre-line">{home.newsEmptyText}</p>
                  </div>
                )}
              </section>
            </LiveResizableBox>

            <LiveResizableBox boxKey="home.membership.box" initialStyle={resolveLiveBoxStyle(liveEditor, 'home.membership.box')} isAdmin={isAdmin} className="w-full">
              <section style={getSectionSpacingStyles(layoutSettings)}>
                <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(24,15,11,0.94)_0%,rgba(10,7,5,0.9)_100%)] shadow-[0_28px_70px_rgba(0,0,0,0.24)]">
                  <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr]" style={{ minHeight: `${layoutSettings.membershipMinHeight}px` }}>
                    <div className="flex items-center px-6 py-8 sm:px-8 lg:px-10">
                      <div className="max-w-2xl">
                        <p className="text-xs font-black uppercase tracking-[0.28em] text-[color:var(--color-accent-soft)]">Mitmachen</p>
                        <h2 className="section-title mt-3 text-white" style={getSectionTitleStyles(layoutSettings)}>{home.membershipTitle}</h2>
                        <p className="body-copy mt-5 whitespace-pre-line text-[#efdfcd]">{home.membershipBody}</p>
                        <div className="mt-8">
                          <Button href={home.membershipCtaHref} size="lg">{home.membershipCtaLabel}<ArrowRight className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    </div>
                    {membershipImageSrc ? (
                      <div className="relative min-h-[18rem] border-t border-white/10 lg:min-h-full lg:border-l lg:border-t-0">
                        <img src={membershipImageSrc} alt={home.membershipImageAlt || home.membershipTitle} className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: `${home.membershipImagePositionX}% ${home.membershipImagePositionY}%` }} />
                        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,4,2,0.18)_0%,rgba(7,4,2,0.5)_100%)] lg:bg-[linear-gradient(90deg,rgba(7,4,2,0.2)_0%,rgba(7,4,2,0.5)_100%)]" />
                      </div>
                    ) : (
                      <div className="flex min-h-[18rem] items-center justify-center border-t border-white/10 bg-black/15 text-[#baa791] lg:border-l lg:border-t-0">
                        <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.16em]"><Users2 className="h-5 w-5" />Kein Bild hinterlegt</div>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </LiveResizableBox>
          </div>
        </main>
        <Footer content={cms.site.footer} isAdmin={isAdmin} liveEditor={cms.site.liveEditor} logoSrc={cms.site.logo.assetUrl} contactEmail={cms.site.contact.email} />
      </LiveLayoutSaveProvider>
    </>
  );
}
