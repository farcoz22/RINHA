"use client"

import { useState } from "react"
import { Check, Crown, RotateCcw, Zap } from "lucide-react"

import type { BattleGroup, Participant } from "@/lib/types"
import type { PoolDraft } from "@/lib/pool-preview"
import { getConfirmationMap, getPoolPreview, parseMoney } from "@/lib/pool-preview"
import { formatBRL } from "@/lib/format"
import { PasswordDialog } from "@/components/password-dialog"

export function LiveSidebar({ groups, participants, groupId, currentTeamId, draft, onGroupChange, onDraftChange, onTeamConfirmed }: {
  groups: BattleGroup[]
  participants: Participant[]
  groupId: string | null
  currentTeamId?: string | null
  draft: PoolDraft
  onGroupChange: (id: string) => void
  onDraftChange: (draft: PoolDraft) => void
  onTeamConfirmed?: (eventId: string) => void
}) {
  const [confirming, setConfirming] = useState<{ groupId: string; winnerId: string; gross: number } | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const group = groups.find((item) => item.id === groupId) ?? groups[0]
  const pool = group ? getPoolPreview(group, participants, draft) : null

  function suggestWinner(next: PoolDraft) {
    if (!group) return next
    const preview = getPoolPreview(group, participants, next)
    return { ...next, [group.id]: { ...next[group.id], winnerId: preview.isTie ? "" : preview.resultLeader?.event.id ?? "" } }
  }

  function changeReturn(eventId: string, value: string) {
    if (!group) return
    const next = suggestWinner({
      ...draft,
      [group.id]: {
        winnerId: draft[group.id]?.winnerId ?? "",
        casinoReturns: { ...draft[group.id]?.casinoReturns, [eventId]: value },
        confirmedReturns: { ...getConfirmationMap(group, draft), [eventId]: false },
      },
    })
    onDraftChange(next)
    setMessage(null)
    setError(null)
  }

  function confirmReturn(eventId: string) {
    if (!group) return
    const value = draft[group.id]?.casinoReturns[eventId] ?? ""
    if (parseMoney(value) <= 0) {
      setError("Informe um valor maior que zero antes de confirmar a equipe.")
      return
    }
    const next = suggestWinner({
      ...draft,
      [group.id]: {
        winnerId: draft[group.id]?.winnerId ?? "",
        casinoReturns: draft[group.id]?.casinoReturns ?? {},
        confirmedReturns: { ...getConfirmationMap(group, draft), [eventId]: true },
      },
    })
    onDraftChange(next)
    setMessage(`${group.events.find((event) => event.id === eventId)?.name ?? "Equipe"} concluída e retirada da roleta.`)
    setError(null)
    onTeamConfirmed?.(eventId)
  }

  function reopenReturn(eventId: string) {
    if (!group) return
    const next = suggestWinner({
      ...draft,
      [group.id]: {
        winnerId: draft[group.id]?.winnerId ?? "",
        casinoReturns: draft[group.id]?.casinoReturns ?? {},
        confirmedReturns: { ...getConfirmationMap(group, draft), [eventId]: false },
      },
    })
    onDraftChange(next)
    setMessage(`${group.events.find((event) => event.id === eventId)?.name ?? "Equipe"} reaberta e devolvida à roleta.`)
    setError(null)
  }

  async function finish(password: string) {
    if (!confirming) return
    setSaving(true)
    setError(null)
    try {
      const response = await fetch("/api/history", {
        method: "POST",
        headers: { "content-type": "application/json", "x-export-password": password },
        body: JSON.stringify({ groupId: confirming.groupId, winnerEventId: confirming.winnerId, grossPool: confirming.gross }),
      })
      const result = (await response.json()) as { ok?: boolean; error?: string }
      if (!response.ok || !result.ok) throw new Error(result.error ?? "Não foi possível salvar a rinha")
      const next = { ...draft }
      delete next[confirming.groupId]
      onDraftChange(next)
      setMessage("Rodada registrada. A fila foi liberada para um novo sorteio.")
      setConfirming(null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erro ao salvar")
    } finally {
      setSaving(false)
    }
  }

  const leaderHolders = pool?.resultLeader
    ? participants.filter((person) => person.eventId === pool.resultLeader?.event.id)
    : []

  return <aside className="live-sidebar" aria-label="Liderança e pote ao vivo">
    <div className="live-scoreboard">
      <div className="live-scoreboard__header"><span>◈ PLACAR DA RODADA</span><span>AO VIVO</span></div>
      <label className="live-scoreboard__group">Fila
        <select value={group?.id ?? ""} onChange={(event) => onGroupChange(event.target.value)} aria-label="Escolher fila para o placar">
          {groups.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </label>
      {pool ? <>
        <div key={pool.resultLeader?.event.id ?? "waiting"} className={`live-scoreboard__leader ${pool.resultLeader ? "live-scoreboard__leader--active" : ""}`} aria-live="polite">
          <small>{pool.isTie ? "⚠ EMPATE NA LIDERANÇA" : pool.resultLeader ? "★ LÍDER DA RODADA" : "★ AGUARDANDO PRIMEIRO RESULTADO"}</small>
          <strong>{pool.isTie ? "Empate" : pool.resultLeader?.event.name ?? "Nenhuma equipe concluída"}</strong>
          <span>{pool.resultLeader ? `${formatBRL(pool.resultLeader.amount)} · ${leaderHolders.map((person) => person.username).join(", ") || "Sem nomes"}` : "Confirme o retorno de uma equipe para iniciar o placar"}</span>
        </div>
        <div className="live-scoreboard__progress">
          <span><b>{pool.completedCount}</b> concluída(s)</span>
          <span><b>{pool.pendingCount}</b> pendente(s)</span>
        </div>
        <ol className="live-scoreboard__ranks" aria-label={`Resultados confirmados em ${group.name}`}>
          {pool.confirmedResults.map((result, index) => <li key={result.event.id} className={index === 0 ? "live-scoreboard__rank--leader" : ""}><b>{index + 1}º</b><span title={result.event.name}>{result.event.name}</span><strong>{formatBRL(result.amount)}</strong></li>)}
          {!pool.confirmedResults.length && <li><span>Os resultados confirmados aparecerão aqui.</span></li>}
        </ol>
        <div className="live-scoreboard__money">
          <div><span>ENTRADAS</span><strong>{formatBRL(pool.entries)}</strong></div>
          <div><span>POTE BRUTO CONFIRMADO</span><strong>{formatBRL(pool.gross)}</strong></div>
          <div><span>TAXA · 15%</span><strong>− {formatBRL(pool.fee)}</strong></div>
          <div className="live-scoreboard__net"><span>POTE LÍQUIDO</span><strong>{formatBRL(pool.net)}</strong></div>
        </div>
        <div className="live-scoreboard__prize"><small>POR BILHETE · {pool.allCompleted ? "RESULTADO FINAL" : "PROJEÇÃO DA LÍDER"}</small><strong>{pool.gross && pool.winningTickets ? formatBRL(pool.perTicket) : "Aguardando retorno"}</strong><span>{pool.projectedTeam ? `${pool.projectedTeam.name} · ${pool.winningTickets} bilhete(s)` : "Aguardando primeira equipe"}</span></div>
        <div className="live-scoreboard__editor" aria-label="Confirmar os retornos do cassino nesta tela">
          <div className="live-scoreboard__editor-title"><strong>RETORNOS DO CASSINO</strong><span>Confirme para retirar da roleta</span></div>
          <div className="live-scoreboard__event-list">
          {group.events.map((event) => {
            const holders = participants.filter((person) => person.eventId === event.id)
            const result = pool.results.find((item) => item.event.id === event.id)
            const confirmed = result?.confirmed === true
            const playing = currentTeamId === event.id && !confirmed
            const leading = pool.resultLeader?.event.id === event.id && !pool.isTie
            return <div className={`live-scoreboard__event ${confirmed ? "live-scoreboard__event--completed" : ""} ${playing ? "live-scoreboard__event--playing" : ""} ${leading ? "live-scoreboard__event--winner" : ""}`} key={event.id}>
              <div className="live-scoreboard__event-name"><b>{event.name} {leading ? "👑" : ""}</b><small>{playing ? "Jogando agora" : confirmed ? "Concluída" : `${event.occupiedEntries} bilhete(s)`} · {holders.map((person) => person.username).join(", ") || "Sem nomes"}</small></div>
              <label><span className="sr-only">Retorno do cassino para {event.name}</span><span>R$</span><input inputMode="decimal" placeholder="0,00" disabled={confirmed} value={draft[group.id]?.casinoReturns[event.id] ?? ""} onChange={(change) => changeReturn(event.id, change.target.value)} /></label>
              <button type="button" className={confirmed ? "live-scoreboard__reopen" : ""} disabled={!confirmed && parseMoney(draft[group.id]?.casinoReturns[event.id] ?? "") <= 0} onClick={() => confirmed ? reopenReturn(event.id) : confirmReturn(event.id)}>
                {confirmed ? <><RotateCcw className="size-3" /> Reabrir</> : <><Check className="size-3" /> Confirmar</>}
              </button>
            </div>
          })}
          </div>
          {pool.allCompleted && !pool.isTie && pool.resultLeader && <div className="live-scoreboard__complete"><Crown className="size-4" /><span>Vencedora sugerida</span><strong>{pool.resultLeader.event.name}</strong></div>}
          {pool.isTie && <p className="live-scoreboard__tie"><Zap className="size-3.5" /> Empate: faça o desempate antes de finalizar.</p>}
          <button type="button" className="live-scoreboard__save" disabled={!pool.allCompleted || pool.isTie || !pool.winner || pool.gross <= 0 || !pool.winningTickets || saving} onClick={() => {
            if (pool.winner) { setError(null); setConfirming({ groupId: group.id, winnerId: pool.winner.id, gross: pool.gross }) }
          }}>{pool.allCompleted ? pool.isTie ? "Aguardando desempate" : `Finalizar com ${pool.winner?.name ?? "vencedora"}` : `Faltam ${pool.pendingCount} equipe(s)`}</button>
          {error && <p className="live-scoreboard__error" role="alert">{error}</p>}
          {message && <p className="live-scoreboard__success" role="status">{message}</p>}
        </div>
        <p className="live-scoreboard__note">A liderança considera somente valores confirmados. Reabra uma equipe para corrigir o resultado.</p>
      </> : <div className="live-scoreboard__note">Aguardando filas com participantes.</div>}
    </div>
    <div className="live-meme-card"><span className="nuuh-meme-crop nuuh-meme-crop--susto" role="img" aria-label="Nuuh assustado em uma transmissão" /><div><b>O NUUH TÁ DE OLHO</b><span>Quem vira a rodada agora?</span></div></div>
    <PasswordDialog open={confirming !== null} title="Finalizar e salvar rinha" description={`Confirme a vencedora ${pool?.winner?.name ?? "da rodada"}. O fechamento será registrado com os pagamentos pendentes.`} error={error} busy={saving} onConfirm={finish} onClose={() => { if (!saving) setConfirming(null) }} />
  </aside>
}
