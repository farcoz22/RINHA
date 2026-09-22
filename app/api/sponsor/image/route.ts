import { getDb } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const db = await getDb()
    const { results } = await db.prepare("SELECT image_base64, mime_type FROM sponsor_banner WHERE id = 1").all<{ image_base64: string; mime_type: string }>()
    const row = results?.[0]
    if (!row) return new Response("Sem banner", { status: 404 })
    const binary = atob(row.image_base64)
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
    return new Response(bytes, { headers: { "content-type": row.mime_type, "cache-control": "public, max-age=60", "x-content-type-options": "nosniff" } })
  } catch {
    return new Response("Banner indisponível", { status: 503 })
  }
}
