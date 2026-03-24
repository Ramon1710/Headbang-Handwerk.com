import Image from 'next/image';
import { Navigation } from '@/components/navigation';
import headbangLogo from '../Headbang Handwerk e.V. Logo.png';
import headbangStandImage from '../Headbang Stand Bild.png';
import wackenBackgroundImage from '../Wacken Hintergrund Bild.png';

export default function HomePage() {
  return (
    <>
      <Navigation />
      <main
        className="relative isolate min-h-screen overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(rgba(6, 3, 2, 0.82), rgba(6, 3, 2, 0.95)), url(${wackenBackgroundImage.src}), url(${headbangStandImage.src})`,
          backgroundPosition: 'center top, center top, center top',
          backgroundRepeat: 'no-repeat, no-repeat, no-repeat',
          backgroundSize: 'cover, cover, cover',
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,132,30,0.16)_0%,transparent_36%),linear-gradient(180deg,rgba(6,3,2,0.18)_0%,rgba(6,3,2,0.72)_100%)]" />

        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 pt-28 pb-16 sm:px-6 lg:px-8">
          <div className="mb-10 flex justify-center">
            <Image
              src={headbangLogo}
              alt="Headbang Handwerk Logo"
              priority
              className="h-auto w-64 sm:w-80 lg:w-[26rem] drop-shadow-[0_18px_45px_rgba(0,0,0,0.55)]"
            />
          </div>

          <div className="relative w-full max-w-5xl overflow-hidden rounded-[2rem] ring-1 ring-[#8b572f]/45 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
            <Image
              src={headbangStandImage}
              alt="Headbang Handwerk Stand"
              className="h-auto w-full object-cover"
              priority
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,5,3,0.08)_0%,rgba(8,5,3,0.28)_100%)]" />
          </div>
      </main>
    </>
  );
}
