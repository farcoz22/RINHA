import type { BattleGroup, Participant } from "./types"

export const FEE_RATE = 0.15

export type PoolGroupDraft = {
  winnerId: string
  casinoReturns: Record<string, string>
  /** Só equipes confirmadas deixam a roleta. Opcional para manter rascunhos antigos compatíveis. */
  confirmedReturns?: Record<string, boolean>
}

export type PoolDraft = Record<string, PoolGroupDraft>

export function parseMoney(value: string) {
  const normalized = value.replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, "")
  const amount = Number(normalized)
  return Number.isFinite(amount) && amount > 0 ? amount : 0
}

export function isReturnConfirmed(draft: PoolDraft, groupId: string, eventId: string) {
  const state = draft[groupId]
  if (!state) return false
  if (state.confirmedReturns) return state.confirmedReturns[eventId] === true
  // Antes desta atualização, qualquer valor preenchido já era considerado pronto.
  return parseMoney(state.casinoReturns[eventId] ?? "") > 0
}

export function getConfirmationMap(group: BattleGroup, draft: PoolDraft) {
  return Object.fromEntries(
    group.events.map((event) => [event.id, isReturnConfirmed(draft, group.id, event.id)]),
  )
}

/** O painel lateral e o fechamento usam os mesmos retornos e a mesma taxa. */
export function getPoolPreview(group: BattleGroup, participants: Participant[], draft: PoolDraft) {
  const state = draft[group.id]
  const entries = group.events.reduce((sum, event) => sum + event.minValue * event.occupiedEntries, 0)
  const results = group.events.map((event) => ({
    event,
    amount: parseMoney(state?.casinoReturns[event.id] ?? ""),
    confirmed: isReturnConfirmed(draft, group.id, event.id),
  }))
  const confirmedResults = results
    .filter((result) => result.confirmed && result.amount > 0)
    .sort((a, b) => b.amount - a.amount || a.event.name.localeCompare(b.event.name))
  const gross = confirmedResults.reduce((sum, result) => sum + result.amount, 0)
  const fee = gross * FEE_RATE
  const net = gross - fee
  const resultLeader = confirmedResults[0] ?? null
  const isTie = Boolean(resultLeader && confirmedResults[1]?.amount === resultLeader.amount)
  const completedCount = confirmedResults.length
  const pendingCount = Math.max(0, group.events.length - completedCount)
  const winner = group.events.find((event) => event.id === state?.winnerId) ?? null
  const projectedTeam = winner ?? resultLeader?.event ?? null
  const winningTickets = projectedTeam
    ? participants.filter((person) => person.eventId === projectedTeam.id).reduce((sum, person) => sum + Math.max(1, person.quantity), 0)
    : 0
  return {
    entries, gross, fee, net, results, confirmedResults, resultLeader, isTie,
    completedCount, pendingCount, allCompleted: group.events.length > 0 && pendingCount === 0,
    winner, projectedTeam,
    winningTickets, perTicket: winningTickets && gross ? net / winningTickets : 0,
  }
}
