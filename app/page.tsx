import { LivePanel } from "@/components/live-panel"
import { getPublicLiveData } from "@/lib/live"
import type { LiveData } from "@/lib/types"

export const dynamic = "force-dynamic"

export default async function Page() {
  let initialData: LiveData
  try {
    initialData = await getPublicLiveData()
  } catch (err) {
    initialData = {
      updatedAt: new Date().toISOString(),
      stats: {
        participants: 0,
        events: 0,
        groups: 0,
        totalEntradas: 0,
        totalGanhos: 0,
        paidDonations: 0,
      },
      participants: [],
      battleGroups: [],
      recentDonations: [],
      error: err instanceof Error ? err.message : "Erro ao carregar dados",
    }
  }

  return (
    <main className="min-h-dvh">
      <LivePanel initialData={initialData} />
    </main>
  )
}
