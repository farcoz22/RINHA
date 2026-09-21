import type { Participant } from "@/lib/types"
import { formatBRL } from "@/lib/format"
import { Trophy } from "lucide-react"

interface BattleOrderProps {
  remaining: Participant[]
  eliminated: Participant[]
  winner: Participant | null
}

export function BattleOrder({ remaining, eliminated, winner }: BattleOrderProps) {
  return (
    <div className="rounded-3xl border border-border bg-card/60 p-6 backdrop-blur">
      <p className="text-xs font-semibold tracking-[0.3em] text-accent uppercase">
        Ordem da batalha
      </p>
      <h2 className="mt-1 text-2xl font-bold">Quem ainda falta</h2>

      <div className="mt-4 rounded-2xl border border-border bg-background/40 p-4">
        {remaining.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            A roleta terminou. Não restam nomes para rodar.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {remaining.map((p, i) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-3 rounded-xl bg-card/60 px-3 py-2"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/15 text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{p.username}</p>
                    <p className="truncate text-xs text-muted-foreground">{p.eventName}</p>
                  </div>
                </div>
                <span className="shrink-0 text-xs font-bold text-accent">
                  {formatBRL(p.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-background/50 p-5">
        <p className="text-sm text-muted-foreground">Resultado final</p>
        {winner ? (
          <div className="mt-1 flex items-center gap-3">
            <Trophy className="size-8 text-amber-400" />
            <div>
              <p className="text-2xl font-extrabold">{winner.username}</p>
              <p className="text-xs text-muted-foreground">
                Sobreviveu à roleta · {winner.eventName}
              </p>
            </div>
          </div>
        ) : (
          <>
            <p className="mt-1 text-2xl font-extrabold leading-tight">Aguardando finalização</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Quando não sobrar ninguém na roleta, o vencedor aparece aqui.
            </p>
          </>
        )}
      </div>

      {eliminated.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Já eliminados
          </p>
          <div className="flex flex-wrap gap-2">
            {eliminated.map((p) => (
              <span
                key={p.id}
                className="rounded-full bg-background/50 px-3 py-1 text-xs text-muted-foreground line-through ring-1 ring-border"
              >
                {p.username}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
