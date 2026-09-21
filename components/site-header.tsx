import { Radio } from "lucide-react"

export function SiteHeader() {
  return (
    <header className="rounded-3xl border border-border bg-card/70 px-4 py-3 backdrop-blur sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/30">
            <Radio className="size-5" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold tracking-tight sm:text-base">Batalhas do Nuuhzão</p>
            <p className="text-xs text-muted-foreground">Painel ao vivo da live</p>
          </div>
        </div>

        <nav className="flex items-center gap-2">
          <span className="hidden items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-400 ring-1 ring-emerald-500/30 sm:inline-flex">
            <span className="rhyno-live-dot size-2 rounded-full bg-emerald-400" />
            Xaand
          </span>
          <a
            href="#ao-vivo"
            className="rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground ring-1 ring-border transition hover:text-foreground"
          >
            Ao vivo
          </a>
          <a
            href="#fila"
            className="rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground ring-1 ring-border transition hover:text-foreground"
          >
            Fila
          </a>
          <span className="rounded-full bg-gradient-to-r from-primary to-sky-500 px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/30">
            Área do Nuuh
          </span>
        </nav>
      </div>
    </header>
  )
}
