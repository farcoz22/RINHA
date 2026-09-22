"use client"

import type { BattleGroup, Participant } from "@/lib/types"
import type { PoolDraft } from "@/lib/pool-preview"
import { getPoolPreview } from "@/lib/pool-preview"
import { formatBRL } from "@/lib/format"
import { SponsorBanner } from "@/components/sponsor-banner"

export function LiveSidebar({ groups, participants, groupId, draft, onGroupChange }: {
  groups: BattleGroup[]
  participants: Participant[]
  groupId: string | null
  draft: PoolDraft
  onGroupChange: (id: string) => void
}) {
  const group = groups.find((item) => item.id === groupId) ?? groups[0]
  const pool = group ? getPoolPreview(group, participants, draft) : null
  return <aside className="live-sidebar" aria-label="Liderança e pote ao vivo">
    <SponsorBanner />
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
        <p className="live-scoreboard__note">O ranking mostra quem colocou mais. O vencedor e o pagamento só são definidos no fechamento.</p>
      </> : <div className="live-scoreboard__note">Aguardando filas com participantes.</div>}
    </div>
    <div className="live-meme-card"><span className="nuuh-meme-crop nuuh-meme-crop--susto" role="img" aria-label="Nuuh assustado em uma transmissão" /><div><b>O NUUH TÁ DE OLHO</b><span>Quem vira a rodada agora?</span></div></div>
  </aside>
}
