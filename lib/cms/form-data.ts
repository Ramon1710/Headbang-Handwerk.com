import { defaultCmsContent } from './default-content';
import type { CmsContent } from './schema';

function toLines(value: string[]) {
  return value.join('\n');
}

function fromLines(value: FormDataEntryValue | null) {
  return String(value || '')
    .split('\n')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function getString(formData: FormData, key: string, fallback = '') {
  return String(formData.get(key) || fallback).trim();
}

export interface CmsFormValues {
  siteTitle: string;
  siteDescription: string;
  keywords: string;
  navCtaLabel: string;
  navCtaHref: string;
  heroBadge: string;
  heroTitle: string;
  heroLead: string;
  heroBody: string;
  heroPrimaryCtaLabel: string;
  heroPrimaryCtaHref: string;
  heroSecondaryCtaLabel: string;
  heroSecondaryCtaHref: string;
  heroMetricOneValue: string;
  heroMetricOneLabel: string;
  heroMetricTwoValue: string;
  heroMetricTwoLabel: string;
  heroMetricThreeValue: string;
  heroMetricThreeLabel: string;
  focusTitle: string;
  focusPoints: string;
  updateTitle: string;
  updateParagraphs: string;
  closingTitle: string;
  closingLead: string;
  closingStatement: string;
  footerHeadline: string;
  footerHighlight: string;
  facebookUrl: string;
  instagramUrl: string;
  youtubeUrl: string;
  themeBackground: string;
  themeForeground: string;
  themeAccent: string;
  themeAccentStrong: string;
  themeAccentSoft: string;
  themeSurface: string;
  themeSurfaceAlt: string;
  themeBorder: string;
  themeMuted: string;
}

export function cmsContentToFormValues(content: CmsContent): CmsFormValues {
  const defaults = defaultCmsContent.site.footer.socialLinks;
  const socialMap = Object.fromEntries(content.site.footer.socialLinks.map((item) => [item.platform, item.href]));

  return {
    siteTitle: content.site.seo.title,
    siteDescription: content.site.seo.description,
    keywords: toLines(content.site.seo.keywords),
    navCtaLabel: content.site.navigationCtaLabel,
    navCtaHref: content.site.navigationCtaHref,
    heroBadge: content.site.home.heroBadge,
    heroTitle: content.site.home.heroTitle,
    heroLead: content.site.home.heroLead,
    heroBody: content.site.home.heroBody,
    heroPrimaryCtaLabel: content.site.home.heroPrimaryCtaLabel,
    heroPrimaryCtaHref: content.site.home.heroPrimaryCtaHref,
    heroSecondaryCtaLabel: content.site.home.heroSecondaryCtaLabel,
    heroSecondaryCtaHref: content.site.home.heroSecondaryCtaHref,
    heroMetricOneValue: content.site.home.heroMetrics[0]?.value || '',
    heroMetricOneLabel: content.site.home.heroMetrics[0]?.label || '',
    heroMetricTwoValue: content.site.home.heroMetrics[1]?.value || '',
    heroMetricTwoLabel: content.site.home.heroMetrics[1]?.label || '',
    heroMetricThreeValue: content.site.home.heroMetrics[2]?.value || '',
    heroMetricThreeLabel: content.site.home.heroMetrics[2]?.label || '',
    focusTitle: content.site.home.focusTitle,
    focusPoints: toLines(content.site.home.focusPoints),
    updateTitle: content.site.home.updateTitle,
    updateParagraphs: toLines(content.site.home.updateParagraphs),
    closingTitle: content.site.home.closingTitle,
    closingLead: content.site.home.closingLead,
    closingStatement: content.site.home.closingStatement,
    footerHeadline: content.site.footer.brandHeadline,
    footerHighlight: content.site.footer.brandHighlight,
    facebookUrl: socialMap.facebook || defaults.find((item) => item.platform === 'facebook')?.href || '#',
    instagramUrl: socialMap.instagram || defaults.find((item) => item.platform === 'instagram')?.href || '#',
    youtubeUrl: socialMap.youtube || defaults.find((item) => item.platform === 'youtube')?.href || '#',
    themeBackground: content.theme.background,
    themeForeground: content.theme.foreground,
    themeAccent: content.theme.accent,
    themeAccentStrong: content.theme.accentStrong,
    themeAccentSoft: content.theme.accentSoft,
    themeSurface: content.theme.surface,
    themeSurfaceAlt: content.theme.surfaceAlt,
    themeBorder: content.theme.border,
    themeMuted: content.theme.muted,
  };
}

export function mergeCmsContentFromForm(formData: FormData, current: CmsContent): CmsContent {
  return {
    ...current,
    theme: {
      background: getString(formData, 'themeBackground', current.theme.background),
      foreground: getString(formData, 'themeForeground', current.theme.foreground),
      accent: getString(formData, 'themeAccent', current.theme.accent),
      accentStrong: getString(formData, 'themeAccentStrong', current.theme.accentStrong),
      accentSoft: getString(formData, 'themeAccentSoft', current.theme.accentSoft),
      surface: getString(formData, 'themeSurface', current.theme.surface),
      surfaceAlt: getString(formData, 'themeSurfaceAlt', current.theme.surfaceAlt),
      border: getString(formData, 'themeBorder', current.theme.border),
      muted: getString(formData, 'themeMuted', current.theme.muted),
    },
    site: {
      ...current.site,
      seo: {
        title: getString(formData, 'siteTitle', current.site.seo.title),
        description: getString(formData, 'siteDescription', current.site.seo.description),
        keywords: fromLines(formData.get('keywords')),
      },
      navigationCtaLabel: getString(formData, 'navCtaLabel', current.site.navigationCtaLabel),
      navigationCtaHref: getString(formData, 'navCtaHref', current.site.navigationCtaHref),
      home: {
        ...current.site.home,
        heroBadge: getString(formData, 'heroBadge', current.site.home.heroBadge),
        heroTitle: getString(formData, 'heroTitle', current.site.home.heroTitle),
        heroLead: getString(formData, 'heroLead', current.site.home.heroLead),
        heroBody: getString(formData, 'heroBody', current.site.home.heroBody),
        heroPrimaryCtaLabel: getString(formData, 'heroPrimaryCtaLabel', current.site.home.heroPrimaryCtaLabel),
        heroPrimaryCtaHref: getString(formData, 'heroPrimaryCtaHref', current.site.home.heroPrimaryCtaHref),
        heroSecondaryCtaLabel: getString(formData, 'heroSecondaryCtaLabel', current.site.home.heroSecondaryCtaLabel),
        heroSecondaryCtaHref: getString(formData, 'heroSecondaryCtaHref', current.site.home.heroSecondaryCtaHref),
        heroMetrics: [
          {
            value: getString(formData, 'heroMetricOneValue', current.site.home.heroMetrics[0]?.value),
            label: getString(formData, 'heroMetricOneLabel', current.site.home.heroMetrics[0]?.label),
          },
          {
            value: getString(formData, 'heroMetricTwoValue', current.site.home.heroMetrics[1]?.value),
            label: getString(formData, 'heroMetricTwoLabel', current.site.home.heroMetrics[1]?.label),
          },
          {
            value: getString(formData, 'heroMetricThreeValue', current.site.home.heroMetrics[2]?.value),
            label: getString(formData, 'heroMetricThreeLabel', current.site.home.heroMetrics[2]?.label),
          },
        ],
        focusTitle: getString(formData, 'focusTitle', current.site.home.focusTitle),
        focusPoints: fromLines(formData.get('focusPoints')),
        updateTitle: getString(formData, 'updateTitle', current.site.home.updateTitle),
        updateParagraphs: fromLines(formData.get('updateParagraphs')),
        closingTitle: getString(formData, 'closingTitle', current.site.home.closingTitle),
        closingLead: getString(formData, 'closingLead', current.site.home.closingLead),
        closingStatement: getString(formData, 'closingStatement', current.site.home.closingStatement),
      },
      footer: {
        ...current.site.footer,
        brandHeadline: getString(formData, 'footerHeadline', current.site.footer.brandHeadline),
        brandHighlight: getString(formData, 'footerHighlight', current.site.footer.brandHighlight),
        socialLinks: current.site.footer.socialLinks.map((link) => ({
          ...link,
          href: getString(
            formData,
            link.platform === 'facebook'
              ? 'facebookUrl'
              : link.platform === 'instagram'
                ? 'instagramUrl'
                : 'youtubeUrl',
            link.href
          ),
        })),
      },
    },
  };
}