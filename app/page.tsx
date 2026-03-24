import { Navigation } from '@/components/navigation';
import { Footer } from '@/components/footer';
import { HeroSection } from '@/components/hero-section';
import { SectionWhatIs } from '@/components/section-what-is';
import { SectionWhy } from '@/components/section-why';
import { SectionEventsPreview } from '@/components/section-events-preview';
import { SectionSponsoringPreview } from '@/components/section-sponsoring-preview';
import { SectionBannerTeaser } from '@/components/section-banner-teaser';
import { SectionPartners } from '@/components/section-partners';
import headbangStandImage from '../Headbang Stand Bild.png';
import wackenBackgroundImage from '../Wacken Hintergrund Bild.png';

export default function HomePage() {
  return (
    <>
      <Navigation />
      <main
        className="relative isolate overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(rgba(6, 3, 2, 0.82), rgba(6, 3, 2, 0.95)), url(${wackenBackgroundImage.src}), url(${headbangStandImage.src})`,
          backgroundPosition: 'center top, center top, center top',
          backgroundRepeat: 'no-repeat, no-repeat, no-repeat',
          backgroundSize: 'cover, cover, cover',
        }}
      >
        <HeroSection />
        <SectionWhatIs />
        <SectionWhy />
        <SectionEventsPreview />
        <SectionSponsoringPreview />
        <SectionBannerTeaser />
        <SectionPartners />
      </main>
      <Footer />
    </>
  );
}
