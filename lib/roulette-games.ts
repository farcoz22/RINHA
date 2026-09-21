import type { Participant } from "@/lib/types"
import type { WheelChoice } from "@/components/roulette"

/** Agrupa os campos Jogo 1 / Jogo 2 em opções e ignora tudo marcado como sensível. */
export function getPublicGameChoices(participant: Participant | null): WheelChoice[] {
  if (!participant) return []
  const games = new Map<string, string[]>()
  for (const field of participant.fields) {
    if (field.sensitive || !field.value?.trim()) continue
    const match = field.label.match(/(?:jogo|partida|game)\s*(\d+)/i)
    if (match) {
      const key = `Jogo ${match[1]}`
      const detail = field.label.replace(/(?:jogo|partida|game)\s*\d+\s*[-:–]?\s*/i, "").trim()
      games.set(key, [...(games.get(key) ?? []), detail ? `${detail}: ${field.value.trim()}` : field.value.trim()])
    } else {
      const key = `${field.label}: ${field.value.trim()}`
      games.set(key, [field.value.trim()])
    }
  }
  return [...games].map(([label], index) => ({ id: String(index), label }))
}

export function getGameDescription(participant: Participant | null, game: WheelChoice | null) {
  if (!participant || !game) return null
  const publicFields = participant.fields.filter((field) => !field.sensitive && field.value?.trim())
  const match = game.label.match(/^Jogo (\d+)$/)
  if (!match) return game.label
  const matches = publicFields.filter((field) => field.label.match(/(?:jogo|partida|game)\s*(\d+)/i)?.[1] === match[1])
  return matches.map((field) => {
    const label = field.label.replace(/(?:jogo|partida|game)\s*\d+\s*[-:–]?\s*/i, "").trim()
    return label ? `${label}: ${field.value.trim()}` : field.value.trim()
  }).join(" · ")
}
