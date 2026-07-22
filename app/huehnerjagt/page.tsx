import type { Metadata } from 'next'
import { EditablePageShell } from '@/components/editable-page-shell'
import { isAdminAuthenticated } from '@/lib/cms/auth'
import { getCmsContent } from '@/lib/cms/storage'

export const metadata: Metadata = {
	title: 'Game – Headbang Hühnerjagd',
	description: 'Die Headbang Hühnerjagd direkt auf der Website: im kompakten Spielfenster, mobil spielbar und mit voller Navigation.',
}

export default async function HuehnerjagdPage({
	searchParams,
}: {
	searchParams?: Promise<{ view?: string }>
}) {
	const params = searchParams ? await searchParams : undefined
	const cms = await getCmsContent()
	const isAuthenticatedAdmin = await isAdminAuthenticated()
	const isAdmin = isAuthenticatedAdmin && params?.view !== 'user'

	return (
		<EditablePageShell cms={cms} isAdmin={isAdmin} mainClassName="min-h-screen bg-transparent pt-28 pb-24">
			<div className="mx-auto flex w-full max-w-5xl flex-col items-center">
				<section className="copy-center content-flow mb-8 w-full px-4 sm:px-6">
					<p className="text-center text-xs font-semibold uppercase tracking-[0.38em] text-[color:var(--color-accent-soft)]">Game</p>
					<h1 className="page-title text-center">
						<span className="inline">Headbang</span>{' '}
						<span className="inline text-[color:var(--color-accent)]">Hühnerjagd</span>
					</h1>
					<p className="mx-auto max-w-3xl body-copy-lg text-center">
						Triff die fliegenden Festival-Hühner, sammle Punkte und zocke direkt auf der Website. Die Seite bleibt im normalen Layout mit Navigation,
						und das Spiel läuft in einem kompakten Fenster auch auf dem Handy.
					</p>
				</section>

				<section className="w-full max-w-[760px] px-4 sm:px-6">
					<div className="mb-4 rounded-2xl border border-[color:var(--color-border)] bg-[linear-gradient(180deg,rgba(21,17,14,0.84)_0%,rgba(11,8,7,0.9)_100%)] px-4 py-4 text-center shadow-[0_18px_40px_rgba(0,0,0,0.25)]">
						<p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-accent-soft)]">Steuerung</p>
						<p className="mt-2 body-copy text-[color:var(--color-muted)]">
							Desktop: zielen und schießen per Maus oder Touchpad. Handy: direkt im Spielfeld tippen, die Route bleibt dabei in der normalen Website-Ansicht.
						</p>
					</div>

					<div className="relative overflow-hidden rounded-[1.35rem] border-4 border-[color:var(--color-border)] bg-[radial-gradient(ellipse_at_center,rgba(31,24,20,1)_0%,rgba(5,5,5,1)_100%)] shadow-[0_0_25px_rgba(255,255,255,0.12),inset_0_0_30px_rgba(0,0,0,1)]">
						<iframe
							src="/huehnerjagt/embed"
							title="Headbang Hühnerjagd"
							className="block h-[72svh] min-h-[520px] w-full border-0 bg-black sm:h-[760px]"
							loading="eager"
						/>
					</div>

					<p className="mt-4 text-center text-sm text-[color:var(--color-muted)]">
						Das Spiel öffnet sich bewusst nicht im Vollbild, sondern wie der Baustellen-Rocker innerhalb der Website.
					</p>
					<p className="mt-2 text-center text-xs uppercase tracking-[0.2em] text-[#6f6258]">Ein Fan-Spiel für den Verein Headbang Handwerk</p>
				</section>
			</div>
		</EditablePageShell>
	)
}