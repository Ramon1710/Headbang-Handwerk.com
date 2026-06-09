'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/cms/auth';
import { getCmsContent, saveCmsContent } from '@/lib/cms/storage';

function sanitizeText(value: FormDataEntryValue | null) {
  return String(value || '').trim();
}

export async function updateContactInfoAction(formData: FormData) {
  if (!(await isAdminAuthenticated())) {
    redirect('/admin/login?next=/kontakt');
  }

  const current = await getCmsContent();
  const instagramUrl = sanitizeText(formData.get('instagramUrl')) || 'https://www.instagram.com/headbang.handwerk/';

  await saveCmsContent({
    ...current,
    site: {
      ...current.site,
      contact: {
        ...current.site.contact,
        email: sanitizeText(formData.get('contactEmail')) || current.site.contact.email,
        instagramLabel: sanitizeText(formData.get('contactInstagramLabel')) || current.site.contact.instagramLabel,
        facebookLabel: sanitizeText(formData.get('contactFacebookLabel')) || current.site.contact.facebookLabel,
        formTitle: sanitizeText(formData.get('contactFormTitle')) || current.site.contact.formTitle,
      },
      footer: {
        ...current.site.footer,
        socialLinks: current.site.footer.socialLinks.map((link) =>
          link.platform === 'instagram' ? { ...link, href: instagramUrl } : link
        ),
      },
    },
  });

  revalidatePath('/', 'layout');
  revalidatePath('/kontakt');
  redirect('/kontakt?adminSaved=contact');
}