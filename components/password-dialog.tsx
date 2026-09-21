"use client"

import { useEffect, useState } from "react"
import { LockKeyhole, X } from "lucide-react"

export function PasswordDialog({
  open,
  title,
  description,
  error,
  busy = false,
  onConfirm,
  onClose,
}: {
  open: boolean
  title: string
  description: string
  error?: string | null
  busy?: boolean
  onConfirm: (password: string) => void | Promise<void>
  onClose: () => void
}) {
  const [password, setPassword] = useState("")

  useEffect(() => {
    if (open) setPassword("")
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="password-dialog-title"
        className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-accent uppercase">
              <LockKeyhole className="size-4" /> Área protegida
            </p>
            <h3 id="password-dialog-title" className="mt-2 text-lg font-bold">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Fechar" className="rounded-lg p-2 text-muted-foreground hover:bg-secondary disabled:opacity-40">
            <X className="size-4" />
          </button>
        </div>

        <form
          className="mt-5"
          onSubmit={(event) => {
            event.preventDefault()
            if (password) void onConfirm(password)
          }}
        >
          <label className="text-xs font-semibold text-muted-foreground" htmlFor="admin-password">Senha administrativa</label>
          <input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            autoFocus
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Digite sua senha"
            className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <p className="mt-2 text-xs text-muted-foreground">Os caracteres ficam ocultos e a senha não é salva no navegador.</p>
          {error && <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={onClose} disabled={busy} className="h-10 rounded-xl px-4 text-sm font-semibold text-muted-foreground hover:bg-secondary disabled:opacity-40">Cancelar</button>
            <button type="submit" disabled={!password || busy} className="h-10 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground disabled:opacity-40">
              {busy ? "Verificando..." : "Confirmar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
