"use client"

import { useState } from "react"
import { Dice5, LockKeyhole } from "lucide-react"

export function AccessGate() {
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function enter(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const response = await fetch("/api/access", {
        method: "POST",
        headers: { "x-export-password": password },
      })
      const result = (await response.json()) as { ok?: boolean; error?: string }
      if (!response.ok || !result.ok) throw new Error(result.error ?? "Senha incorreta")
      window.location.reload()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível entrar")
      setBusy(false)
    }
  }

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#07111f] p-4 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,#7f1d1d55,transparent_35%),radial-gradient(circle_at_20%_80%,#b4530933,transparent_30%)]" />
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-amber-400/35 bg-[#0d192b]/95 p-6 text-center shadow-[0_24px_90px_#000] sm:p-8">
        <div
          className="mx-auto size-28 rounded-full border-4 border-amber-400 bg-cover bg-center shadow-[0_0_35px_#f59e0b55]"
          style={{ backgroundImage: "url('/nuuh/roulette-meme.webp')" }}
          role="img"
          aria-label="Nuuh surpreso com o resultado da roleta"
        />
        <p className="mt-5 text-xs font-black tracking-[0.28em] text-amber-300 uppercase">Área protegida</p>
        <h1 className="mt-2 text-3xl font-black">Batalhas do Nuuhzão</h1>
        <p className="mt-2 text-sm text-slate-400">Digite a senha para acessar a roleta, os potes e o fechamento das apostas.</p>

        <form className="mt-6 text-left" onSubmit={enter}>
          <label htmlFor="site-password" className="text-xs font-bold text-slate-300">Senha de acesso</label>
          <div className="relative mt-2">
            <LockKeyhole className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-amber-300" />
            <input
              id="site-password"
              type="password"
              autoComplete="current-password"
              autoFocus
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Digite a senha"
              className="h-12 w-full rounded-xl border border-white/15 bg-black/25 pl-10 pr-4 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
            />
          </div>
          {error && <p className="mt-3 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
          <button type="submit" disabled={!password || busy} className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-red-600 text-sm font-black shadow-lg shadow-red-950/50 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">
            <Dice5 className="size-5" /> {busy ? "Verificando..." : "Entrar nas batalhas"}
          </button>
        </form>
        <p className="mt-5 text-[11px] text-slate-500">A senha fica oculta e não é salva no navegador.</p>
      </div>
    </main>
  )
}
