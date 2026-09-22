import { ExternalLink } from "lucide-react"

export function SiteHeader() {
  return (
    <header className="rounded-3xl border border-border bg-card/70 px-4 py-3 backdrop-blur sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img src="/nuuh/susto-obvio.jpg" alt="NuuhFPS em um momento engraçado da live" width={52} height={52} className="size-13 rounded-2xl object-cover object-[88%_23%] ring-2 ring-rose-400/70" />
          <div className="leading-tight">
            <p className="text-sm font-bold tracking-tight sm:text-base">Batalhas do Nuuhzão</p>
            <p className="text-xs text-muted-foreground">Painel ao vivo da live</p>
          </div>
        </div>

        <nav className="flex items-center gap-2">
          <a href="https://www.twitch.tv/nuuhfps" target="_blank" rel="noreferrer" className="hidden items-center gap-2 rounded-full bg-[#9147ff]/15 px-3 py-1.5 text-xs font-bold text-[#bf94ff] ring-1 ring-[#9147ff]/30 transition hover:bg-[#9147ff]/25 sm:inline-flex">
            Twitch <ExternalLink className="size-3" />
          </a>
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
