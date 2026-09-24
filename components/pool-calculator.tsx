"use client"

import { useEffect, useMemo, useState } from "react"
import { Calculator, CheckCircle2, Save, Trophy, Wallet } from "lucide-react"
import type { BattleGroup, Participant } from "@/lib/types"
import { formatBRL } from "@/lib/format"
import { PasswordDialog } from "@/components/password-dialog"
import { FEE_RATE, parseMoney, type PoolDraft } from "@/lib/pool-preview"

export function PoolCalculator({
  groups,
  participants,
  onSaved,
}: {
  groups: BattleGroup[]
  participants: Participant[]
  onSaved?: () => void
}) {
  const [state, setState] = useState<PoolDraft>({})
  const [restored, setRestored] = useState(false)
  const [savingGroup, setSavingGroup] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [adminError, setAdminError] = useState<string | null>(null)
  const [pendingSave, setPendingSave] = useState<{
    groupId: string
    winnerId: string
    grossPool: number
  } | null>(null)

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("rhyno-pool-calculator")
      if (saved) setState(JSON.parse(saved) as PoolDraft)
    } catch {
      // O cálculo continua funcionando mesmo se o navegador bloquear o armazenamento.
    }
    setRestored(true)
  }, [])

  useEffect(() => {
    if (!restored) return
    try {
      window.localStorage.setItem("rhyno-pool-calculator", JSON.stringify(state))
    } catch {
      // Nada a fazer: os dados só não serão mantidos após atualizar a página.
    }
    window.dispatchEvent(new CustomEvent("rhyno-pool-draft-change", { detail: state }))
  }, [state, restored])

  useEffect(() => {
    const onDraftChange = (event: Event) => {
      const next = (event as CustomEvent<PoolDraft>).detail
      setState((current) => JSON.stringify(current) === JSON.stringify(next) ? current : next)
    }
    window.addEventListener("rhyno-pool-draft-change", onDraftChange)
    return () => window.removeEventListener("rhyno-pool-draft-change", onDraftChange)
  }, [])

  const activeGroups = useMemo(
    () => groups.filter((group) => group.events.length > 0),
    [groups],
  )
  const entriesTotal = activeGroups.reduce((total, group) => total + group.events.reduce(
    (sum, event) => sum + event.minValue * event.occupiedEntries, 0,
  ), 0)
  const returnsTotal = activeGroups.reduce((total, group) => total + group.events.reduce(
    (sum, event) => sum + parseMoney(state[group.id]?.casinoReturns[event.id] ?? ""), 0,
  ), 0)

  function updateReturn(groupId: string, eventId: string, value: string) {
    setState((current) => ({
      ...current,
      [groupId]: {
        winnerId: current[groupId]?.winnerId ?? "",
        casinoReturns: {
          ...(current[groupId]?.casinoReturns ?? {}),
          [eventId]: value,
        },
        confirmedReturns: {
          ...(current[groupId]?.confirmedReturns ?? {}),
          [eventId]: false,
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
        confirmedReturns: current[groupId]?.confirmedReturns,
      },
    }))
  }

  async function saveBattle(password: string) {
    if (!pendingSave) return
    const { groupId, winnerId, grossPool } = pendingSave
    setSavingGroup(groupId)
    setMessage(null)
    setAdminError(null)
    try {
      const response = await fetch("/api/history", {
        method: "POST",
        headers: { "content-type": "application/json", "x-export-password": password },
        body: JSON.stringify({ groupId, winnerEventId: winnerId, grossPool }),
      })
      const result = (await response.json()) as { ok?: boolean; error?: string }
      if (!response.ok) throw new Error(result.error ?? "Não foi possível salvar")
      setMessage("Rinha salva no histórico com os pagamentos pendentes.")
      setState((current) => {
        const next = { ...current }
        delete next[groupId]
        return next
      })
      onSaved?.()
      setPendingSave(null)
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : "Erro ao salvar rinha")
    } finally {
      setSavingGroup(null)
    }
  }

  return (
    <section className="rounded-3xl border border-border bg-card/60 p-4 backdrop-blur sm:p-5 lg:col-span-2">
      <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.3em] text-accent uppercase">
        <Calculator className="size-3.5" /> Fechamento das apostas
      </p>
      <h2 className="mt-1 text-2xl font-bold">Pote e premiação</h2>
      <p className="mt-2 max-w-3xl text-xs text-muted-foreground sm:text-sm">
        Informe em reais quanto cada aposta retornou do cassino e marque a equipe vencedora.
        O sistema soma o pote, retira 15% e divide o prêmio entre os bilhetes da vencedora.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4" aria-label="Resumo de todos os potes">
        <Result label="Entradas nas filas" value={formatBRL(entriesTotal)} />
        <Result label="Pote bruto informado" value={formatBRL(returnsTotal)} />
        <Result label="Taxa total · 15%" value={`− ${formatBRL(returnsTotal * FEE_RATE)}`} />
        <Result label="Prêmios líquidos" value={formatBRL(returnsTotal * (1 - FEE_RATE))} highlight icon={<Wallet className="size-3" />} />
      </div>
      {message && (
        <p className="mt-3 rounded-xl border border-border bg-background/50 px-4 py-3 text-sm">
          {message}
        </p>
      )}

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
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
          const winnersCount = winner
            ? participants
                .filter((participant) => participant.eventId === winner.id)
                .reduce((sum, participant) => sum + Math.max(1, participant.quantity), 0)
            : 0
          const prizePerTicket = winnersCount > 0 ? netPool / winnersCount : 0
          const isSolo = group.id === "__solo__"

          return (
            <article key={group.id} className="min-w-0 rounded-2xl border border-border bg-background/40 p-3 sm:p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-bold">{group.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Entrada arrecadada: <strong className="text-foreground">{formatBRL(entryTotal)}</strong>
                  </p>
                </div>
                <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-bold text-primary ring-1 ring-primary/30">
                  {group.events.length} {isSolo ? "filas" : "equipes"}
                </span>
              </div>

              <div className="mt-4 flex flex-col gap-2">
                {group.events.map((event) => {
                  const selected = groupState?.winnerId === event.id
                  const ticketHolders = participants.filter((person) => person.eventId === event.id)
                  return (
                    <div
                      key={event.id}
                      className={
                        "grid gap-2 rounded-xl border p-3 sm:grid-cols-[minmax(0,1fr)_minmax(100px,140px)_auto] sm:items-center " +
                        (selected ? "border-emerald-500/50 bg-emerald-500/10" : "border-border bg-card/50")
                      }
                    >
                      <div className="min-w-0">
                        <p className="break-words text-sm font-semibold">{event.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {event.occupiedEntries} bilhete(s) · {formatBRL(event.minValue)} cada
                        </p>
                        {isSolo && <div className="mt-2 flex flex-wrap gap-1" aria-label={`Pessoas com bilhetes em ${event.name}`}>
                          {ticketHolders.map((person) => <span key={person.id} className="max-w-full break-all rounded-md border border-border bg-background/70 px-2 py-0.5 text-[11px] font-medium text-foreground">
                            {person.username}{person.quantity > 1 ? ` ×${person.quantity}` : ""}
                          </span>)}
                          {ticketHolders.length === 0 && <span className="text-[11px] text-muted-foreground">Nomes ainda não disponíveis</span>}
                        </div>}
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
                <Result label="Taxa (15%)" value={`− ${formatBRL(fee)}`} />
                <Result label="Pote líquido" value={formatBRL(netPool)} highlight />
                <Result
                  label={winnersCount > 0 ? `Por vencedor (${winnersCount})` : "Por vencedor"}
                  value={winnersCount > 0 ? formatBRL(prizePerTicket) : "Marque a equipe"}
                  highlight
                />
              </div>

              <button
                type="button"
                disabled={!winner || grossPool <= 0 || winnersCount === 0 || savingGroup === group.id}
                onClick={() => {
                  if (!winner) return
                  setAdminError(null)
                  setPendingSave({ groupId: group.id, winnerId: winner.id, grossPool })
                }}
                className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Save className="size-4" />
                {savingGroup === group.id ? "Salvando..." : "Finalizar e salvar rinha"}
              </button>
            </article>
          )
        })}
      </div>
      <PasswordDialog
        open={pendingSave !== null}
        title="Finalizar e salvar rinha"
        description="Confirme a senha administrativa para registrar o resultado e os pagamentos."
        error={adminError}
        busy={savingGroup !== null}
        onConfirm={saveBattle}
        onClose={() => {
          if (!savingGroup) setPendingSave(null)
        }}
      />
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
    <div className="min-w-0 rounded-xl border border-border bg-card/60 p-2.5 sm:p-3">
      <p className="flex items-center gap-1 text-[10px] text-muted-foreground sm:text-[11px]">{icon}{label}</p>
      <p className={"mt-1 break-words text-xs font-extrabold sm:text-sm " + (highlight ? "text-emerald-400" : "text-foreground")}>
        {value}
      </p>
    </div>
  )
}
