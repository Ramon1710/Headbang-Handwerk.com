import type { Metadata } from 'next';
import { Navigation } from '@/components/navigation';
import { Footer } from '@/components/footer';
import { ContactForm } from '@/components/contact-form';
import { getCmsContent } from '@/lib/cms/storage';
import { Mail, Instagram, Facebook } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Kontakt – Headbang Handwerk',
};

export default async function KontaktPage() {
  const cms = await getCmsContent();
  const contact = cms.site.contact;
  const instagramLink = cms.site.footer.socialLinks.find((item) => item.platform === 'instagram')?.href || '#';
  const facebookLink = cms.site.footer.socialLinks.find((item) => item.platform === 'facebook')?.href || '#';

  return (
    <>
      <Navigation
        links={cms.site.navigationLinks}
        ctaLabel={cms.site.navigationCtaLabel}
        ctaHref={cms.site.navigationCtaHref}
      />
      <main className="min-h-screen bg-transparent pt-28 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-1 content-flow text-center text-panel text-panel-roomy h-fit">
              <h1 className="text-4xl font-black text-white">
                <span className="text-[color:var(--color-accent)]">{contact.title}</span>
              </h1>
              <p className="text-gray-300 leading-relaxed max-w-md mx-auto">
                {contact.lead}
              </p>

              <div className="space-y-4 max-w-sm mx-auto">
                <a
                  href={`mailto:${contact.email}`}
                  className="flex items-center justify-center gap-3 text-gray-300 transition-colors hover:text-[color:var(--color-accent-soft)]"
                >
                  <div className="w-10 h-10 rounded-full bg-[linear-gradient(180deg,rgba(38,26,19,0.92)_0%,rgba(18,12,8,0.72)_100%)] ring-1 ring-white/8 flex items-center justify-center">
                    <Mail className="h-4 w-4 text-[color:var(--color-accent)]" />
                  </div>
                  {contact.email}
                </a>
                <a
                  href={instagramLink}
                  className="flex items-center justify-center gap-3 text-gray-300 transition-colors hover:text-[color:var(--color-accent-soft)]"
                >
                  <div className="w-10 h-10 rounded-full bg-[linear-gradient(180deg,rgba(38,26,19,0.92)_0%,rgba(18,12,8,0.72)_100%)] ring-1 ring-white/8 flex items-center justify-center">
                    <Instagram className="h-4 w-4 text-[color:var(--color-accent)]" />
                  </div>
                  {contact.instagramLabel}
                </a>
                <a
                  href={facebookLink}
                  className="flex items-center justify-center gap-3 text-gray-300 transition-colors hover:text-[color:var(--color-accent-soft)]"
                >
                  <div className="w-10 h-10 rounded-full bg-[linear-gradient(180deg,rgba(38,26,19,0.92)_0%,rgba(18,12,8,0.72)_100%)] ring-1 ring-white/8 flex items-center justify-center">
                    <Facebook className="h-4 w-4 text-[color:var(--color-accent)]" />
                  </div>
                  {contact.facebookLabel}
                </a>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="section-shell p-8">
                <h2 className="text-white font-bold text-xl mb-6 text-center">{contact.formTitle}</h2>
                <ContactForm />
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer content={cms.site.footer} />
    </>
  );
}
