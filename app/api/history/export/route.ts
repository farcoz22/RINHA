import { getDb, requireAdminPassword } from "@/lib/db"

type ExportRow = {
  battle_id: string
  group_name: string
  winner_event_name: string
  closed_at: string
  username: string
  quantity: number
  prize: number
  status: string
  paid_at: string | null
  fields_json: string
}

function csvCell(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`
}

export async function POST(request: Request) {
  try {
    await requireAdminPassword(request)
    const body = (await request.json().catch(() => ({}))) as { battleId?: string }
    const db = await getDb()
    const query = `SELECT b.id AS battle_id, b.group_name, b.winner_event_name, b.closed_at,
      p.username, p.quantity, p.prize, p.status, p.paid_at, p.fields_json
      FROM payouts p JOIN battles b ON b.id = p.battle_id
      ${body.battleId ? "WHERE b.id = ?" : ""}
      ORDER BY b.closed_at DESC, p.username`
    const statement = db.prepare(query)
    const result = body.battleId
      ? await statement.bind(body.battleId).all<ExportRow>()
      : await statement.all<ExportRow>()
    const rows = result.results ?? []
    const fieldLabels = [...new Set(rows.flatMap((row) => {
      try { return (JSON.parse(row.fields_json) as { label: string }[]).map((field) => field.label) }
      catch { return [] }
    }))]
    const header = ["Rinha", "Equipe vencedora", "Data", "Participante", "Quantidade", "Valor a pagar", "Status", "Pago em", ...fieldLabels]
    const lines = rows.map((row) => {
      let fields: { label: string; value: string }[] = []
      try { fields = JSON.parse(row.fields_json) as { label: string; value: string }[] } catch {}
      const values = new Map(fields.map((field) => [field.label, field.value]))
      return [row.group_name, row.winner_event_name, row.closed_at, row.username, row.quantity, row.prize.toFixed(2), row.status, row.paid_at ?? "", ...fieldLabels.map((label) => values.get(label) ?? "")]
        .map(csvCell).join(";")
    })
    const csv = "\uFEFF" + [header.map(csvCell).join(";"), ...lines].join("\r\n")
    return new Response(csv, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="pagamentos-rinhas-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Erro ao exportar" },
      { status: 401 },
    )
  }
}
