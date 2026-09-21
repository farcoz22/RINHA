"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Volume2, VolumeX } from "lucide-react"
import { colorForIndex } from "@/lib/format"

export interface WheelName {
  id: string
  username: string
  eventName: string
  fields: { label: string; value: string; sensitive: boolean }[]
}

interface RouletteProps {
  names: WheelName[]
  onEliminated: (name: WheelName) => void
  disabled?: boolean
}

const SIZE = 320
const R = SIZE / 2

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const a = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }
}

function slicePath(index: number, total: number) {
  const slice = 360 / total
  const start = index * slice
  const end = start + slice
  const p1 = polar(R, R, R, start)
  const p2 = polar(R, R, R, end)
  const largeArc = slice > 180 ? 1 : 0
  return `M ${R} ${R} L ${p1.x} ${p1.y} A ${R} ${R} 0 ${largeArc} 1 ${p2.x} ${p2.y} Z`
}

export function Roulette({ names, onEliminated, disabled }: RouletteProps) {
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [soundOn, setSoundOn] = useState(true)
  const [spinNames, setSpinNames] = useState<WheelName[]>(names)
  const [landedId, setLandedId] = useState<string | null>(null)
  const rotationRef = useRef(0)
  const audioCtxRef = useRef<AudioContext | null>(null)

  const total = names.length
  const displayedNames = spinning || landedId ? spinNames : names
  const displayedTotal = displayedNames.length

  const tick = useCallback(() => {
    if (!soundOn || typeof window === "undefined") return
    try {
      audioCtxRef.current ??= new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      const ctx = audioCtxRef.current
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = "square"
      osc.frequency.value = 520
      gain.gain.setValueAtTime(0.05, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06)
      osc.connect(gain).connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.06)
    } catch {
      /* áudio é opcional */
    }
  }, [soundOn])

  const spin = useCallback(() => {
    if (spinning || total === 0 || disabled) return
    const currentNames = [...names]
    setSpinNames(currentNames)
    setLandedId(null)
    setSpinning(true)

    const winnerIndex = Math.floor(Math.random() * total)
    const slice = 360 / total
    const winnerCenter = winnerIndex * slice + slice / 2
    // A primeira fatia começa no topo. Traz o centro sorteado exatamente ao ponteiro.
    const current = ((rotationRef.current % 360) + 360) % 360
    const base = rotationRef.current - current
    let target = base - winnerCenter
    target += 360 * 6 // voltas extras para dar emoção
    if (target <= rotationRef.current) target += 360

    rotationRef.current = target
    setRotation(target)

    // tique-taque durante o giro
    const ticks = window.setInterval(tick, 90)
    window.setTimeout(() => {
      window.clearInterval(ticks)
      setSpinning(false)
      setLandedId(currentNames[winnerIndex].id)
      onEliminated(currentNames[winnerIndex])
    }, 4200)
  }, [spinning, total, disabled, tick, onEliminated, names])

  useEffect(() => {
    rotationRef.current = rotation
  }, [rotation])

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: SIZE, maxWidth: "100%" }}>
        {/* ponteiro */}
        <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1">
          <div
            className="size-0"
            style={{
              borderLeft: "16px solid transparent",
              borderRight: "16px solid transparent",
              borderTop: "24px solid var(--accent)",
              filter: "drop-shadow(0 2px 6px rgba(0,0,0,.5))",
            }}
          />
        </div>

        <div
          className="aspect-square w-full rounded-full ring-4 ring-border"
          style={{ boxShadow: "0 0 60px oklch(0.62 0.19 258 / 0.25)" }}
        >
          <svg
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            className="size-full"
            style={{
              transform: `rotate(${rotation}deg)`,
              transformOrigin: "center",
              transition: spinning ? "transform 4.2s cubic-bezier(0.15, 0.9, 0.2, 1)" : "none",
            }}
          >
            {displayedTotal === 0 ? (
              <circle cx={R} cy={R} r={R - 2} fill="var(--muted)" />
            ) : (
              displayedNames.map((n, i) => {
                const slice = 360 / displayedTotal
                const mid = i * slice + slice / 2
                const labelPos = polar(R, R, R * 0.62, mid)
                const selected = landedId === n.id
                return (
                  <g key={n.id}>
                    {displayedTotal === 1 ? (
                      <circle
                        cx={R}
                        cy={R}
                        r={R - 4}
                        fill={colorForIndex(i)}
                        stroke={selected ? "#facc15" : "transparent"}
                        strokeWidth={selected ? 8 : 0}
                      />
                    ) : (
                      <path
                        d={slicePath(i, displayedTotal)}
                        fill={colorForIndex(i)}
                        opacity={selected ? 1 : 0.92}
                        stroke={selected ? "#facc15" : "#08111f"}
                        strokeWidth={selected ? 7 : 2}
                        style={selected ? { filter: "drop-shadow(0 0 12px #facc15)" } : undefined}
                      />
                    )}
                    <text
                      x={labelPos.x}
                      y={labelPos.y}
                      fill="#0b1220"
                      fontSize={displayedTotal > 10 ? 10 : displayedTotal === 1 ? 18 : 13}
                      fontWeight={800}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      transform={`rotate(${mid} ${labelPos.x} ${labelPos.y})`}
                    >
                      {n.username.length > 14 ? n.username.slice(0, 13) + "…" : n.username}
                    </text>
                  </g>
                )
              })
            )}
          </svg>
        </div>

        {/* centro */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-background text-xs font-bold text-muted-foreground ring-4 ring-border">
          {displayedTotal}
        </div>
      </div>

      <div className="mt-6 flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={spin}
          disabled={spinning || total === 0 || disabled}
          className="rounded-full bg-gradient-to-r from-primary to-sky-500 px-8 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {spinning ? "Girando..." : total === 0 ? "Sem nomes na roleta" : "Girar a roleta"}
        </button>

        <button
          type="button"
          onClick={() => setSoundOn((s) => !s)}
          className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium text-muted-foreground ring-1 ring-border transition hover:text-foreground"
        >
          {soundOn ? <Volume2 className="size-3.5" /> : <VolumeX className="size-3.5" />}
          Som roleta: {soundOn ? "ON" : "OFF"}
        </button>
      </div>
    </div>
  )
}
