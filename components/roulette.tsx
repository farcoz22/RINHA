"use client"

import { useEffect, useRef, useState } from "react"
import { CircleHelp, Volume2 } from "lucide-react"

export interface WheelChoice {
  id: string
  label: string
}

export type RouletteSound = "classic" | "casino" | "arcade" | "silent"
const SIZE = 320
const R = SIZE / 2
const DURATION = 5200
const CASINO_RED = "#b52c39"
const CASINO_BLACK = "#182026"

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
  autoSpin = false,
}: {
  choices: WheelChoice[]
  onSelected: (choice: WheelChoice) => void
  onSpinningChange?: (value: boolean) => void
  buttonLabel: string
  sound: RouletteSound
  onSoundChange: (sound: RouletteSound) => void
  autoSpin?: boolean
}) {
  const [rotation, setRotation] = useState(0)
  const [ballRotation, setBallRotation] = useState(0)
  const [duration, setDuration] = useState(DURATION)
  const [spinning, setSpinning] = useState(false)
  const [spinChoices, setSpinChoices] = useState(choices)
  const [landedId, setLandedId] = useState<string | null>(null)
  const rotationRef = useRef(0)
  const audioRef = useRef<AudioContext | null>(null)
  const tickTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const finishTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tickCount = useRef(0)
  const ballRotationRef = useRef(0)
  const onSelectedRef = useRef(onSelected)
  const onSpinningRef = useRef(onSpinningChange)
  const spinRef = useRef<() => void>(() => {})
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
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const effectiveDuration = reducedMotion ? 200 : DURATION
    setDuration(effectiveDuration)

    const random = new Uint32Array(1)
    window.crypto.getRandomValues(random)
    const selectedIndex = Math.floor((random[0] / 2 ** 32) * snapshot.length)
    const center = (selectedIndex + 0.5) * 360 / snapshot.length
    const base = rotationRef.current - ((rotationRef.current % 360) + 360) % 360
    let target = base - center + 360 * (reducedMotion ? 1 : 8)
    if (target <= rotationRef.current) target += 360
    rotationRef.current = target
    setRotation(target)
    if (!reducedMotion) ballRotationRef.current -= 360 * 11
    setBallRotation(ballRotationRef.current)

    tickCount.current = 0
    tick()
    if (!reducedMotion) tickTimer.current = setInterval(tick, sound === "casino" ? 155 : 105)
    finishTimer.current = setTimeout(() => {
      if (tickTimer.current) clearInterval(tickTimer.current)
      setSpinning(false)
      setLandedId(snapshot[selectedIndex].id)
      onSpinningRef.current?.(false)
      onSelectedRef.current(snapshot[selectedIndex])
    }, effectiveDuration)
  }

  spinRef.current = spin
  useEffect(() => {
    if (!autoSpin || !choices.length || spinning || landedId) return
    const timer = setTimeout(() => spinRef.current(), 1700)
    return () => clearTimeout(timer)
  }, [autoSpin, choices.length, spinning, landedId])

  const visible = spinning || landedId ? spinChoices : choices
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full max-w-[360px] p-4" aria-label={`Roleta com ${visible.length} opções`}>
        <div className="casino-wheel-frame relative aspect-square overflow-hidden rounded-full p-3">
          <div className="absolute inset-2 rounded-full border-2 border-amber-300/50" />
          <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="relative size-full rounded-full" style={{ transform: `rotate(${rotation}deg)`, transformOrigin: "center", transition: spinning ? `transform ${duration}ms cubic-bezier(0.12, 0.65, 0.18, 1)` : "none" }}>
            {!visible.length ? <circle cx={R} cy={R} r={R - 2} fill={CASINO_BLACK} /> : visible.map((choice, i) => {
              const mid = (i + 0.5) * 360 / visible.length
              const pos = polar(R * 0.67, mid)
              const selected = landedId === choice.id
              return <g key={choice.id}>
                {visible.length === 1 ? <circle cx={R} cy={R} r={R - 4} fill={CASINO_RED} stroke={selected ? "#facc15" : "transparent"} strokeWidth={selected ? 8 : 0} /> :
                  <path d={slicePath(i, visible.length)} fill={i % 2 ? CASINO_BLACK : CASINO_RED} stroke={selected ? "#facc15" : "#d2a75c"} strokeWidth={selected ? 5 : 1.5} style={selected ? { filter: "drop-shadow(0 0 12px #facc15)" } : undefined} />}
                <text x={pos.x} y={pos.y} fill="#fff8eb" fontSize={visible.length > 12 ? 9 : visible.length === 1 ? 18 : 12} fontWeight={800} textAnchor="middle" dominantBaseline="middle" transform={`rotate(${mid} ${pos.x} ${pos.y})`}>
                  {choice.label.length > 13 ? choice.label.slice(0, 12) + "…" : choice.label}
                </text>
              </g>
            })}
          </svg>
          <div className="pointer-events-none absolute inset-3 rounded-full border-[6px] border-amber-300/70 shadow-[inset_0_0_12px_#000]" />
          <div className="pointer-events-none absolute inset-3" style={{ transform: `rotate(${ballRotation}deg)`, transition: spinning ? `transform ${duration}ms cubic-bezier(0.17, 0.72, 0.2, 1)` : "none" }}>
            <div className="casino-ball absolute left-1/2 top-[2%] size-4 -translate-x-1/2 rounded-full" />
          </div>
          <div className="pointer-events-none absolute left-1/2 top-1/2 flex size-[22%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[5px] border-amber-400 bg-gradient-to-br from-amber-500 via-amber-950 to-amber-500 text-center text-[10px] font-black tracking-wide text-amber-50 shadow-[0_3px_16px_#000]">
            {spinning ? "GIRANDO" : landedId ? "SORTEADO" : "DUKOTH"}
          </div>
        </div>
        <div className="pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2 text-amber-300 drop-shadow-[0_2px_5px_#000]" aria-hidden="true">
          <div className="h-8 w-6 bg-amber-300 [clip-path:polygon(0_0,100%_0,50%_100%)]" />
        </div>
      </div>
      <button type="button" onClick={spin} disabled={spinning || !choices.length} className="mt-3 rounded-full bg-gradient-to-r from-amber-500 via-rose-600 to-rose-700 px-8 py-3 text-sm font-black text-white shadow-lg shadow-red-900/40 transition hover:scale-105 hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50">
        {spinning ? "Girando..." : !choices.length ? "Sem opções para sortear" : buttonLabel}
      </button>
      <details className="mt-3 w-full max-w-[340px] rounded-xl border border-border bg-background/40 px-3 py-2 text-xs text-muted-foreground">
        <summary className="flex cursor-pointer items-center gap-2 font-semibold"><CircleHelp className="size-3.5" /> {visible.length} opções na mesa · ver nomes</summary>
        <div className="mt-2 flex max-h-24 flex-wrap gap-1 overflow-auto">
          {visible.map((choice) => <span key={choice.id} className={`rounded-md px-2 py-1 ${landedId === choice.id ? "bg-amber-500/30 text-amber-200" : "bg-secondary text-foreground"}`}>{choice.label}</span>)}
        </div>
      </details>
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
