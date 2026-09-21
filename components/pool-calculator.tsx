"use client"

import { useEffect, useMemo, useState } from "react"
import { Calculator, CheckCircle2, Percent, Trophy } from "lucide-react"
import type { BattleGroup } from "@/lib/types"
import { formatBRL } from "@/lib/format"

const FEE_RATE = 0.15

type PoolState = Record<
  string,
  { winnerId: string; casinoReturns: Record<string, string> }
>

function parseMoney(value: string) {
  const normalized = value.replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, "")
  const amount = Number(normalized)
  return Number.isFinite(amount) && amount > 0 ? amount : 0
}

export function PoolCalculator({ groups }: { groups: BattleGroup[] }) {
  const [state, setState] = useState<PoolState>({})

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("rhyno-pool-calculator")
      if (saved) setState(JSON.parse(saved) as PoolState)
    } catch {
      // O cálculo continua funcionando mesmo se o navegador bloquear o armazenamento.
    }
  }, [])

  useEffect(() => {
    try {
      window.localStorage.setItem("rhyno-pool-calculator", JSON.stringify(state))
    } catch {
      // Nada a fazer: os dados só não serão mantidos após atualizar a página.
    }
  }, [state])

  const activeGroups = useMemo(
    () => groups.filter((group) => group.events.length > 0),
    [groups],
  )

  function updateReturn(groupId: string, eventId: string, value: string) {
    setState((current) => ({
      ...current,
      [groupId]: {
        winnerId: current[groupId]?.winnerId ?? "",
        casinoReturns: {
          ...(current[groupId]?.casinoReturns ?? {}),
          [eventId]: value,
        },
      },
    }))
  }

  function selectWinner(groupId: string, eventId: string) {
    setState((current) => ({
      ...current,
      [groupId]: {
        winnerId: eventId,
        casinoReturns: current[groupId]?.casinoReturns ?? {},
      },
    }))
  }

  return (
    <section className="rounded-3xl border border-border bg-card/60 p-6 backdrop-blur lg:col-span-2">
      <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.3em] text-accent uppercase">
        <Calculator className="size-3.5" /> Fechamento das apostas
      </p>
      <h2 className="mt-1 text-2xl font-bold">Pote e premiação</h2>
      <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
        Informe em reais quanto cada aposta retornou do cassino e marque a equipe vencedora.
        O sistema soma o pote, retira 15% e divide o prêmio entre os bilhetes da vencedora.
      </p>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        {activeGroups.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum confronto disponível para calcular.</p>
        )}

        {activeGroups.map((group) => {
          const groupState = state[group.id]
          const entryTotal = group.events.reduce(
            (sum, event) => sum + event.minValue * event.occupiedEntries,
            0,
          )
          const grossPool = group.events.reduce(
            (sum, event) => sum + parseMoney(groupState?.casinoReturns[event.id] ?? ""),
            0,
          )
          const fee = grossPool * FEE_RATE
          const netPool = grossPool - fee
          const winner = group.events.find((event) => event.id === groupState?.winnerId)
          const winnersCount = winner?.occupiedEntries ?? 0
          const prizePerTicket = winnersCount > 0 ? netPool / winnersCount : 0

          return (
            <article key={group.id} className="rounded-2xl border border-border bg-background/40 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-bold">{group.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Entrada arrecadada: <strong className="text-foreground">{formatBRL(entryTotal)}</strong>
                  </p>
                </div>
                <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-bold text-primary ring-1 ring-primary/30">
                  {group.events.length} equipes
                </span>
              </div>

              <div className="mt-4 flex flex-col gap-2">
                {group.events.map((event) => {
                  const selected = groupState?.winnerId === event.id
                  return (
                    <div
                      key={event.id}
                      className={
                        "grid gap-3 rounded-xl border p-3 sm:grid-cols-[1fr_160px_auto] sm:items-center " +
                        (selected ? "border-emerald-500/50 bg-emerald-500/10" : "border-border bg-card/50")
                      }
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{event.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {event.occupiedEntries} bilhete(s) · {formatBRL(event.minValue)} cada
                        </p>
                      </div>

                      <label className="relative block">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                          R$
                        </span>
                        <input
                          inputMode="decimal"
                          value={groupState?.casinoReturns[event.id] ?? ""}
                          onChange={(e) => updateReturn(group.id, event.id, e.target.value)}
                          placeholder="0,00"
                          aria-label={`Retorno do cassino para ${event.name}`}
                          className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-right text-sm font-bold outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => selectWinner(group.id, event.id)}
                        className={
                          "inline-flex h-10 items-center justify-center gap-2 rounded-lg px-3 text-xs font-bold transition " +
                          (selected
                            ? "bg-emerald-500 text-white"
                            : "bg-secondary text-secondary-foreground hover:bg-secondary/80")
                        }
                      >
                        {selected ? <CheckCircle2 className="size-4" /> : <Trophy className="size-4" />}
                        {selected ? "Vencedora" : "Marcar"}
                      </button>
                    </div>
                  )
                })}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Result label="Pote bruto" value={formatBRL(grossPool)} />
                <Result label="Taxa (15%)" value={`− ${formatBRL(fee)}`} icon={<Percent className="size-3" />} />
                <Result label="Pote líquido" value={formatBRL(netPool)} highlight />
                <Result
                  label={winnersCount > 0 ? `Por vencedor (${winnersCount})` : "Por vencedor"}
                  value={winnersCount > 0 ? formatBRL(prizePerTicket) : "Marque a equipe"}
                  highlight
                />
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function Result({
  label,
  value,
  highlight,
  icon,
}: {
  label: string
  value: string
  highlight?: boolean
  icon?: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border bg-card/60 p-3">
      <p className="flex items-center gap-1 text-[11px] text-muted-foreground">{icon}{label}</p>
      <p className={"mt-1 text-sm font-extrabold " + (highlight ? "text-emerald-400" : "text-foreground")}>
        {value}
      </p>
    </div>
  )
}
