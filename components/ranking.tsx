import type { BattleGroup, Participant, RecentDonation } from "@/lib/types"
import { formatBRL, formatTime } from "@/lib/format"
import { Swords, Users } from "lucide-react"
import { PoolCalculator } from "@/components/pool-calculator"

interface RankingProps {
  participants: Participant[]
  battleGroups: BattleGroup[]
  donations: RecentDonation[]
}

const STATUS_LABEL: Record<RecentDonation["status"], string> = {
  PAID: "Pago",
  CREATED: "Criado",
  CANCELED: "Cancelado",
  EXPIRED: "Expirado",
}

const STATUS_STYLE: Record<RecentDonation["status"], string> = {
  PAID: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30",
  CREATED: "bg-primary/15 text-primary ring-primary/30",
  CANCELED: "bg-muted text-muted-foreground ring-border",
  EXPIRED: "bg-amber-500/15 text-amber-400 ring-amber-500/30",
}

export function Ranking({ participants, battleGroups, donations }: RankingProps) {
  const top = [...participants].sort((a, b) => b.amount - a.amount).slice(0, 10)

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <PoolCalculator groups={battleGroups} />
      {/* Confrontos / filas */}
      <div className="rounded-3xl border border-border bg-card/60 p-6 backdrop-blur">
        <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.3em] text-accent uppercase">
          <Swords className="size-3.5" /> Confrontos
        </p>
        <h2 className="mt-1 text-2xl font-bold">Filas abertas</h2>

        <div className="mt-4 flex flex-col gap-4">
          {battleGroups.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma fila ativa no momento.</p>
          )}
          {battleGroups.map((g) => (
            <div key={g.id} className="rounded-2xl border border-border bg-background/40 p-4">
              <p className="mb-3 text-sm font-bold">{g.name}</p>
              <ul className="flex flex-col gap-2">
                {g.events.map((e) => {
                  const total = e.maxEntries
                  const occupied = e.occupiedEntries
                  const pct = total ? Math.min(100, (occupied / total) * 100) : 0
                  return (
                    <li key={e.id} className="rounded-xl bg-card/60 px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium">{e.name}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {occupied}
                          {total ? `/${total}` : ""} vagas
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-primary to-sky-400"
                            style={{ width: `${total ? pct : occupied > 0 ? 100 : 6}%` }}
                          />
                        </div>
                        <span className="shrink-0 text-xs font-bold text-accent">
                          mín {formatBRL(e.minValue)}
                        </span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* Ranking de apoiadores */}
        <div className="rounded-3xl border border-border bg-card/60 p-6 backdrop-blur">
          <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.3em] text-accent uppercase">
            <Users className="size-3.5" /> Ranking
          </p>
          <h2 className="mt-1 text-2xl font-bold">Quem mais colocou na fila</h2>

          <ol className="mt-4 flex flex-col gap-2">
            {top.length === 0 && (
              <p className="text-sm text-muted-foreground">Ainda não há entradas nas filas.</p>
            )}
            {top.map((p, i) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-3 rounded-xl bg-background/40 px-3 py-2"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={
                      "flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-bold " +
                      (i === 0
                        ? "bg-amber-400/20 text-amber-400"
                        : i === 1
                          ? "bg-slate-300/20 text-slate-300"
                          : i === 2
                            ? "bg-orange-400/20 text-orange-400"
                            : "bg-primary/15 text-primary")
                    }
                  >
                    {i + 1}
                  </span>
                  <p className="truncate text-sm font-semibold">{p.username}</p>
                </div>
                <span className="shrink-0 text-xs font-bold text-accent">
                  {formatBRL(p.amount)}
                </span>
              </li>
            ))}
          </ol>
        </div>

        {/* Doações recentes */}
        <div className="rounded-3xl border border-border bg-card/60 p-6 backdrop-blur">
          <p className="text-xs font-semibold tracking-[0.3em] text-accent uppercase">Doações</p>
          <h2 className="mt-1 text-2xl font-bold">Últimas doações</h2>

          <ul className="mt-4 flex flex-col gap-2">
            {donations.length === 0 && (
              <p className="text-sm text-muted-foreground">Sem doações recentes.</p>
            )}
            {donations.map((d) => (
              <li key={d.id} className="rounded-xl bg-background/40 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold">{d.username}</span>
                  <span className="shrink-0 text-sm font-bold text-accent">
                    {formatBRL(d.amount)}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between gap-2">
                  {d.message ? (
                    <span className="truncate text-xs text-muted-foreground">{d.message}</span>
                  ) : (
                    <span className="text-xs text-muted-foreground/60">sem mensagem</span>
                  )}
                  <span className="flex shrink-0 items-center gap-2">
                    <span
                      className={
                        "rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 " +
                        STATUS_STYLE[d.status]
                      }
                    >
                      {STATUS_LABEL[d.status]}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatTime(d.createdAt)}
                    </span>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
