import { ExternalLink } from "lucide-react"

export function SiteHeader() {
  return (
    <header className="rounded-3xl border border-border bg-card/70 px-4 py-3 backdrop-blur sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="dukoth-emblem-mini"><img src="/dukoth/twitch-banner.webp" alt="Personagem do banner oficial do Dukoth" /></span>
          <div className="leading-tight">
            <p className="text-sm font-bold tracking-tight sm:text-base">High Onion Corporation</p>
            <p className="text-xs text-muted-foreground">Guild do Dukoth · painel ao vivo</p>
          </div>
        </div>

        <nav className="flex items-center gap-2">
          <a href="https://www.twitch.tv/dukoth" target="_blank" rel="noreferrer" className="hidden items-center gap-2 rounded-full bg-[#9147ff]/15 px-3 py-1.5 text-xs font-bold text-[#bf94ff] ring-1 ring-[#9147ff]/30 transition hover:bg-[#9147ff]/25 sm:inline-flex">
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
            Área do Dukoth
          </span>
        </nav>
      </div>
    </header>
  )
}
