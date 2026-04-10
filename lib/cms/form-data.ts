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
  sponsorsTitle: string;
  sponsorsAccentWord: string;
  sponsorsLead: string;
  sponsorsBenefitsTitle: string;
  sponsorsBenefits: string;
  sponsorsCustomPackageTitle: string;
  sponsorsCustomPackageText: string;
  sponsorsCustomPackageCtaLabel: string;
  sponsorsCustomPackageCtaHref: string;
  aboutTitle: string;
  aboutAccentWord: string;
  aboutIntroParagraphs: string;
  aboutValueOneTitle: string;
  aboutValueOneDescription: string;
  aboutValueTwoTitle: string;
  aboutValueTwoDescription: string;
  aboutValueThreeTitle: string;
  aboutValueThreeDescription: string;
  aboutTeamTitle: string;
  aboutTeamRoles: string;
  aboutCtaLabel: string;
  aboutCtaHref: string;
  contactTitle: string;
  contactLead: string;
  contactEmail: string;
  contactInstagramLabel: string;
  contactFacebookLabel: string;
  contactFormTitle: string;
  standBadge: string;
  standTitle: string;
  standAccentWord: string;
  standLead: string;
  standOverviewTitle: string;
  standOverviewPlaceholderTitle: string;
  standOverviewPlaceholderText: string;
  standFrontBannerLabel: string;
  standBackBannerLabel: string;
  standLeftLabel: string;
  standRightLabel: string;
  standAvailableTitle: string;
  standReservedTitle: string;
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
    sponsorsTitle: content.site.sponsors.title,
    sponsorsAccentWord: content.site.sponsors.accentWord,
    sponsorsLead: content.site.sponsors.lead,
    sponsorsBenefitsTitle: content.site.sponsors.benefitsTitle,
    sponsorsBenefits: toLines(content.site.sponsors.benefits),
    sponsorsCustomPackageTitle: content.site.sponsors.customPackageTitle,
    sponsorsCustomPackageText: content.site.sponsors.customPackageText,
    sponsorsCustomPackageCtaLabel: content.site.sponsors.customPackageCtaLabel,
    sponsorsCustomPackageCtaHref: content.site.sponsors.customPackageCtaHref,
    aboutTitle: content.site.about.title,
    aboutAccentWord: content.site.about.accentWord,
    aboutIntroParagraphs: toLines(content.site.about.introParagraphs),
    aboutValueOneTitle: content.site.about.values[0]?.title || '',
    aboutValueOneDescription: content.site.about.values[0]?.description || '',
    aboutValueTwoTitle: content.site.about.values[1]?.title || '',
    aboutValueTwoDescription: content.site.about.values[1]?.description || '',
    aboutValueThreeTitle: content.site.about.values[2]?.title || '',
    aboutValueThreeDescription: content.site.about.values[2]?.description || '',
    aboutTeamTitle: content.site.about.teamTitle,
    aboutTeamRoles: toLines(content.site.about.teamRoles),
    aboutCtaLabel: content.site.about.ctaLabel,
    aboutCtaHref: content.site.about.ctaHref,
    contactTitle: content.site.contact.title,
    contactLead: content.site.contact.lead,
    contactEmail: content.site.contact.email,
    contactInstagramLabel: content.site.contact.instagramLabel,
    contactFacebookLabel: content.site.contact.facebookLabel,
    contactFormTitle: content.site.contact.formTitle,
    standBadge: content.site.stand.badge,
    standTitle: content.site.stand.title,
    standAccentWord: content.site.stand.accentWord,
    standLead: content.site.stand.lead,
    standOverviewTitle: content.site.stand.overviewTitle,
    standOverviewPlaceholderTitle: content.site.stand.overviewPlaceholderTitle,
    standOverviewPlaceholderText: content.site.stand.overviewPlaceholderText,
    standFrontBannerLabel: content.site.stand.frontBannerLabel,
    standBackBannerLabel: content.site.stand.backBannerLabel,
    standLeftLabel: content.site.stand.leftLabel,
    standRightLabel: content.site.stand.rightLabel,
    standAvailableTitle: content.site.stand.availableTitle,
    standReservedTitle: content.site.stand.reservedTitle,
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
      sponsors: {
        ...current.site.sponsors,
        title: getString(formData, 'sponsorsTitle', current.site.sponsors.title),
        accentWord: getString(formData, 'sponsorsAccentWord', current.site.sponsors.accentWord),
        lead: getString(formData, 'sponsorsLead', current.site.sponsors.lead),
        benefitsTitle: getString(formData, 'sponsorsBenefitsTitle', current.site.sponsors.benefitsTitle),
        benefits: fromLines(formData.get('sponsorsBenefits')),
        customPackageTitle: getString(formData, 'sponsorsCustomPackageTitle', current.site.sponsors.customPackageTitle),
        customPackageText: getString(formData, 'sponsorsCustomPackageText', current.site.sponsors.customPackageText),
        customPackageCtaLabel: getString(formData, 'sponsorsCustomPackageCtaLabel', current.site.sponsors.customPackageCtaLabel),
        customPackageCtaHref: getString(formData, 'sponsorsCustomPackageCtaHref', current.site.sponsors.customPackageCtaHref),
      },
      about: {
        ...current.site.about,
        title: getString(formData, 'aboutTitle', current.site.about.title),
        accentWord: getString(formData, 'aboutAccentWord', current.site.about.accentWord),
        introParagraphs: fromLines(formData.get('aboutIntroParagraphs')),
        values: [
          {
            title: getString(formData, 'aboutValueOneTitle', current.site.about.values[0]?.title),
            description: getString(formData, 'aboutValueOneDescription', current.site.about.values[0]?.description),
          },
          {
            title: getString(formData, 'aboutValueTwoTitle', current.site.about.values[1]?.title),
            description: getString(formData, 'aboutValueTwoDescription', current.site.about.values[1]?.description),
          },
          {
            title: getString(formData, 'aboutValueThreeTitle', current.site.about.values[2]?.title),
            description: getString(formData, 'aboutValueThreeDescription', current.site.about.values[2]?.description),
          },
        ],
        teamTitle: getString(formData, 'aboutTeamTitle', current.site.about.teamTitle),
        teamRoles: fromLines(formData.get('aboutTeamRoles')),
        ctaLabel: getString(formData, 'aboutCtaLabel', current.site.about.ctaLabel),
        ctaHref: getString(formData, 'aboutCtaHref', current.site.about.ctaHref),
      },
      contact: {
        ...current.site.contact,
        title: getString(formData, 'contactTitle', current.site.contact.title),
        lead: getString(formData, 'contactLead', current.site.contact.lead),
        email: getString(formData, 'contactEmail', current.site.contact.email),
        instagramLabel: getString(formData, 'contactInstagramLabel', current.site.contact.instagramLabel),
        facebookLabel: getString(formData, 'contactFacebookLabel', current.site.contact.facebookLabel),
        formTitle: getString(formData, 'contactFormTitle', current.site.contact.formTitle),
      },
      stand: {
        ...current.site.stand,
        badge: getString(formData, 'standBadge', current.site.stand.badge),
        title: getString(formData, 'standTitle', current.site.stand.title),
        accentWord: getString(formData, 'standAccentWord', current.site.stand.accentWord),
        lead: getString(formData, 'standLead', current.site.stand.lead),
        overviewTitle: getString(formData, 'standOverviewTitle', current.site.stand.overviewTitle),
        overviewPlaceholderTitle: getString(formData, 'standOverviewPlaceholderTitle', current.site.stand.overviewPlaceholderTitle),
        overviewPlaceholderText: getString(formData, 'standOverviewPlaceholderText', current.site.stand.overviewPlaceholderText),
        frontBannerLabel: getString(formData, 'standFrontBannerLabel', current.site.stand.frontBannerLabel),
        backBannerLabel: getString(formData, 'standBackBannerLabel', current.site.stand.backBannerLabel),
        leftLabel: getString(formData, 'standLeftLabel', current.site.stand.leftLabel),
        rightLabel: getString(formData, 'standRightLabel', current.site.stand.rightLabel),
        availableTitle: getString(formData, 'standAvailableTitle', current.site.stand.availableTitle),
        reservedTitle: getString(formData, 'standReservedTitle', current.site.stand.reservedTitle),
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