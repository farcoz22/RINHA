import type { Participant } from "@/lib/types"
import type { WheelChoice } from "@/components/roulette"

const GAME_FIELD_PATTERN = /(?:jogo|partida|game)\s*(?:(?:n(?:ú|u)?mero|n[º°o.]?|#)\s*)?(\d+)/i

function getGameNumber(label: string) {
  return label.match(GAME_FIELD_PATTERN)?.[1] ?? null
}

function getGameDetail(label: string) {
  return label.replace(GAME_FIELD_PATTERN, "").replace(/^\s*[-:–]?\s*/, "").trim()
}

/** Agrupa os campos Jogo 1 / Jogo 2 em opções e ignora tudo marcado como sensível. */
export function getPublicGameChoices(participant: Participant | null): WheelChoice[] {
  if (!participant) return []
  const games = new Map<string, string[]>()
  for (const field of participant.fields) {
    if (field.sensitive !== false || !field.value?.trim()) continue
    const gameNumber = getGameNumber(field.label)
    // Nome de usuário, CPF e outros campos públicos não são opções de jogo.
    if (!gameNumber) continue
    const key = `Jogo ${gameNumber}`
    const detail = getGameDetail(field.label)
    games.set(key, [...(games.get(key) ?? []), detail ? `${detail}: ${field.value.trim()}` : field.value.trim()])
  }
  return [...games].map(([label], index) => ({ id: String(index), label }))
}

export function getGameDescription(participant: Participant | null, game: WheelChoice | null) {
  if (!participant || !game) return null
  const publicFields = participant.fields.filter((field) => field.sensitive === false && field.value?.trim())
  const match = game.label.match(/^Jogo (\d+)$/)
  if (!match) return null
  const matches = publicFields.filter((field) => getGameNumber(field.label) === match[1])
  return matches.map((field) => {
    const label = getGameDetail(field.label)
    return label ? `${label}: ${field.value.trim()}` : field.value.trim()
  }).join(" · ")
}
