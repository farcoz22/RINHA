import { NextResponse } from "next/server"
import { getLiveData } from "@/lib/live"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const data = await getLiveData()
    return NextResponse.json(data, {
      headers: { "cache-control": "no-store" },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido"
    return NextResponse.json(
      {
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
        error: message,
      },
      { status: 200, headers: { "cache-control": "no-store" } },
    )
  }
}
