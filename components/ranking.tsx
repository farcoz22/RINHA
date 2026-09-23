"use client"

import { Crosshair, Swords, Users } from "lucide-react"
import type { BattleGroup, Participant, RecentDonation } from "@/lib/types"
import { formatBRL, formatTime } from "@/lib/format"
import { PoolCalculator } from "@/components/pool-calculator"
import { PaymentExport } from "@/components/battle-history"

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

export function Ranking({ participants, battleGroups, donations }: RankingProps) {
  const grouped = battleGroups.filter((group) => group.id !== "__solo__")
  const solo = battleGroups.find((group) => group.id === "__solo__")

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <PoolCalculator
        groups={battleGroups}
        participants={participants}
      />

      <section className="rounded-3xl border border-border bg-card/60 p-4 backdrop-blur sm:p-5 lg:col-span-2">
        <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.3em] text-accent uppercase">
          <Swords className="size-3.5" /> Classificação das filas
        </p>
        <h2 className="mt-1 text-xl font-bold">Quem está na frente</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Posições pelo valor colocado em cada fila. O resultado da rinha é definido no fechamento.
        </p>

        <div className="mt-4 grid gap-3 xl:grid-cols-2">
          {grouped.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhum confronto com equipes no momento.
            </p>
          )}

          {grouped.map((group) => {
            const standings = participants
              .filter((person) =>
                group.events.some((event) => event.id === person.eventId),
              )
              .sort(
                (a, b) =>
                  b.amount - a.amount ||
                  a.username.localeCompare(b.username),
              )

            const leader = standings[0]
            const entryTotal = group.events.reduce(
              (sum, event) =>
                sum + event.minValue * event.occupiedEntries,
              0,
            )

            return (
              <article
                key={group.id}
                className="min-w-0 rounded-2xl border border-border bg-background/45 p-3 sm:p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold">{group.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {group.events.length} equipes · {standings.length} pessoas ·
                      entradas {formatBRL(entryTotal)}
                    </p>
                  </div>
                  <span className="rounded-full bg-primary/15 px-2 py-1 text-[10px] font-bold text-primary">
                    RANKING
                  </span>
                </div>

                {leader && (
                  <div
                    key={leader.id}
                    className="rank-lead mt-3 flex min-w-0 items-center gap-3 overflow-hidden rounded-xl border border-amber-400/40 bg-amber-400/10 px-3 py-2"
                    aria-live="polite"
                  >
                    <Crosshair
                      className="rank-crosshair size-5 shrink-0 text-amber-300"
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold tracking-widest text-amber-300 uppercase">
                        Na liderança
                      </p>
                      <p className="truncate text-sm font-extrabold">
                        {leader.username}{" "}
                        <span className="font-normal text-muted-foreground">
                          · {leader.eventName}
                        </span>
                      </p>
                    </div>
                    <strong className="shrink-0 text-xs text-amber-300">
                      {formatBRL(leader.amount)}
                    </strong>
                  </div>
                )}

                <ol
                  className="mt-2 grid gap-1.5"
                  aria-label={`Ranking de ${group.name}`}
                >
                  {standings.length === 0 && (
                    <li className="text-xs text-muted-foreground">
                      Aguardando bilhetes.
                    </li>
                  )}
                  {standings.map((person, index) => (
                    <li
                      key={person.id}
                      className="grid grid-cols-[1.5rem_minmax(0,1fr)_auto] items-center gap-2 rounded-lg bg-card/60 px-2 py-1.5"
                    >
                      <span
                        className={`text-center text-xs font-extrabold ${
                          index === 0
                            ? "text-amber-300"
                            : "text-muted-foreground"
                        }`}
                      >
                        {index + 1}º
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold">
                          {person.username}
                          {person.quantity > 1
                            ? ` ×${person.quantity}`
                            : ""}
                        </p>
                        <p className="truncate text-[10px] text-muted-foreground">
                          {person.eventName}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-accent">
                        {formatBRL(person.amount)}
                      </span>
                    </li>
                  ))}
                </ol>
              </article>
            )
          })}

          {solo && (
            <article className="rounded-2xl border border-border bg-background/45 p-3 sm:p-4">
              <h3 className="font-bold">Filas avulsas</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Os nomes dos bilhetes aparecem no fechamento acima.
              </p>
              <ul className="mt-3 grid gap-2">
                {solo.events.map((event) => (
                  <li
                    key={event.id}
                    className="flex min-w-0 justify-between gap-2 rounded-lg bg-card/60 px-3 py-2 text-xs"
                  >
                    <span className="min-w-0 truncate font-semibold">
                      {event.name}
                    </span>
                    <span className="shrink-0 text-muted-foreground">
                      {event.occupiedEntries} bilhete(s)
                    </span>
                  </li>
                ))}
              </ul>
            </article>
          )}
        </div>
      </section>

      <PaymentExport />

      <section className="rounded-3xl border border-border bg-card/60 p-4 backdrop-blur sm:p-5">
        <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.3em] text-accent uppercase">
          <Users className="size-3.5" /> Doações
        </p>
        <h2 className="mt-1 text-xl font-bold">Últimas doações</h2>
        <ul className="mt-3 grid gap-2">
          {donations.length === 0 && (
            <li className="text-xs text-muted-foreground">
              Sem doações recentes.
            </li>
          )}
          {donations.map((donation) => (
            <li
              key={donation.id}
              className="flex min-w-0 items-center justify-between gap-2 rounded-lg bg-background/50 px-3 py-2 text-xs"
            >
              <span className="min-w-0 truncate font-semibold">
                {donation.username}
                {donation.message ? ` · ${donation.message}` : ""}
              </span>
              <span className="shrink-0 text-muted-foreground">
                {STATUS_LABEL[donation.status]} ·{" "}
                {formatTime(donation.createdAt)}
              </span>
              <strong className="shrink-0 text-accent">
                {formatBRL(donation.amount)}
              </strong>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
