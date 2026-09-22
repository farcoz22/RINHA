"use client"

import { useEffect, useState } from "react"
import { sponsor } from "@/lib/sponsor"

const slides = [
  { kicker: "ESPAÇO DA BET ATUAL", title: "A próxima rodada começa aqui", text: "Banner da parceira da live", className: "sponsor-slide--red" },
  { kicker: "INTERVALO DA LIVE", title: "A mesa está preparada", text: "Arte da bet pode entrar neste espaço", className: "sponsor-slide--gold" },
  { kicker: "CONFRONTO DO NUUHZÃO", title: "Quem sai na frente?", text: "Área reservada para a marca parceira", className: "sponsor-slide--teal" },
]

export function SponsorBanner() {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    if (sponsor.name) return
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % slides.length), 9000)
    return () => window.clearInterval(timer)
  }, [])
  const slide = slides[index]
  return <aside className={`sponsor-banner ${slide.className}`} aria-label="Espaço para a bet parceira">
    <div className="sponsor-banner__content">
      <span className="sponsor-banner__label">{sponsor.name ? "PARCERIA DA LIVE" : slide.kicker}</span>
      {sponsor.image ? <img src={sponsor.image} alt={`Banner da parceira ${sponsor.name}`} className="sponsor-banner__art" /> : <>
        <strong>{sponsor.name || slide.title}</strong>
        <span>{sponsor.name ? "Parceira da transmissão" : slide.text}</span>
      </>}
    </div>
    <span className="sponsor-banner__face nuuh-meme-crop nuuh-meme-crop--salve" role="img" aria-label="Nuuh em um momento da live" />
    <div className="sponsor-banner__legal">{sponsor.name ? "PUBLICIDADE · 18+ · Ministério da Fazenda adverte: Apostar pode causar dependência" : "ESPAÇO DE DEMONSTRAÇÃO · SEM PATROCÍNIO ATIVO"}</div>
  </aside>
}
