import { NextResponse } from "next/server"
import { getDb, requireAdminPassword } from "@/lib/db"

export async function PATCH(request: Request) {
  try {
    await requireAdminPassword(request)
    const body = (await request.json()) as { paymentId?: string; paid?: boolean }
    if (!body.paymentId) return NextResponse.json({ error: "Pagamento não informado" }, { status: 400 })
    const db = await getDb()
    await db.prepare("UPDATE payouts SET status = ?, paid_at = ? WHERE id = ?")
      .bind(body.paid ? "PAID" : "PENDING", body.paid ? new Date().toISOString() : null, body.paymentId)
      .run()
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao atualizar pagamento"
    return NextResponse.json({ error: message }, { status: message === "Senha incorreta" ? 401 : 500 })
  }
}
