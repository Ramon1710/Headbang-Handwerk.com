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
  footer: FooterContent;
}

export interface CmsContent {
  theme: ThemeSettings;
  site: SiteContent;
}