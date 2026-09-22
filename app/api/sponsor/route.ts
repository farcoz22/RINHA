import { NextResponse } from "next/server"
import { getDb, requireAdminPassword } from "@/lib/db"

export const dynamic = "force-dynamic"

type BannerRow = { image_base64: string; mime_type: string; updated_at: string }
const MAX_IMAGE_BYTES = 900_000

function validImage(bytes: Uint8Array, mime: string) {
  if (mime === "image/png") return bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71
  if (mime === "image/jpeg") return bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
  if (mime === "image/webp") return String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  return false
}

export async function GET() {
  try {
    const db = await getDb()
    const { results } = await db.prepare("SELECT updated_at FROM sponsor_banner WHERE id = 1").all<{ updated_at: string }>()
    return NextResponse.json({ updatedAt: results?.[0]?.updated_at ?? null }, { headers: { "cache-control": "no-store" } })
  } catch {
    return NextResponse.json({ updatedAt: null }, { headers: { "cache-control": "no-store" } })
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminPassword(request)
    if (Number(request.headers.get("content-length") ?? 0) > 1_300_000) {
      return NextResponse.json({ error: "Imagem acima do limite de 900 KB" }, { status: 413 })
    }
    const raw = await request.text()
    if (raw.length > 1_300_000) return NextResponse.json({ error: "Imagem acima do limite de 900 KB" }, { status: 413 })
    const body = JSON.parse(raw) as { image?: string; mime?: string }
    if (!body.image || !body.mime || !/^[A-Za-z0-9+/]+={0,2}$/.test(body.image)) {
      return NextResponse.json({ error: "Envie uma imagem PNG, JPG ou WebP" }, { status: 400 })
    }
    const binary = atob(body.image)
    if (binary.length > MAX_IMAGE_BYTES) return NextResponse.json({ error: "Imagem acima do limite de 900 KB" }, { status: 413 })
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
    if (!validImage(bytes, body.mime)) return NextResponse.json({ error: "Formato de imagem inválido" }, { status: 400 })
    const updatedAt = new Date().toISOString()
    const db = await getDb()
    await db.prepare("INSERT INTO sponsor_banner (id, image_base64, mime_type, updated_at) VALUES (1, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET image_base64=excluded.image_base64, mime_type=excluded.mime_type, updated_at=excluded.updated_at")
      .bind(body.image, body.mime, updatedAt).run()
    return NextResponse.json({ updatedAt })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao enviar imagem"
    return NextResponse.json({ error: message }, { status: message === "Senha incorreta" ? 401 : 500 })
  }
}
