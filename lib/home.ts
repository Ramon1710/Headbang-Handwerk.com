import { isValidIsoDateString } from '@/lib/events';
import { normalizeExternalUrl, normalizeInternalHref, normalizeSafeText } from '@/lib/site';
import type { HomeDisplaySettings, HomeNewsItem, HomePageContent, LiveEditorContent } from '@/lib/cms/schema';

export const HOME_IMAGE_MAX_UPLOAD_BYTES = 3.5 * 1024 * 1024;

const HOME_IMAGE_CONTENT_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const HOME_IMAGE_FILE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

export const HOME_DISPLAY_SETTING_SPECS = {
  heroHeightDesktop: { defaultValue: 640, min: 420, max: 920 },
  heroHeightMobile: { defaultValue: 460, min: 320, max: 720 },
  heroTitleSizeDesktop: { defaultValue: 76, min: 44, max: 112 },
  heroTitleSizeMobile: { defaultValue: 40, min: 28, max: 68 },
  sectionTitleSizeDesktop: { defaultValue: 44, min: 28, max: 72 },
  sectionTitleSizeMobile: { defaultValue: 30, min: 20, max: 50 },
  sectionSpacingDesktop: { defaultValue: 104, min: 56, max: 164 },
  sectionSpacingMobile: { defaultValue: 72, min: 40, max: 124 },
  cardGap: { defaultValue: 24, min: 12, max: 40 },
  eventImageHeight: { defaultValue: 240, min: 160, max: 360 },
  newsImageHeight: { defaultValue: 220, min: 140, max: 340 },
  membershipMinHeight: { defaultValue: 400, min: 260, max: 640 },
} as const;

export type HomeDisplaySettingKey = keyof typeof HOME_DISPLAY_SETTING_SPECS;

const LEGACY_HOME_PRIMARY_CTA_KEYS = new Set([
  'Jetzt Partner werden|/sponsoren',
  'Jetzt unterstützen|/sponsoren',
  'Sponsoring ansehen|/sponsoren',
]);

const LEGACY_HOME_SECONDARY_CTA_KEYS = new Set([
  'Veranstaltungen ansehen|/veranstaltungen',
  'Kontakt aufnehmen|/kontakt',
  'Ansprechpartner kontaktieren|/kontakt',
]);

function normalizeText(value: unknown, fallback: string) {
  const normalized = normalizeSafeText(String(value ?? ''));
  return normalized || fallback;
}

function toCtaKey(label: string, href: string) {
  return `${normalizeSafeText(label)}|${String(href).trim()}`;
}

function normalizeMultilineText(value: unknown, fallback: string) {
  const normalized = String(value ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .trim();

  return normalized || fallback;
}

function htmlToPlainText(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h1|h2|h3|li)>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function fromLiveEditor(liveEditor: LiveEditorContent | undefined, key: string, fallback: string) {
  const value = htmlToPlainText(liveEditor?.richText[key] || '');
  return value || fallback;
}

function normalizePercent(value: unknown, fallback: number) {
  const parsed = typeof value === 'number' ? value : Number.parseFloat(String(value ?? ''));

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(0, Math.min(100, Math.round(parsed)));
}

function normalizeVisible(value: unknown, fallback: boolean) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'on') {
      return true;
    }

    if (normalized === 'false' || normalized === '0' || normalized === 'no' || normalized === 'off') {
      return false;
    }
  }

  return fallback;
}

function normalizeNewsLinkHref(value: unknown) {
  const raw = String(value ?? '').trim();

  if (!raw) {
    return '';
  }

  if (raw.startsWith('/')) {
    const normalized = normalizeInternalHref(raw, '__invalid__');
    return normalized === '__invalid__' ? '' : normalized;
  }

  const normalized = normalizeExternalUrl(raw);
  return /^(https?:\/\/|mailto:|tel:)/i.test(normalized) ? normalized : '';
}

function normalizeNewsItem(item: unknown, index: number): HomeNewsItem | null {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const candidate = item as Record<string, unknown>;
  const id = String(candidate.id ?? '').trim() || `legacy-news-${index + 1}`;
  const title = normalizeSafeText(String(candidate.title ?? ''));
  const excerpt = normalizeMultilineText(candidate.excerpt, '');

  if (!title && !excerpt) {
    return null;
  }

  const publishedAt = String(candidate.publishedAt ?? '').trim();

  return {
    id,
    title: title || 'Aktuelles',
    excerpt,
    imageUrl: String(candidate.imageUrl ?? '').trim(),
    imageAlt: normalizeSafeText(String(candidate.imageAlt ?? '')),
    imageName: String(candidate.imageName ?? '').trim(),
    imageContentType: String(candidate.imageContentType ?? '').trim(),
    publishedAt: isValidIsoDateString(publishedAt) ? publishedAt : '',
    linkLabel: normalizeSafeText(String(candidate.linkLabel ?? '')),
    linkHref: normalizeNewsLinkHref(candidate.linkHref),
    visible: normalizeVisible(candidate.visible, true),
  };
}

function buildLegacyNewsItem(home: HomePageContent, liveEditor: LiveEditorContent | undefined) {
  const title = fromLiveEditor(liveEditor, 'home.newsTitle', home.newsTitle || '');
  const excerpt = fromLiveEditor(liveEditor, 'home.newsParagraphs.0', home.newsParagraphs?.[0] || '');
  const image = home.newsImages?.[0];

  if (!title && !excerpt && !image?.assetUrl) {
    return [];
  }

  return [
    {
      id: 'legacy-home-news',
      title: title || 'Aktuelles',
      excerpt,
      imageUrl: image?.assetUrl || '',
      imageAlt: image?.assetName || '',
      imageName: image?.assetName || '',
      imageContentType: image?.assetContentType || '',
      publishedAt: '',
      linkLabel: '',
      linkHref: '',
      visible: true,
    } satisfies HomeNewsItem,
  ];
}

export function clampHomeDisplaySetting(key: HomeDisplaySettingKey, value: unknown) {
  const spec = HOME_DISPLAY_SETTING_SPECS[key];
  const parsed = typeof value === 'number' ? value : Number.parseFloat(String(value ?? ''));

  if (!Number.isFinite(parsed)) {
    return spec.defaultValue;
  }

  return Math.max(spec.min, Math.min(spec.max, Math.round(parsed)));
}

export function normalizeHomeDisplaySettings(value: Partial<HomeDisplaySettings> | undefined): HomeDisplaySettings {
  return {
    heroHeightDesktop: clampHomeDisplaySetting('heroHeightDesktop', value?.heroHeightDesktop),
    heroHeightMobile: clampHomeDisplaySetting('heroHeightMobile', value?.heroHeightMobile),
    heroTitleSizeDesktop: clampHomeDisplaySetting('heroTitleSizeDesktop', value?.heroTitleSizeDesktop),
    heroTitleSizeMobile: clampHomeDisplaySetting('heroTitleSizeMobile', value?.heroTitleSizeMobile),
    sectionTitleSizeDesktop: clampHomeDisplaySetting('sectionTitleSizeDesktop', value?.sectionTitleSizeDesktop),
    sectionTitleSizeMobile: clampHomeDisplaySetting('sectionTitleSizeMobile', value?.sectionTitleSizeMobile),
    sectionSpacingDesktop: clampHomeDisplaySetting('sectionSpacingDesktop', value?.sectionSpacingDesktop),
    sectionSpacingMobile: clampHomeDisplaySetting('sectionSpacingMobile', value?.sectionSpacingMobile),
    cardGap: clampHomeDisplaySetting('cardGap', value?.cardGap),
    eventImageHeight: clampHomeDisplaySetting('eventImageHeight', value?.eventImageHeight),
    newsImageHeight: clampHomeDisplaySetting('newsImageHeight', value?.newsImageHeight),
    membershipMinHeight: clampHomeDisplaySetting('membershipMinHeight', value?.membershipMinHeight),
  };
}

export function normalizeHomeContent(
  home: HomePageContent,
  liveEditor: LiveEditorContent | undefined,
  defaults: HomePageContent
): HomePageContent {
  const existingNewsItems = Array.isArray(home.newsItems) ? home.newsItems.map(normalizeNewsItem).filter((item): item is HomeNewsItem => Boolean(item)) : [];
  const newsItems = existingNewsItems.length ? existingNewsItems : buildLegacyNewsItem(home, liveEditor);
  const rawPrimaryLabel = normalizeSafeText(String(home.heroPrimaryCtaLabel ?? ''));
  const rawPrimaryHref = String(home.heroPrimaryCtaHref ?? '').trim();
  const rawSecondaryLabel = normalizeSafeText(String(home.heroSecondaryCtaLabel ?? ''));
  const rawSecondaryHref = String(home.heroSecondaryCtaHref ?? '').trim();
  const usesLegacyHeroCtas =
    LEGACY_HOME_PRIMARY_CTA_KEYS.has(toCtaKey(rawPrimaryLabel, rawPrimaryHref)) &&
    LEGACY_HOME_SECONDARY_CTA_KEYS.has(toCtaKey(rawSecondaryLabel, rawSecondaryHref));

  return {
    ...defaults,
    ...home,
    heroTitle: normalizeText(home.heroTitle || fromLiveEditor(liveEditor, 'home.heroTitle', defaults.heroTitle), defaults.heroTitle),
    heroSubtitle: normalizeText(home.heroSubtitle, defaults.heroSubtitle),
    heroDescription: normalizeMultilineText(home.heroDescription || fromLiveEditor(liveEditor, 'home.heroLead', defaults.heroDescription), defaults.heroDescription),
    heroPrimaryCtaLabel: usesLegacyHeroCtas ? defaults.heroPrimaryCtaLabel : normalizeText(home.heroPrimaryCtaLabel, defaults.heroPrimaryCtaLabel),
    heroPrimaryCtaHref: usesLegacyHeroCtas ? defaults.heroPrimaryCtaHref : normalizeInternalHref(String(home.heroPrimaryCtaHref ?? ''), defaults.heroPrimaryCtaHref),
    heroSecondaryCtaLabel: usesLegacyHeroCtas ? defaults.heroSecondaryCtaLabel : normalizeText(home.heroSecondaryCtaLabel, defaults.heroSecondaryCtaLabel),
    heroSecondaryCtaHref: usesLegacyHeroCtas ? defaults.heroSecondaryCtaHref : normalizeInternalHref(String(home.heroSecondaryCtaHref ?? ''), defaults.heroSecondaryCtaHref),
    heroImageAlt: normalizeSafeText(String(home.heroImageAlt ?? '')),
    heroImagePositionX: normalizePercent(home.heroImagePositionX, defaults.heroImagePositionX),
    heroImagePositionY: normalizePercent(home.heroImagePositionY, defaults.heroImagePositionY),
    eventsSectionTitle: normalizeText(home.eventsSectionTitle || home.eventsTitle, defaults.eventsSectionTitle),
    eventsSectionIntro: normalizeMultilineText(home.eventsSectionIntro, defaults.eventsSectionIntro),
    eventsSectionCtaLabel: normalizeText(home.eventsSectionCtaLabel || home.eventsCtaLabel, defaults.eventsSectionCtaLabel),
    eventsEmptyText: normalizeMultilineText(home.eventsEmptyText, defaults.eventsEmptyText),
    newsSectionTitle: normalizeText(home.newsSectionTitle, defaults.newsSectionTitle),
    newsSectionIntro: normalizeMultilineText(home.newsSectionIntro, defaults.newsSectionIntro),
    newsEmptyText: normalizeMultilineText(home.newsEmptyText, defaults.newsEmptyText),
    newsItems,
    membershipTitle: normalizeText(home.membershipTitle || home.closingTitle, defaults.membershipTitle),
    membershipBody: normalizeMultilineText(home.membershipBody || home.closingLead, defaults.membershipBody),
    membershipCtaLabel: normalizeText(home.membershipCtaLabel || home.closingPrimaryCtaLabel, defaults.membershipCtaLabel),
    membershipCtaHref: normalizeInternalHref(String(home.membershipCtaHref ?? home.closingPrimaryCtaHref ?? ''), defaults.membershipCtaHref),
    membershipImageAlt: normalizeSafeText(String(home.membershipImageAlt ?? '')),
    membershipImagePositionX: normalizePercent(home.membershipImagePositionX, defaults.membershipImagePositionX),
    membershipImagePositionY: normalizePercent(home.membershipImagePositionY, defaults.membershipImagePositionY),
    displaySettings: normalizeHomeDisplaySettings(home.displaySettings),
  };
}

export function getVisibleHomeNewsItems(items: HomeNewsItem[], limit = 3) {
  return items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.visible)
    .sort((left, right) => {
      const leftValid = isValidIsoDateString(left.item.publishedAt);
      const rightValid = isValidIsoDateString(right.item.publishedAt);

      if (leftValid && rightValid && left.item.publishedAt !== right.item.publishedAt) {
        return right.item.publishedAt.localeCompare(left.item.publishedAt);
      }

      if (leftValid !== rightValid) {
        return leftValid ? -1 : 1;
      }

      return left.index - right.index;
    })
    .slice(0, limit)
    .map(({ item }) => item);
}

export function validateHomeImageFile(file: File) {
  const lowerFileName = file.name.toLowerCase();
  const hasAllowedExtension = HOME_IMAGE_FILE_EXTENSIONS.some((extension) => lowerFileName.endsWith(extension));
  const hasAllowedContentType = !file.type || HOME_IMAGE_CONTENT_TYPES.has(file.type);

  if (!hasAllowedExtension || !hasAllowedContentType) {
    return 'Bitte nur PNG, JPG oder WEBP hochladen.';
  }

  if (file.size > HOME_IMAGE_MAX_UPLOAD_BYTES) {
    return 'Die Datei ist zu gross. Erlaubt sind maximal 3,5 MB.';
  }

  return null;
}

export function resolveHomeNewsLinkHref(value: string) {
  return normalizeNewsLinkHref(value);
}

export function resolveHomeEventCtaHref(rawHref: string | undefined) {
  const href = String(rawHref || '').trim();

  if (!href) {
    return '/veranstaltungen';
  }

  if (href.startsWith('/')) {
    const normalized = normalizeInternalHref(href, '/veranstaltungen');
    return normalized || '/veranstaltungen';
  }

  const normalized = normalizeExternalUrl(href);
  return /^(https?:\/\/|mailto:|tel:)/i.test(normalized) ? normalized : '/veranstaltungen';
}

export function resolveHomeNewsPublishedLabel(value: string) {
  if (!isValidIsoDateString(value)) {
    return '';
  }

  const [year, month, day] = value.split('-').map((entry) => Number.parseInt(entry, 10));
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Berlin',
  }).format(new Date(Date.UTC(year, month - 1, day, 12, 0, 0)));
}