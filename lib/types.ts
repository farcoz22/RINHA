/* Tipos compartilhados entre a API interna (/api/live) e o front-end. */

export interface Participant {
  id: string
  username: string
  message: string | null
  amount: number
  quantity: number
  eventId: string
  eventName: string
  groupName: string | null
  createdAt: string
  fields: { label: string; value: string; sensitive: boolean }[]
}

export interface BattleGroup {
  id: string
  name: string
  events: {
    id: string
    name: string
    occupiedEntries: number
    maxEntries: number | null
    availableEntries: number | null
    minValue: number
  }[]
}

export interface RecentDonation {
  id: string
  username: string
  amount: number
  message: string | null
  status: "CREATED" | "PAID" | "CANCELED" | "EXPIRED"
  createdAt: string
}

export interface LiveStats {
  participants: number
  events: number
  groups: number
  totalEntradas: number
  totalGanhos: number
  paidDonations: number
}

export interface LiveData {
  updatedAt: string
  stats: LiveStats
  participants: Participant[]
  battleGroups: BattleGroup[]
  recentDonations: RecentDonation[]
  error?: string
}
