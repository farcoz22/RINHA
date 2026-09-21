"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import { AlertTriangle, RotateCcw } from "lucide-react"
import type { LiveData, Participant } from "@/lib/types"
import { SiteHeader } from "@/components/site-header"
import { Hero } from "@/components/hero"
import { Roulette, type WheelName } from "@/components/roulette"
import { BattleOrder } from "@/components/battle-order"
import { Ranking } from "@/components/ranking"

const fetcher = (url: string) => fetch(url).then((r) => r.json() as Promise<LiveData>)

const EMPTY: LiveData = {
  updatedAt: new Date().toISOString(),
  stats: {
    participants: 0,
    events: 0,
    groups: 0,
    totalEntradas: 0,
    totalGanhos: 0,
    paidDonations: 0,
  },
  participants: [],
  battleGroups: [],
  recentDonations: [],
}

type Tab = "ao-vivo" | "fila"

export function LivePanel({ initialData }: { initialData: LiveData }) {
  const { data } = useSWR<LiveData>("/api/live", fetcher, {
    // Um minuto reduz em cerca de 67% as chamadas quando comparado aos 20s anteriores.
    refreshInterval: 60_000,
    fallbackData: initialData,
    keepPreviousData: true,
  })

  const live = data ?? EMPTY
  const [tab, setTab] = useState<Tab>("ao-vivo")
  const [eliminatedIds, setEliminatedIds] = useState<string[]>([])
  const [selectedName, setSelectedName] = useState<string | null>(null)

  const byId = useMemo(() => {
    const m = new Map<string, Participant>()
    for (const p of live.participants) m.set(p.id, p)
    return m
  }, [live.participants])

  // Eliminados que ainda existem na fila atual (reconciliação com o polling).
  const validEliminated = useMemo(
    () => eliminatedIds.filter((id) => byId.has(id)),
    [eliminatedIds, byId],
  )

  const remaining = useMemo(
    () => live.participants.filter((p) => !validEliminated.includes(p.id)),
    [live.participants, validEliminated],
  )

  const eliminatedParticipants = useMemo(
    () => validEliminated.map((id) => byId.get(id)!).filter(Boolean),
    [validEliminated, byId],
  )

  const winner =
    live.participants.length > 0 && remaining.length === 1 ? remaining[0] : null

  const wheelNames: WheelName[] = remaining.map((p) => ({ id: p.id, username: p.username }))

  function handleEliminated(name: WheelName) {
    setSelectedName(name.username)
    setEliminatedIds((prev) => (prev.includes(name.id) ? prev : [...prev, name.id]))
  }

  function resetGame() {
    setEliminatedIds([])
    setSelectedName(null)
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6">
      <SiteHeader />

      {live.error && (
        <div className="flex items-center gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="size-4 shrink-0" />
          <span>Não foi possível carregar tudo da API da Rhyno: {live.error}</span>
        </div>
      )}

      <Hero
        selectedName={selectedName}
        stats={live.stats}
        remaining={remaining.length}
        finished={eliminatedParticipants.length}
        updatedAt={live.updatedAt}
      />

      {/* Tabs */}
      <div className="flex items-center gap-2" id="ao-vivo">
        <button
          type="button"
          onClick={() => setTab("ao-vivo")}
          className={
            "rounded-full px-4 py-2 text-sm font-semibold transition " +
            (tab === "ao-vivo"
              ? "bg-gradient-to-r from-primary to-sky-500 text-primary-foreground shadow-lg shadow-primary/30"
              : "text-muted-foreground ring-1 ring-border hover:text-foreground")
          }
        >
          Ao vivo
        </button>
        <button
          type="button"
          onClick={() => setTab("fila")}
          className={
            "rounded-full px-4 py-2 text-sm font-semibold transition " +
            (tab === "fila"
              ? "bg-gradient-to-r from-primary to-sky-500 text-primary-foreground shadow-lg shadow-primary/30"
              : "text-muted-foreground ring-1 ring-border hover:text-foreground")
          }
        >
          Apostas, pote &amp; ranking
        </button>

        {eliminatedParticipants.length > 0 && (
          <button
            type="button"
            onClick={resetGame}
            className="ml-auto inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-muted-foreground ring-1 ring-border transition hover:text-foreground"
          >
            <RotateCcw className="size-3.5" />
            Reiniciar roleta
          </button>
        )}
      </div>

      {tab === "ao-vivo" ? (
        <section className="grid gap-6 lg:grid-cols-2" id="fila">
          <div className="rounded-3xl border border-border bg-card/60 p-6 backdrop-blur">
            <p className="text-center text-xs font-semibold tracking-[0.3em] text-accent uppercase">
              Roleta do Nuuhzão
            </p>
            <h2 className="mb-6 mt-1 text-center text-2xl font-bold">
              Quem foi azarado na vez?
            </h2>
            <Roulette names={wheelNames} onEliminated={handleEliminated} disabled={!!winner} />

            <div className="mt-6 rounded-2xl border border-border bg-background/40 p-5 text-center">
              {selectedName ? (
                <>
                  <p className="text-sm text-muted-foreground">Último sorteado</p>
                  <p className="mt-1 text-3xl font-extrabold">{selectedName}</p>
                </>
              ) : (
                <>
                  <p className="text-3xl font-extrabold leading-tight">Aguardando a roleta</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Assim que o Nuuh girar, o nome sai aqui.
                  </p>
                </>
              )}
            </div>
          </div>

          <BattleOrder
            remaining={remaining}
            eliminated={eliminatedParticipants}
            winner={winner}
          />
        </section>
      ) : (
        <Ranking
          participants={live.participants}
          battleGroups={live.battleGroups}
          donations={live.recentDonations}
        />
      )}

      <footer className="mt-2 border-t border-border pt-5 text-xs text-muted-foreground">
        18+ | Jogue com responsabilidade! · Dados ao vivo via API da Rhyno
      </footer>
    </div>
  )
}
