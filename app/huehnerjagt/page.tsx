import { redirect } from 'next/navigation'

export default async function HuehnerjagdPage({
	searchParams,
}: {
	searchParams?: Promise<{ view?: string }>
}) {
	const params = searchParams ? await searchParams : undefined
	redirect(`/game?game=huenerjagd${params?.view === 'user' ? '&view=user' : ''}`)
}