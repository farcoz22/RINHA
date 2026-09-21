import type { LiveStats } from "@/lib/types"
import { formatBRL, formatTime } from "@/lib/format"

interface HeroProps {
  selectedName: string | null
  stats: LiveStats
  remaining: number
  finished: number
  updatedAt: string
}

export function Hero({ selectedName, stats, remaining, finished, updatedAt }: HeroProps) {
  return (
    <section className="rounded-3xl border border-border bg-card/60 p-6 backdrop-blur sm:p-10">
      <div className="mx-auto max-w-3xl text-center">
        <p className="flex items-center justify-center gap-2 text-xs font-semibold tracking-[0.35em] text-muted-foreground uppercase">
          <span className="rhyno-live-dot size-2 rounded-full bg-emerald-400" />
          Testa a sorte :D
        </p>
        <h1 className="mt-4 text-balance text-5xl font-extrabold tracking-tight sm:text-7xl">
          Batalhas do Nuuhzão
        </h1>
        <p className="mt-3 text-muted-foreground">A roleta decide quem vai agora.</p>

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
          <p className="text-sm text-muted-foreground">Na vez agora</p>
          <p className="mt-1 text-balance text-3xl font-extrabold sm:text-4xl">
            {selectedName ?? "Ninguém selecionado"}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Quando a roleta girar, o nome vai aparecer aqui em destaque.
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Na roleta" value={String(remaining)} />
        <StatCard label="Finalizados" value={String(finished)} />
        <StatCard label="Total em entradas" value={formatBRL(stats.totalEntradas)} />
        <StatCard label="Total em ganhos" value={formatBRL(stats.totalGanhos)} highlight />
      </div>
    </section>
  )
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="rounded-2xl border border-border bg-background/40 px-4 py-4 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={
          "mt-1 text-xl font-bold sm:text-2xl " + (highlight ? "text-accent" : "text-foreground")
        }
      >
        {value}
      </p>
    </div>
  )
}
