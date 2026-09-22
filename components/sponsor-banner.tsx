"use client"

import { useEffect, useRef, useState } from "react"
import { ImagePlus } from "lucide-react"
import { PasswordDialog } from "@/components/password-dialog"

const slides = [
  { kicker: "ESPAÇO DA BET ATUAL", title: "A próxima rodada começa aqui", text: "Banner da parceira da live", className: "sponsor-slide--red" },
  { kicker: "INTERVALO DA LIVE", title: "A mesa está preparada", text: "Arte da bet pode entrar neste espaço", className: "sponsor-slide--gold" },
  { kicker: "CONFRONTO DO DUKOTH", title: "Quem sai na frente?", text: "Área reservada para a marca parceira", className: "sponsor-slide--teal" },
]

async function prepareBanner(file: File) {
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 10_000_000) {
    throw new Error("Escolha um arquivo PNG, JPG ou WebP de até 10 MB.")
  }
  const bitmap = await createImageBitmap(file)
  try {
    if (bitmap.width < 120 || bitmap.height < 60) throw new Error("A imagem precisa ter pelo menos 120 × 60 pixels.")
    for (const maxWidth of [1200, 900, 650]) {
      const scale = Math.min(1, maxWidth / bitmap.width, 500 / bitmap.height)
      const canvas = document.createElement("canvas")
      canvas.width = Math.round(bitmap.width * scale)
      canvas.height = Math.round(bitmap.height * scale)
      canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
      const image = canvas.toDataURL("image/webp", 0.78).split(",")[1]
      if (image && image.length < 1_200_000) return image
    }
    throw new Error("Não foi possível comprimir o banner para 900 KB.")
  } finally {
    bitmap.close()
  }
}

export function SponsorBanner() {
  const [index, setIndex] = useState(0)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [pendingImage, setPendingImage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const picker = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const refresh = () => void fetch("/api/sponsor", { cache: "no-store" })
      .then((response) => response.json() as Promise<{ updatedAt: string | null }>)
      .then((data) => setUpdatedAt(data.updatedAt))
      .catch(() => {})
    refresh()
    const timer = window.setInterval(refresh, 600_000)
    return () => window.clearInterval(timer)
  }, [])
  useEffect(() => {
    if (updatedAt) return
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % slides.length), 9000)
    return () => window.clearInterval(timer)
  }, [updatedAt])

  async function selectImage(file?: File) {
    if (!file) return
    setError(null)
    try {
      setPendingImage(await prepareBanner(file))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível ler a imagem")
    }
    if (picker.current) picker.current.value = ""
  }

  async function saveImage(password: string) {
    if (!pendingImage) return
    setBusy(true)
    setError(null)
    try {
      const response = await fetch("/api/sponsor", {
        method: "POST",
        headers: { "content-type": "application/json", "x-export-password": password },
        body: JSON.stringify({ image: pendingImage, mime: "image/webp" }),
      })
      const result = (await response.json()) as { updatedAt?: string; error?: string }
      if (!response.ok || !result.updatedAt) throw new Error(result.error ?? "Não foi possível salvar o banner")
      setUpdatedAt(result.updatedAt)
      setPendingImage(null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível salvar o banner")
    } finally {
      setBusy(false)
    }
  }

  const slide = slides[index]
  return <>
    <aside className={`sponsor-banner ${slide.className} ${updatedAt ? "sponsor-banner--active" : ""}`} aria-label="Espaço para a bet parceira">
      {updatedAt ? <img src={`/api/sponsor/image?v=${encodeURIComponent(updatedAt)}`} alt="Banner enviado para a bet da live" className="sponsor-banner__uploaded" /> : <>
        <div className="sponsor-banner__content"><span className="sponsor-banner__label">{slide.kicker}</span><strong>{slide.title}</strong><span>{slide.text}</span></div>
        <img src="/dukoth/mark.svg" className="sponsor-banner__face" alt="Marca do painel Dukoth" />
      </>}
      <input ref={picker} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" aria-label="Escolher imagem do patrocinador" onChange={(event) => void selectImage(event.target.files?.[0])} />
      <button type="button" onClick={() => picker.current?.click()} className="sponsor-banner__upload" aria-label={updatedAt ? "Trocar imagem do patrocinador" : "Enviar imagem do patrocinador"} title="Enviar imagem da bet"><ImagePlus size={14} /> <span>{updatedAt ? "Trocar imagem" : "Subir imagem"}</span></button>
      <div className="sponsor-banner__legal">{updatedAt ? "PUBLICIDADE · 18+ · Ministério da Fazenda adverte: Apostar pode causar dependência" : "ESPAÇO DE DEMONSTRAÇÃO · SEM PATROCÍNIO ATIVO"}</div>
    </aside>
    {error && !pendingImage && <p className="sponsor-banner__error" role="alert">{error}</p>}
    <PasswordDialog open={pendingImage !== null} title="Publicar banner da bet" description="A imagem aparecerá para todos que abrirem o site. Confirme a senha administrativa." error={error} busy={busy} onConfirm={saveImage} onClose={() => { if (!busy) { setPendingImage(null); setError(null) } }} />
  </>
}
