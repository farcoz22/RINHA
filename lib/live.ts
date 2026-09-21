import "server-only"
import { getQueueEventDetail, listDonations, listQueueEvents } from "@/lib/rhyno"
import type { BattleGroup, LiveData, Participant, RecentDonation } from "@/lib/types"

/**
 * Cache em memória compartilhado entre o SSR e a rota /api/live.
 * A API pública da Rhyno tem rate limit, então evitamos refazer o mesmo
 * conjunto de chamadas a cada request/cliente.
 */
const CACHE_TTL = 12_000
let cache: { data: LiveData; expiresAt: number } | null = null
let inflight: Promise<LiveData> | null = null

/**
 * Monta o snapshot ao vivo consumido pelo painel:
 * - participantes da roleta e ranking vêm das FILAS (queue-tickets);
 * - os totais em ganhos vêm das DOAÇÕES pagas.
 */
export async function getLiveData(): Promise<LiveData> {
  const now = Date.now()
  if (cache && cache.expiresAt > now) return cache.data
  if (inflight) return inflight

  inflight = buildLiveData()
    .then((data) => {
      cache = { data, expiresAt: Date.now() + CACHE_TTL }
      return data
    })
    .finally(() => {
      inflight = null
    })

  return inflight
}

async function buildLiveData(): Promise<LiveData> {
  const events = await listQueueEvents()

  // Só busca entradas de eventos que têm vagas ocupadas (economiza chamadas
  // e respeita o rate limit da API pública).
  const eventsWithEntries = events.filter((e) => e.occupiedEntries > 0)
  const details = await Promise.all(
    eventsWithEntries.map((e) =>
      getQueueEventDetail(e.id).catch(() => ({ ...e, entries: [] as never[] })),
    ),
  )

  const participants: Participant[] = []
  let totalEntradas = 0

  for (const detail of details) {
    for (const entry of detail.entries) {
      totalEntradas += entry.amount
      participants.push({
        id: entry.id,
        username: entry.username,
        message: entry.message,
        amount: entry.amount,
        quantity: entry.quantity,
        eventId: detail.id,
        eventName: detail.name,
        groupName: detail.groupName,
        createdAt: entry.createdAt,
        fields: entry.fieldValues.map((f) => ({
          label: f.label,
          value: f.value,
          sensitive: f.sensitive,
        })),
      })
    }
  }

  // Agrupa os eventos por confronto (grupo).
  const groupMap = new Map<string, BattleGroup>()
  for (const e of events) {
    const gid = e.groupId ?? "__solo__"
    const gname = e.groupName ?? "Filas avulsas"
    if (!groupMap.has(gid)) groupMap.set(gid, { id: gid, name: gname, events: [] })
    groupMap.get(gid)!.events.push({
      id: e.id,
      name: e.name,
      occupiedEntries: e.occupiedEntries,
      maxEntries: e.maxEntries,
      availableEntries: e.availableEntries,
      minValue: e.minValue,
    })
  }

  // Doações pagas para o total em ganhos + feed recente.
  let totalGanhos = 0
  let paidDonations = 0
  const recentDonations: RecentDonation[] = []
  try {
    const paidPage = await listDonations({ status: "PAID", limit: 100 })
    paidDonations = paidPage.meta.total
    for (const d of paidPage.data) totalGanhos += d.amount

    const recentPage = await listDonations({ limit: 12 })
    for (const d of recentPage.data) {
      recentDonations.push({
        id: d.id,
        username: d.username,
        amount: d.amount,
        message: d.message ?? null,
        status: d.status,
        createdAt: d.createdAt,
      })
    }
  } catch {
    // doações são complementares — não quebra o painel se falharem
  }

  const groups = [...groupMap.values()].sort((a, b) => a.name.localeCompare(b.name))

  return {
    updatedAt: new Date().toISOString(),
    stats: {
      participants: participants.length,
      events: events.length,
      groups: groupMap.size,
      totalEntradas,
      totalGanhos,
      paidDonations,
    },
    participants,
    battleGroups: groups,
    recentDonations,
  }
}
