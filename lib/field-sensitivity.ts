import type { QueueEntryFieldValue, QueueField } from "./rhyno"

function sensitivityFlag(value: unknown): boolean | null {
  if (value === true || value === 1) return true
  if (value === false || value === 0) return false
  if (typeof value === "string") {
    const flag = value.trim().toLowerCase()
    if (flag === "true" || flag === "1") return true
    if (flag === "false" || flag === "0") return false
  }
  return null
}

export function fieldIsSensitive(value: QueueEntryFieldValue, definitions: QueueField[]): boolean {
  const definition = definitions.find((field) => field.label === value.label)
  const flags = [
    sensitivityFlag(value.sensitive),
    sensitivityFlag(value.isSensitive),
    sensitivityFlag(definition?.sensitive),
    sensitivityFlag(definition?.isSensitive),
  ]
  const personalDataLabel = /(?:cpf|rg|documento|e-?mail|telefone|celular|whats(?:app)?|endere[cç]o|chave\s*pix|pix|senha|password)/i

  if (personalDataLabel.test(value.label)) return true
  if (flags.includes(true)) return true
  return false
}
