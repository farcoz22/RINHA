import type { LiveStats } from "@/lib/types"
import { formatBRL, formatTime } from "@/lib/format"

interface HeroProps {
  selectedTeam: string | null
  selectedName: string | null
  selectedGame: string | null
  stats: LiveStats
  updatedAt: string
}

export function Hero({ selectedTeam, selectedName, selectedGame, stats, updatedAt }: HeroProps) {
  return (
    <section className="rounded-3xl border border-border bg-card/60 p-6 backdrop-blur sm:p-10">
      <div className="mx-auto max-w-3xl text-center">
        <p className="flex items-center justify-center gap-2 text-xs font-semibold tracking-[0.35em] text-muted-foreground uppercase">
          <span className="rhyno-live-dot size-2 rounded-full bg-emerald-400" />
          Testa a sorte :D
        </p>
        <div className="mt-4 flex items-center justify-center gap-3 sm:gap-5">
          <img src="/dukoth/mark.svg" alt="Marca do painel Dukoth" className="size-16 shrink-0 rotate-[-8deg] rounded-2xl border-2 border-amber-400 shadow-lg shadow-amber-400/30 sm:size-24" />
          <h1 className="text-balance text-4xl font-extrabold tracking-tight sm:text-7xl">Batalhas do Dukoth</h1>
        </div>
        <p className="mt-3 text-muted-foreground">Sorteie a equipe, a pessoa e o jogo da vez.</p>

        <div className="mt-6 flex items-center justify-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/20 px-3 py-1 text-xs font-bold text-primary ring-1 ring-primary/40">
            <span className="rhyno-live-dot size-2 rounded-full bg-primary" />
            AO VIVO
          </span>
          <span className="text-xs text-muted-foreground">
            atualizado {formatTime(updatedAt)}
          </span>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-background/50 p-6">
          <p className="text-sm text-muted-foreground">Resultado do sorteio</p>
          <p className="mt-1 text-balance text-3xl font-extrabold sm:text-4xl">
            {selectedName ?? selectedTeam ?? "Aguardando a roleta"}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {[selectedTeam, selectedGame].filter(Boolean).join(" · ") || "Comece sorteando uma equipe."}
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Participantes" value={String(stats.participants)} />
        <StatCard label="Equipes" value={String(stats.events)} />
        <StatCard label="Total em entradas" value={formatBRL(stats.totalEntradas)} />
      </div>
    </section>
  )
}

function StatCard({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-border bg-background/40 px-4 py-4 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-bold sm:text-2xl">
        {value}
      </p>
    </div>
  )
}
