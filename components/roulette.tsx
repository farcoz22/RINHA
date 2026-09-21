"use client"

import { useEffect, useRef, useState } from "react"
import { Volume2 } from "lucide-react"
import { colorForIndex } from "@/lib/format"

export interface WheelChoice {
  id: string
  label: string
}

export type RouletteSound = "classic" | "casino" | "arcade" | "silent"
const SIZE = 320
const R = SIZE / 2
const DURATION = 4200

function polar(r: number, degrees: number) {
  const angle = ((degrees - 90) * Math.PI) / 180
  return { x: R + r * Math.cos(angle), y: R + r * Math.sin(angle) }
}

function slicePath(index: number, total: number) {
  const slice = 360 / total
  const from = polar(R, index * slice)
  const to = polar(R, (index + 1) * slice)
  return `M ${R} ${R} L ${from.x} ${from.y} A ${R} ${R} 0 ${slice > 180 ? 1 : 0} 1 ${to.x} ${to.y} Z`
}

export function Roulette({
  choices,
  onSelected,
  onSpinningChange,
  buttonLabel,
  sound,
  onSoundChange,
}: {
  choices: WheelChoice[]
  onSelected: (choice: WheelChoice) => void
  onSpinningChange?: (value: boolean) => void
  buttonLabel: string
  sound: RouletteSound
  onSoundChange: (sound: RouletteSound) => void
}) {
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [spinChoices, setSpinChoices] = useState(choices)
  const [landedId, setLandedId] = useState<string | null>(null)
  const rotationRef = useRef(0)
  const audioRef = useRef<AudioContext | null>(null)
  const tickTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const finishTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tickCount = useRef(0)
  const onSelectedRef = useRef(onSelected)
  const onSpinningRef = useRef(onSpinningChange)
  onSelectedRef.current = onSelected
  onSpinningRef.current = onSpinningChange

  useEffect(() => () => {
    if (tickTimer.current) clearInterval(tickTimer.current)
    if (finishTimer.current) clearTimeout(finishTimer.current)
    void audioRef.current?.close()
    onSpinningRef.current?.(false)
  }, [])

  function tick() {
    if (sound === "silent") return
    try {
      audioRef.current ??= new window.AudioContext()
      const ctx = audioRef.current
      if (ctx.state === "suspended") void ctx.resume()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const count = tickCount.current++
      osc.type = sound === "classic" ? "square" : sound === "casino" ? "sine" : "triangle"
      osc.frequency.value = sound === "classic" ? 520 : sound === "casino" ? [660, 880, 990, 880][count % 4] : [392, 523, 659, 784][count % 4]
      const length = sound === "casino" ? 0.12 : 0.07
      gain.gain.setValueAtTime(sound === "casino" ? 0.075 : 0.045, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + length)
      osc.connect(gain).connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + length)
    } catch {
      // Áudio opcional.
    }
  }

  function spin() {
    if (spinning || !choices.length) return
    const snapshot = [...choices]
    setSpinChoices(snapshot)
    setLandedId(null)
    setSpinning(true)
    onSpinningChange?.(true)

    const selectedIndex = Math.floor(Math.random() * snapshot.length)
    const center = (selectedIndex + 0.5) * 360 / snapshot.length
    const base = rotationRef.current - ((rotationRef.current % 360) + 360) % 360
    let target = base - center + 360 * 6
    if (target <= rotationRef.current) target += 360
    rotationRef.current = target
    setRotation(target)

    tickCount.current = 0
    tick()
    tickTimer.current = setInterval(tick, sound === "casino" ? 155 : 105)
    finishTimer.current = setTimeout(() => {
      if (tickTimer.current) clearInterval(tickTimer.current)
      setSpinning(false)
      setLandedId(snapshot[selectedIndex].id)
      onSpinningRef.current?.(false)
      onSelectedRef.current(snapshot[selectedIndex])
    }, DURATION)
  }

  const visible = spinning || landedId ? spinChoices : choices
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: SIZE, maxWidth: "100%" }}>
        <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1">
          <div className="size-0" style={{ borderLeft: "16px solid transparent", borderRight: "16px solid transparent", borderTop: "24px solid var(--accent)", filter: "drop-shadow(0 2px 6px rgba(0,0,0,.5))" }} />
        </div>
        <div className="aspect-square w-full rounded-full ring-4 ring-border" style={{ boxShadow: "0 0 60px oklch(0.62 0.19 258 / 0.25)" }}>
          <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="size-full" style={{ transform: `rotate(${rotation}deg)`, transformOrigin: "center", transition: spinning ? `transform ${DURATION}ms cubic-bezier(0.15, 0.9, 0.2, 1)` : "none" }}>
            {!visible.length ? <circle cx={R} cy={R} r={R - 2} fill="var(--muted)" /> : visible.map((choice, i) => {
              const mid = (i + 0.5) * 360 / visible.length
              const pos = polar(R * 0.62, mid)
              const selected = landedId === choice.id
              return <g key={choice.id}>
                {visible.length === 1 ? <circle cx={R} cy={R} r={R - 4} fill={colorForIndex(i)} stroke={selected ? "#facc15" : "transparent"} strokeWidth={selected ? 8 : 0} /> :
                  <path d={slicePath(i, visible.length)} fill={colorForIndex(i)} stroke={selected ? "#facc15" : "#08111f"} strokeWidth={selected ? 7 : 2} style={selected ? { filter: "drop-shadow(0 0 12px #facc15)" } : undefined} />}
                <text x={pos.x} y={pos.y} fill="#0b1220" fontSize={visible.length > 10 ? 10 : visible.length === 1 ? 18 : 13} fontWeight={800} textAnchor="middle" dominantBaseline="middle" transform={`rotate(${mid} ${pos.x} ${pos.y})`}>
                  {choice.label.length > 14 ? choice.label.slice(0, 13) + "…" : choice.label}
                </text>
              </g>
            })}
          </svg>
        </div>
        <div className="pointer-events-none absolute left-1/2 top-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-background text-xs font-bold text-muted-foreground ring-4 ring-border">{visible.length}</div>
      </div>
      <button type="button" onClick={spin} disabled={spinning || !choices.length} className="mt-6 rounded-full bg-gradient-to-r from-primary to-sky-500 px-8 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">
        {spinning ? "Girando..." : !choices.length ? "Sem opções para sortear" : buttonLabel}
      </button>
      <label className="mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs text-muted-foreground ring-1 ring-border">
        <Volume2 className="size-3.5" /> Som da roleta
        <select value={sound} onChange={(event) => onSoundChange(event.target.value as RouletteSound)} disabled={spinning} className="rounded-md bg-background px-2 py-1 font-semibold text-foreground outline-none disabled:opacity-50">
          <option value="classic">Clássico</option>
          <option value="casino">Cassino</option>
          <option value="arcade">Arcade</option>
          <option value="silent">Sem som</option>
        </select>
      </label>
    </div>
  )
}
