import type { BattleGroup, Participant } from "./types"

export const FEE_RATE = 0.15

export type PoolDraft = Record<string, { winnerId: string; casinoReturns: Record<string, string> }>

export function parseMoney(value: string) {
  const normalized = value.replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, "")
  const amount = Number(normalized)
  return Number.isFinite(amount) && amount > 0 ? amount : 0
}

/** O painel lateral e o fechamento usam os mesmos retornos e a mesma taxa. */
export function getPoolPreview(group: BattleGroup, participants: Participant[], draft: PoolDraft) {
  const state = draft[group.id]
  const entries = group.events.reduce((sum, event) => sum + event.minValue * event.occupiedEntries, 0)
  const gross = group.events.reduce((sum, event) => sum + parseMoney(state?.casinoReturns[event.id] ?? ""), 0)
  const fee = gross * FEE_RATE
  const net = gross - fee
  const standings = participants
    .filter((person) => group.events.some((event) => event.id === person.eventId))
    .sort((a, b) => b.amount - a.amount || a.username.localeCompare(b.username))
  const leader = standings[0] ?? null
  const winner = group.events.find((event) => event.id === state?.winnerId) ?? null
  const projectedTeam = winner ?? group.events.find((event) => event.id === leader?.eventId) ?? null
  const winningTickets = projectedTeam
    ? participants.filter((person) => person.eventId === projectedTeam.id).reduce((sum, person) => sum + Math.max(1, person.quantity), 0)
    : 0
  return {
    entries, gross, fee, net, standings, leader, winner, projectedTeam,
    winningTickets, perTicket: winningTickets && gross ? net / winningTickets : 0,
  }
}
