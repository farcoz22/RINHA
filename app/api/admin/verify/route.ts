import { NextResponse } from "next/server"
import { requireAdminPassword } from "@/lib/db"

export async function POST(request: Request) {
  try {
    await requireAdminPassword(request)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Senha incorreta" },
      { status: 401 },
    )
  }
}
