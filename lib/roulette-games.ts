import type { Participant } from "@/lib/types"
import type { WheelChoice } from "@/components/roulette"

const GAME_FIELD_PATTERN = /(?:jogo|partida|game)\s*(?:(?:n(?:ú|u)?mero|n[º°o.]?|#)\s*)?(\d+)/i

function getGameNumber(label: string) {
  return label.match(GAME_FIELD_PATTERN)?.[1] ?? null
}

function getGameDetail(label: string) {
  return label.replace(GAME_FIELD_PATTERN, "").replace(/^\s*[-:–]?\s*/, "").trim()
}

function isIdentityField(label: string) {
  return /(?:nome|nick|nickname|usu[aá]rio).*twitch|twitch.*(?:nome|nick|nickname|usu[aá]rio)/i.test(label)
}

function getPublicGames(participant: Participant | null) {
  if (!participant) return []
  const games = new Map<string, { id: string; label: string; lines: string[] }>()

  participant.fields.forEach((field, index) => {
    if (field.sensitive !== false || !field.value?.trim() || isIdentityField(field.label)) return
    const value = field.value.trim()
    const gameNumber = getGameNumber(field.label)

    if (gameNumber) {
      const id = `number:${gameNumber}`
      const detail = getGameDetail(field.label)
      const current = games.get(id) ?? { id, label: `Jogo ${gameNumber}`, lines: [] }
      current.lines.push(detail ? `${detail}: ${value}` : value)
      games.set(id, current)
      return
    }

    // O nome do campo é livre na Rhyno. Qualquer outro campo público entra
    // como opção própria; somente a marcação sensível o remove do sorteio.
    const id = `field:${index}`
    games.set(id, { id, label: value, lines: [`${field.label}: ${value}`] })
  })

  return [...games.values()]
}

/** Agrupa campos numerados quando possível e nunca descarta um campo público por causa do nome. */
export function getPublicGameChoices(participant: Participant | null): WheelChoice[] {
  return getPublicGames(participant).map(({ id, label }) => ({ id, label }))
}

export function getGameDescription(participant: Participant | null, game: WheelChoice | null) {
  if (!participant || !game) return null
  const selected = getPublicGames(participant).find((item) => item.id === game.id)
  if (!selected) return null
  const description = selected.lines.join(" · ")
  return description === game.label ? null : description
}
