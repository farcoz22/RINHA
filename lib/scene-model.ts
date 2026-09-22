import type { BattleGroup, Participant, RecentDonation } from "@/lib/types"

export type SceneMode = "neighborhood" | "arena" | "roulette"

export interface SceneActor {
  id: string
  name: string
  team: string
  eventId: string
  ticketAmount: number
  donationXP: number
  level: number
  hue: number
  skinTone: number
  hairstyle: number
  hairColor: number
  outfit: number
  pants: number
  accessory: number
}

/** Identidade visual estável para cada bilhete, inclusive nomes repetidos. */
export function ticketHash(value: string): number {
  let hash = 2166136261
  for (let i = 0; i < value.length; i++) hash = Math.imul(hash ^ value.charCodeAt(i), 16777619)
  return hash >>> 0
}

function variation(hash: number, salt: number, count: number) {
  let mixed = (hash ^ Math.imul(salt, 0x9e3779b1)) >>> 0
  mixed = Math.imul(mixed ^ (mixed >>> 16), 0x45d9f3b)
  return ((mixed ^ (mixed >>> 16)) >>> 0) % count
}

function identity(value: string) {
  return value.trim().normalize("NFKC").toLocaleLowerCase("pt-BR")
}

/** Só vincula doação pelo nome quando o nome identifica exatamente um bilhete. */
export function makeActors(participants: Participant[], donations: RecentDonation[]): SceneActor[] {
  const occurrences = new Map<string, number>()
  for (const ticket of participants) {
    const key = identity(ticket.username)
    occurrences.set(key, (occurrences.get(key) ?? 0) + 1)
  }
  const recentPaid = new Map<string, number>()
  const seen = new Set<string>()
  for (const donation of donations) {
    if (donation.status !== "PAID" || seen.has(donation.id)) continue
    seen.add(donation.id)
    const key = identity(donation.username)
    recentPaid.set(key, (recentPaid.get(key) ?? 0) + donation.amount)
  }
  return participants.map((ticket) => {
    const hash = ticketHash(ticket.id)
    const key = identity(ticket.username)
    // A lista da API tem somente doações recentes: não apresentar XP como total histórico.
    const donationXP = occurrences.get(key) === 1 ? Math.max(0, Math.floor((recentPaid.get(key) ?? 0) * 10)) : 0
    return {
      id: ticket.id,
      name: ticket.username,
      team: ticket.eventName,
      eventId: ticket.eventId,
      ticketAmount: ticket.amount,
      donationXP,
      level: 1 + Math.floor(donationXP / 500),
      hue: hash % 360,
      skinTone: variation(hash, 1, 8),
      hairstyle: variation(hash, 2, 8),
      hairColor: variation(hash, 3, 8),
      outfit: variation(hash, 4, 8),
      pants: variation(hash, 5, 6),
      accessory: variation(hash, 6, 5),
    }
  })
}

/** Retorna todas as equipes participantes, inclusive eventos avulsos. */
export function sceneTeams(groups: BattleGroup[], actors: SceneActor[]) {
  return groups.flatMap((group) => group.events.map((event) => ({
    id: event.id,
    name: event.name,
    group: group.name,
    actors: actors.filter((actor) => actor.eventId === event.id),
  }))).filter((team) => team.actors.length > 0)
}
