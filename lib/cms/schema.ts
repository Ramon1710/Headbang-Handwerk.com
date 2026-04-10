export interface ThemeSettings {
  background: string;
  foreground: string;
  accent: string;
  accentStrong: string;
  accentSoft: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  muted: string;
  boxLabelFont: 'cinzel' | 'exo';
  boxTitleFont: 'cinzel' | 'exo';
  boxBodyFont: 'cinzel' | 'exo';
  boxLabelSize: string;
  boxTitleSize: string;
  boxBodySize: string;
}

export interface NavigationLink {
  label: string;
  href: string;
}

export interface FooterSocialLink {
  platform: 'facebook' | 'instagram' | 'youtube';
  label: string;
  href: string;
}

export interface HeroMetric {
  value: string;
  label: string;
}

export interface HighlightStat {
  value: string;
  label: string;
}

export interface PromiseCardContent {
  title: string;
  text: string;
  icon: 'flame' | 'users';
}

export interface ProcessStepContent {
  number: string;
  title: string;
  text: string;
}

export interface HomePageContent {
  heroBadge: string;
  heroTitle: string;
  heroLead: string;
  heroBody: string;
  heroPrimaryCtaLabel: string;
  heroPrimaryCtaHref: string;
  heroSecondaryCtaLabel: string;
  heroSecondaryCtaHref: string;
  heroMetrics: HeroMetric[];
  projectFocusEyebrow: string;
  projectFocusTitle: string;
  projectFocusText: string;
  projectFocusToneLabel: string;
  projectFocusToneValue: string;
  projectFocusImpactLabel: string;
  projectFocusImpactValue: string;
  stats: HighlightStat[];
  focusEyebrow: string;
  focusTitle: string;
  focusPoints: string[];
  promiseCards: PromiseCardContent[];
  processEyebrow: string;
  processTitle: string;
  processLead: string;
  processSteps: ProcessStepContent[];
  whyEyebrow: string;
  whyTitle: string;
  whyBody: string;
  whyBusinessLabel: string;
  whyBusinessText: string;
  whyYouthLabel: string;
  whyYouthText: string;
  updateEyebrow: string;
  updateTitle: string;
  updateParagraphs: string[];
  updatePrimaryCtaLabel: string;
  updatePrimaryCtaHref: string;
  updateSecondaryCtaLabel: string;
  updateSecondaryCtaHref: string;
  eventsEyebrow: string;
  eventsTitle: string;
  eventsCtaLabel: string;
  eventsCtaHref: string;
  packagesEyebrow: string;
  packagesTitle: string;
  packagesCtaLabel: string;
  packagesCtaHref: string;
  closingEyebrow: string;
  closingTitle: string;
  closingLead: string;
  closingStatement: string;
  closingPrimaryCtaLabel: string;
  closingPrimaryCtaHref: string;
  closingSecondaryCtaLabel: string;
  closingSecondaryCtaHref: string;
}

export interface FooterContent {
  brandHeadline: string;
  brandHighlight: string;
  copyrightName: string;
  socialLinks: FooterSocialLink[];
}

export interface SponsorsPageContent {
  title: string;
  accentWord: string;
  lead: string;
  benefitsTitle: string;
  benefits: string[];
  customPackageTitle: string;
  customPackageText: string;
  customPackageCtaLabel: string;
  customPackageCtaHref: string;
}

export interface AboutValueItem {
  title: string;
  description: string;
}

export interface AboutPageContent {
  title: string;
  accentWord: string;
  introParagraphs: string[];
  values: AboutValueItem[];
  teamTitle: string;
  teamRoles: string[];
  ctaLabel: string;
  ctaHref: string;
}

export interface ContactPageContent {
  title: string;
  lead: string;
  email: string;
  instagramLabel: string;
  facebookLabel: string;
  formTitle: string;
}

export interface StandPageContent {
  badge: string;
  title: string;
  accentWord: string;
  lead: string;
  overviewTitle: string;
  overviewPlaceholderTitle: string;
  overviewPlaceholderText: string;
  assetUrl: string;
  assetName: string;
  assetContentType: string;
  frontBannerLabel: string;
  backBannerLabel: string;
  leftLabel: string;
  rightLabel: string;
  availableTitle: string;
  reservedTitle: string;
}

export interface SeoContent {
  title: string;
  description: string;
  keywords: string[];
}

export interface SiteContent {
  seo: SeoContent;
  navigationLinks: NavigationLink[];
  navigationCtaLabel: string;
  navigationCtaHref: string;
  home: HomePageContent;
  sponsors: SponsorsPageContent;
  about: AboutPageContent;
  contact: ContactPageContent;
  stand: StandPageContent;
  footer: FooterContent;
}

export interface CmsContent {
  theme: ThemeSettings;
  site: SiteContent;
}