import { Navigation } from '@/components/navigation';
import { Footer } from '@/components/footer';
import { HeroSection } from '@/components/hero-section';
import { SectionWhatIs } from '@/components/section-what-is';
import { SectionWhy } from '@/components/section-why';
import { SectionEventsPreview } from '@/components/section-events-preview';
import { SectionSponsoringPreview } from '@/components/section-sponsoring-preview';
import { SectionMerchTeaser } from '@/components/section-merch-teaser';
import { SectionBannerTeaser } from '@/components/section-banner-teaser';
import { SectionPartners } from '@/components/section-partners';

export default function HomePage() {
  return (
    <>
      <Navigation />
      <main>
        <HeroSection />
        <SectionWhatIs />
        <SectionWhy />
        <SectionEventsPreview />
        <SectionSponsoringPreview />
        <SectionBannerTeaser />
        <SectionMerchTeaser />
        <SectionPartners />
      </main>
      <Footer />
    </>
  );
}
