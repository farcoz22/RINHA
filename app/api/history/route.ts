import { NextResponse } from "next/server"
import { getDb, requireAdminPassword } from "@/lib/db"
import { getLiveData } from "@/lib/live"
import type { BattleHistoryItem, BattleHistoryPayment } from "@/lib/types"

export const dynamic = "force-dynamic"

type BattleRow = {
  id: string
  group_name: string
  winner_event_name: string
  entry_total: number
  gross_pool: number
  fee: number
  net_pool: number
  winner_count: number
  prize_per_ticket: number
  closed_at: string
}

type PaymentRow = {
  id: string
  battle_id: string
  username: string
  quantity: number
  prize: number
  status: "PENDING" | "PAID"
  paid_at: string | null
}

export async function GET() {
  try {
    const db = await getDb()
    const [battleResult, paymentResult] = await Promise.all([
      db.prepare("SELECT * FROM battles ORDER BY closed_at DESC LIMIT 50").all<BattleRow>(),
      db.prepare("SELECT id, battle_id, username, quantity, prize, status, paid_at FROM payouts ORDER BY username").all<PaymentRow>(),
    ])
    const paymentsByBattle = new Map<string, BattleHistoryPayment[]>()
    for (const row of paymentResult.results ?? []) {
      const list = paymentsByBattle.get(row.battle_id) ?? []
      list.push({
        id: row.id,
        username: row.username,
        quantity: row.quantity,
        prize: row.prize,
        status: row.status,
        paidAt: row.paid_at,
      })
      paymentsByBattle.set(row.battle_id, list)
    }
    const history: BattleHistoryItem[] = (battleResult.results ?? []).map((row) => ({
      id: row.id,
      groupName: row.group_name,
      winnerEventName: row.winner_event_name,
      entryTotal: row.entry_total,
      grossPool: row.gross_pool,
      fee: row.fee,
      netPool: row.net_pool,
      winnerCount: row.winner_count,
      prizePerTicket: row.prize_per_ticket,
      closedAt: row.closed_at,
      payments: paymentsByBattle.get(row.id) ?? [],
    }))
    return NextResponse.json({ history }, { headers: { "cache-control": "no-store" } })
  } catch (error) {
    return NextResponse.json(
      { history: [], error: error instanceof Error ? error.message : "Erro ao carregar histórico" },
      { status: 200 },
    )
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminPassword(request)
    const body = (await request.json()) as {
      groupId?: string
      winnerEventId?: string
      grossPool?: number
    }
    if (!body.groupId || !body.winnerEventId || !Number.isFinite(body.grossPool) || body.grossPool! <= 0) {
      return NextResponse.json({ error: "Dados do fechamento incompletos" }, { status: 400 })
    }

    const live = await getLiveData()
    const group = live.battleGroups.find((item) => item.id === body.groupId)
    const winner = group?.events.find((event) => event.id === body.winnerEventId)
    if (!group || !winner) return NextResponse.json({ error: "Confronto ou equipe não encontrado" }, { status: 404 })

    const winners = live.participants.filter((participant) => participant.eventId === winner.id)
    const winnerCount = winners.reduce((sum, participant) => sum + Math.max(1, participant.quantity), 0)
    if (winnerCount === 0) return NextResponse.json({ error: "A equipe vencedora não tem bilhetes" }, { status: 400 })

    const entryTotal = group.events.reduce(
      (sum, event) => sum + event.minValue * event.occupiedEntries,
      0,
    )
    const grossPool = Number(body.grossPool)
    const fee = grossPool * 0.15
    const netPool = grossPool - fee
    const prizePerTicket = netPool / winnerCount
    const battleId = crypto.randomUUID()
    const closedAt = new Date().toISOString()
    const db = await getDb()
    const statements = [
      db.prepare(`INSERT INTO battles
        (id, group_id, group_name, winner_event_id, winner_event_name, entry_total, gross_pool, fee, net_pool, winner_count, prize_per_ticket, closed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(battleId, group.id, group.name, winner.id, winner.name, entryTotal, grossPool, fee, netPool, winnerCount, prizePerTicket, closedAt),
      ...winners.map((participant) =>
        db.prepare(`INSERT INTO payouts
          (id, battle_id, participant_id, username, quantity, prize, status, fields_json)
          VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?)`)
          .bind(
            crypto.randomUUID(), battleId, participant.id, participant.username,
            Math.max(1, participant.quantity), prizePerTicket * Math.max(1, participant.quantity),
            JSON.stringify(participant.fields),
          ),
      ),
    ]
    await db.batch(statements)
    return NextResponse.json({ ok: true, battleId })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao salvar rinha"
    return NextResponse.json({ error: message }, { status: message === "Senha incorreta" ? 401 : 500 })
  }
}
