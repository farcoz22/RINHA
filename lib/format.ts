export function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value ?? 0)
}

export function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return "--:--"
  }
}

const PALETTE = [
  "#5b8cff",
  "#22d3ee",
  "#34d399",
  "#f59e0b",
  "#f472b6",
  "#a78bfa",
  "#38bdf8",
  "#fb7185",
  "#4ade80",
  "#facc15",
  "#c084fc",
  "#2dd4bf",
]

export function colorForIndex(i: number): string {
  return PALETTE[i % PALETTE.length]
}
