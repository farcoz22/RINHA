"use client"

import { useState } from "react"
import { Download, FileSpreadsheet, LockKeyhole } from "lucide-react"
import { PasswordDialog } from "@/components/password-dialog"

export function PaymentExport() {
  const [open, setOpen] = useState(false)
  const [adminError, setAdminError] = useState<string | null>(null)
  const [adminBusy, setAdminBusy] = useState(false)

  async function exportPayments(password: string) {
    const response = await fetch("/api/history/export", {
      method: "POST",
      headers: { "content-type": "application/json", "x-export-password": password },
      body: JSON.stringify({}),
    })
    if (!response.ok) {
      const result = (await response.json().catch(() => ({}))) as { error?: string }
      throw new Error(result.error ?? "Senha incorreta ou erro na exportação")
    }
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `pagamentos-rinhas-${new Date().toISOString().slice(0, 10)}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  async function confirmExport(password: string) {
    setAdminBusy(true)
    setAdminError(null)
    try {
      await exportPayments(password)
      setOpen(false)
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : "Não foi possível concluir")
    } finally {
      setAdminBusy(false)
    }
  }

  return (
    <section className="rounded-3xl border border-border bg-card/60 p-4 backdrop-blur sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30">
            <FileSpreadsheet className="size-5" />
          </span>
          <div className="min-w-0">
            <h2 className="font-bold">Exportar pagamentos</h2>
            <p className="text-xs text-muted-foreground">Baixe todas as rinhas salvas em um único arquivo protegido.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => { setAdminError(null); setOpen(true) }}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-500 px-4 text-xs font-bold text-white transition hover:bg-emerald-400"
        >
          <LockKeyhole className="size-4" /> <Download className="size-4" /> Exportar arquivo
        </button>
      </div>
      <PasswordDialog
        open={open}
        title="Exportar pagamentos"
        description="Digite a senha para baixar o arquivo com todas as rinhas e dados de pagamento."
        error={adminError}
        busy={adminBusy}
        onConfirm={confirmExport}
        onClose={() => {
          if (!adminBusy) setOpen(false)
        }}
      />
    </section>
  )
}
