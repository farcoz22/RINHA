"use client"

import { useState } from "react"

import type { BattleGroup, Participant } from "@/lib/types"
import type { PoolDraft } from "@/lib/pool-preview"
import { getPoolPreview } from "@/lib/pool-preview"
import { formatBRL } from "@/lib/format"
import { PasswordDialog } from "@/components/password-dialog"

export function LiveSidebar({ groups, participants, groupId, draft, onGroupChange, onDraftChange }: {
  groups: BattleGroup[]
  participants: Participant[]
  groupId: string | null
  draft: PoolDraft
  onGroupChange: (id: string) => void
  onDraftChange: (draft: PoolDraft) => void
}) {
  const [confirming, setConfirming] = useState<{ groupId: string; winnerId: string; gross: number } | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const group = groups.find((item) => item.id === groupId) ?? groups[0]
  const pool = group ? getPoolPreview(group, participants, draft) : null
  function changeReturn(eventId: string, value: string) {
    if (!group) return
    onDraftChange({ ...draft, [group.id]: {
      winnerId: draft[group.id]?.winnerId ?? "",
      casinoReturns: { ...draft[group.id]?.casinoReturns, [eventId]: value },
    } })
    setMessage(null)
  }
  function changeWinner(eventId: string) {
    if (!group) return
    onDraftChange({ ...draft, [group.id]: {
      winnerId: eventId,
      casinoReturns: draft[group.id]?.casinoReturns ?? {},
    } })
    setMessage(null)
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
      setMessage("Rinha registrada. Pagamentos pendentes no histórico.")
      setConfirming(null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erro ao salvar")
    } finally {
      setSaving(false)
    }
  }
  return <aside className="live-sidebar" aria-label="Liderança e pote ao vivo">
    <div className="live-scoreboard">
      <div className="live-scoreboard__header"><span>◈ PLACAR DA RODADA</span><span>AO VIVO</span></div>
      <label className="live-scoreboard__group">Fila
        <select value={group?.id ?? ""} onChange={(event) => onGroupChange(event.target.value)} aria-label="Escolher fila para o placar">
          {groups.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </label>
      {pool ? <>
        <div className="live-scoreboard__leader">
          <small>★ NA FRENTE PELO VALOR</small>
          <strong>{pool.leader?.username ?? "Aguardando bilhetes"}</strong>
          <span>{pool.leader ? `${pool.leader.eventName} · ${formatBRL(pool.leader.amount)}` : "Sem participantes na fila"}</span>
        </div>
        <ol className="live-scoreboard__ranks" aria-label={`Primeiros colocados em ${group.name}`}>
          {pool.standings.slice(0, 3).map((person, index) => <li key={person.id}><b>{index + 1}º</b><span title={person.username}>{person.username}</span><strong>{formatBRL(person.amount)}</strong></li>)}
        </ol>
        <div className="live-scoreboard__money">
          <div><span>ENTRADAS</span><strong>{formatBRL(pool.entries)}</strong></div>
          <div><span>POTE BRUTO INFORMADO</span><strong>{formatBRL(pool.gross)}</strong></div>
          <div><span>TAXA · 15%</span><strong>− {formatBRL(pool.fee)}</strong></div>
          <div className="live-scoreboard__net"><span>POTE LÍQUIDO</span><strong>{formatBRL(pool.net)}</strong></div>
        </div>
        <div className="live-scoreboard__prize"><small>POR BILHETE · {pool.winner ? "EQUIPE MARCADA" : "SIMULAÇÃO SE A LÍDER VENCER"}</small><strong>{pool.gross ? formatBRL(pool.perTicket) : "Aguardando retorno"}</strong><span>{pool.projectedTeam ? `${pool.projectedTeam.name} · ${pool.winningTickets} bilhete(s)` : "Marque uma equipe no fechamento"}</span></div>
        <div className="live-scoreboard__editor" aria-label="Lançar retornos e marcar vencedora nesta tela">
          <div className="live-scoreboard__editor-title"><strong>RETORNOS DO CASSINO</strong><span>R$ por equipe</span></div>
          <div className="live-scoreboard__event-list">
          {group.events.map((event) => {
            const holders = participants.filter((person) => person.eventId === event.id)
            const selected = draft[group.id]?.winnerId === event.id
            return <div className={`live-scoreboard__event ${selected ? "live-scoreboard__event--winner" : ""}`} key={event.id}>
              <div className="live-scoreboard__event-name"><b>{event.name}</b><small>{event.occupiedEntries} bilhete(s) · {holders.map((person) => person.username).join(", ") || "Sem nomes"}</small></div>
              <label><span className="sr-only">Retorno do cassino para {event.name}</span><span>R$</span><input inputMode="decimal" placeholder="0,00" value={draft[group.id]?.casinoReturns[event.id] ?? ""} onChange={(change) => changeReturn(event.id, change.target.value)} /></label>
              <button type="button" aria-pressed={selected} onClick={() => changeWinner(event.id)}>{selected ? "✓ Venceu" : "Marcar"}</button>
            </div>
          })}
          </div>
          <button type="button" className="live-scoreboard__save" disabled={!pool.winner || pool.gross <= 0 || !pool.winningTickets || saving} onClick={() => {
            if (pool.winner) { setError(null); setConfirming({ groupId: group.id, winnerId: pool.winner.id, gross: pool.gross }) }
          }}>Finalizar e salvar rinha</button>
          {message && <p className="live-scoreboard__success" role="status">{message}</p>}
        </div>
        <p className="live-scoreboard__note">O ranking mostra quem colocou mais. O vencedor e o pagamento só são definidos no fechamento.</p>
      </> : <div className="live-scoreboard__note">Aguardando filas com participantes.</div>}
    </div>
    <div className="live-meme-card"><span className="nuuh-meme-crop nuuh-meme-crop--susto" role="img" aria-label="Nuuh assustado em uma transmissão" /><div><b>O NUUH TÁ DE OLHO</b><span>Quem vira a rodada agora?</span></div></div>
    <PasswordDialog open={confirming !== null} title="Finalizar e salvar rinha" description="O fechamento será registrado no histórico com os pagamentos pendentes." error={error} busy={saving} onConfirm={finish} onClose={() => { if (!saving) setConfirming(null) }} />
  </aside>
}
