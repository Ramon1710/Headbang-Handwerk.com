import type { Metadata } from 'next';
import { EditablePageShell } from '@/components/editable-page-shell';
import { LiveEditableText } from '@/components/live-editable-text';
import { LiveResizableBox } from '@/components/live-resizable-box';
import { Button } from '@/components/ui/button';
import { isAdminAuthenticated } from '@/lib/cms/auth';
import { resolveLiveBoxStyle, resolveLiveHtml } from '@/lib/cms/live-editor';
import { getCmsContent } from '@/lib/cms/storage';

export const metadata: Metadata = {
  title: 'Spenden-Seite – Headbang Handwerk',
  description: 'Informationen rund um Spendenmöglichkeiten für Headbang Handwerk e.V.',
};

export default async function SpendenPage({
  searchParams,
}: {
  searchParams?: Promise<{ view?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const cms = await getCmsContent();
  const isAuthenticatedAdmin = await isAdminAuthenticated();
  const isAdmin = isAuthenticatedAdmin && params?.view !== 'user';
  const liveEditor = cms.site.liveEditor;

  return (
    <EditablePageShell cms={cms} isAdmin={isAdmin} mainClassName="min-h-screen bg-transparent pt-28 pb-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <LiveResizableBox boxKey="donation.intro.box" initialStyle={resolveLiveBoxStyle(liveEditor, 'donation.intro.box')} isAdmin={isAdmin} className="section-shell content-box sm:p-10">
            <LiveEditableText as="h1" className="page-title" editorKey="donation.title" initialHtml={resolveLiveHtml(liveEditor, 'donation.title', 'Spenden-Seite')} isAdmin={isAdmin} title="Spenden Titel" normalizeTypography />
            <LiveEditableText as="p" className="body-copy-lg mt-6" editorKey="donation.lead" initialHtml={resolveLiveHtml(liveEditor, 'donation.lead', 'Mit eurer Spende helft ihr uns dabei, Headbang Handwerk weiter aufzubauen, Veranstaltungen vorzubereiten und das Handwerk dort sichtbar zu machen, wo Menschen wirklich hinschauen.')} isAdmin={isAdmin} title="Spenden Einleitung" normalizeTypography />
          </LiveResizableBox>

          <LiveResizableBox boxKey="donation.status.box" initialStyle={resolveLiveBoxStyle(liveEditor, 'donation.status.box')} isAdmin={isAdmin} className="section-shell content-box">
            <LiveEditableText as="h2" className="section-title" editorKey="donation.statusTitle" initialHtml={resolveLiveHtml(liveEditor, 'donation.statusTitle', 'Spenden werden in Kürze möglich')} isAdmin={isAdmin} title="Spenden Status Titel" normalizeTypography />
            <LiveEditableText as="p" className="body-copy mt-4" editorKey="donation.statusBody" initialHtml={resolveLiveHtml(liveEditor, 'donation.statusBody', 'Aktuell steht noch kein Giro-Konto zur Verfügung. Sobald unser Spendenkonto eingerichtet ist, könnt ihr hier direkt alle Informationen und Möglichkeiten zur Unterstützung finden.')} isAdmin={isAdmin} title="Spenden Status Text" normalizeTypography />
            <div className="mt-6 grid gap-4">
              <Button href="/kontakt" className="w-full justify-center">Kontakt aufnehmen</Button>
              <Button href="/veranstaltungen" variant="secondary" className="w-full justify-center">Zu den Veranstaltungen</Button>
            </div>
          </LiveResizableBox>
        </div>

        <LiveResizableBox boxKey="donation.why.box" initialStyle={resolveLiveBoxStyle(liveEditor, 'donation.why.box')} isAdmin={isAdmin} className="section-shell content-box mt-8 sm:p-10">
          <LiveEditableText as="h2" className="section-title" editorKey="donation.whyTitle" initialHtml={resolveLiveHtml(liveEditor, 'donation.whyTitle', 'Warum eure Spende wichtig ist')} isAdmin={isAdmin} title="Spenden Warum Titel" normalizeTypography />
          <LiveEditableText as="div" className="body-copy-lg mt-6 space-y-5" editorKey="donation.whyBody" initialHtml={resolveLiveHtml(liveEditor, 'donation.whyBody', 'Mit jeder Unterstützung schaffen wir mehr Sichtbarkeit für Berufe, Betriebe und junge Menschen, die das Handwerk live erleben sollen.<p>Spenden helfen uns bei Planung, Material, Präsenz auf Veranstaltungen und dem weiteren Aufbau von Headbang Handwerk e.V.</p><p>Bis die direkte Spendenfunktion verfügbar ist, könnt ihr uns gerne über das Kontaktformular ansprechen, wenn ihr schon jetzt helfen oder Partner werden möchtet.</p>')} isAdmin={isAdmin} title="Spenden Warum Text" normalizeTypography />
        </LiveResizableBox>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <LiveResizableBox boxKey="donation.transparency.box" initialStyle={resolveLiveBoxStyle(liveEditor, 'donation.transparency.box')} isAdmin={isAdmin} className="section-shell content-box">
            <LiveEditableText as="h3" className="section-title text-[1.8rem]" editorKey="donation.transparencyTitle" initialHtml={resolveLiveHtml(liveEditor, 'donation.transparencyTitle', 'Was hier bald möglich ist')} isAdmin={isAdmin} title="Spenden Transparenz Titel" normalizeTypography />
            <LiveEditableText as="div" className="body-copy mt-5 space-y-4" editorKey="donation.transparencyBody" initialHtml={resolveLiveHtml(liveEditor, 'donation.transparencyBody', '<p>Spenden per Überweisung auf das Vereinskonto</p><p>Klare Hinweise zur Verwendung der Mittel</p><p>Aktuelle Informationen zu gemeinnütziger Unterstützung und nächsten Schritten</p>')} isAdmin={isAdmin} title="Spenden Transparenz Text" normalizeTypography />
          </LiveResizableBox>

          <LiveResizableBox boxKey="donation.nextsteps.box" initialStyle={resolveLiveBoxStyle(liveEditor, 'donation.nextsteps.box')} isAdmin={isAdmin} className="section-shell content-box">
            <LiveEditableText as="h3" className="section-title text-[1.8rem]" editorKey="donation.nextstepsTitle" initialHtml={resolveLiveHtml(liveEditor, 'donation.nextstepsTitle', 'Schon jetzt unterstützen')} isAdmin={isAdmin} title="Spenden Nächste Schritte Titel" normalizeTypography />
            <LiveEditableText as="div" className="body-copy mt-5 space-y-4" editorKey="donation.nextstepsBody" initialHtml={resolveLiveHtml(liveEditor, 'donation.nextstepsBody', '<p>Teilt unser Projekt mit interessierten Betrieben, Unterstützern und Institutionen.</p><p>Nehmt Kontakt zu uns auf, wenn ihr Sachleistungen, Reichweite oder Partnerschaften einbringen möchtet.</p><p>Schaut regelmäßig vorbei, um den Start der direkten Spendenmöglichkeit nicht zu verpassen.</p>')} isAdmin={isAdmin} title="Spenden Nächste Schritte Text" normalizeTypography />
          </LiveResizableBox>
        </div>
      </div>
    </EditablePageShell>
  );
}