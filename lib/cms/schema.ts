import type { Event, MerchandiseProduct, SponsorPackage } from '@/lib/types';

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
  id?: string;
  label: string;
  href: string;
  placement?: 'primary' | 'more';
}

export interface MediaAsset {
  assetUrl: string;
  assetName: string;
  assetContentType: string;
}

export interface GalleryImage extends MediaAsset {
  id: string;
}

export interface GalleryFolder {
  id: string;
  title: string;
  coverImage: MediaAsset;
  images: GalleryImage[];
}

export interface FooterSocialLink {
  platform: 'facebook' | 'instagram' | 'youtube' | 'tiktok';
  label: string;
  href: string;
}

export interface FooterLink {
  id?: string;
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

export interface HomeNewsItem {
  id: string;
  title: string;
  excerpt: string;
  imageUrl: string;
  imageAlt: string;
  imageName?: string;
  imageContentType?: string;
  publishedAt: string;
  linkLabel?: string;
  linkHref?: string;
  visible: boolean;
}

export interface HomeDisplaySettings {
  heroHeightDesktop: number;
  heroHeightMobile: number;
  heroTitleSizeDesktop: number;
  heroTitleSizeMobile: number;
  sectionTitleSizeDesktop: number;
  sectionTitleSizeMobile: number;
  sectionSpacingDesktop: number;
  sectionSpacingMobile: number;
  cardGap: number;
  eventImageHeight: number;
  newsImageHeight: number;
  membershipMinHeight: number;
}

export interface LiveEditorBoxStyle {
  width?: string;
  height?: string;
  minHeight?: string;
  x?: string;
  y?: string;
}

export interface LiveEditorContent {
  richText: Record<string, string>;
  boxStyles: Record<string, LiveEditorBoxStyle>;
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
  newsTitle: string;
  newsParagraphs: string[];
  newsImages: MediaAsset[];
  newsImagePositionX: number;
  newsImagePositionY: number;
  heroSubtitle: string;
  heroDescription: string;
  heroImageAlt: string;
  heroImagePositionX: number;
  heroImagePositionY: number;
  eventsSectionTitle: string;
  eventsSectionIntro: string;
  eventsSectionCtaLabel: string;
  eventsEmptyText: string;
  newsSectionTitle: string;
  newsSectionIntro: string;
  newsEmptyText: string;
  newsItems: HomeNewsItem[];
  membershipTitle: string;
  membershipBody: string;
  membershipCtaLabel: string;
  membershipCtaHref: string;
  membershipImage: MediaAsset;
  membershipImageAlt: string;
  membershipImagePositionX: number;
  membershipImagePositionY: number;
  displaySettings: HomeDisplaySettings;
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
  heroImage: MediaAsset;
  backgroundImage: MediaAsset;
  instagramVideo: MediaAsset;
}

export interface FooterContent {
  brandHeadline: string;
  brandHighlight: string;
  description?: string;
  copyrightName: string;
  socialLinks: FooterSocialLink[];
  informationHeading?: string;
  informationLinks?: FooterLink[];
  contactHeading?: string;
  contactLinks?: FooterLink[];
  contactEmail?: string;
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

export interface AboutSectionContent {
  eyebrow: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface AboutTeamMember {
  role: string;
  description: string;
  image: MediaAsset;
  imageAlt: string;
}

export interface AboutPageContent {
  title: string;
  accentWord: string;
  introParagraphs: string[];
  values: AboutValueItem[];
  sections: AboutSectionContent[];
  teamTitle: string;
  teamLead: string;
  teamRoles: string[];
  teamImages: MediaAsset[];
  teamMembers: AboutTeamMember[];
  closingEyebrow: string;
  closingTitle: string;
  closingBody: string;
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

export interface MerchandisePageContent {
  eyebrow: string;
  title: string;
  lead: string;
  products: MerchandiseProduct[];
}

export interface GalleryPageContent {
  eyebrow: string;
  title: string;
  lead: string;
  folders: GalleryFolder[];
}

export interface PartnerEntry {
  id: string;
  name: string;
  website: string;
  description: string;
  logo: MediaAsset;
  logoBoxBackground?: string;
  logoBoxOpacity?: number;
}

export interface SeoContent {
  title: string;
  description: string;
  keywords: string[];
}

export interface SiteContent {
  seo: SeoContent;
  logo: MediaAsset;
  navigationLinks: NavigationLink[];
  navigationCtaLabel: string;
  navigationCtaHref: string;
  events: Event[];
  sponsorPackages: SponsorPackage[];
  partners: PartnerEntry[];
  liveEditor: LiveEditorContent;
  home: HomePageContent;
  sponsors: SponsorsPageContent;
  about: AboutPageContent;
  contact: ContactPageContent;
  stand: StandPageContent;
  merchandise: MerchandisePageContent;
  gallery: GalleryPageContent;
  footer: FooterContent;
}

export interface CmsContent {
  theme: ThemeSettings;
  site: SiteContent;
}