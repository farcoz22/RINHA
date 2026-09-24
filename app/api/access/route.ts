import { NextResponse } from "next/server"
import { requireAdminPassword } from "@/lib/db"
import { getSiteAccessToken, SITE_ACCESS_COOKIE } from "@/lib/site-access"

export async function POST(request: Request) {
  try {
    await requireAdminPassword(request)
    const response = NextResponse.json({ ok: true })
    response.cookies.set({
      name: SITE_ACCESS_COOKIE,
      value: await getSiteAccessToken(),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    })
    return response
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Senha incorreta" },
      { status: 401 },
    )
  }
}
