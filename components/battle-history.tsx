"use client"

import useSWR from "swr"
import { Check, Download, History, LockKeyhole } from "lucide-react"
import type { BattleHistoryItem } from "@/lib/types"
import { formatBRL } from "@/lib/format"

const fetcher = (url: string) => fetch(url).then((response) => response.json())

export function BattleHistory({ refreshKey = 0 }: { refreshKey?: number }) {
  const { data, mutate, isLoading } = useSWR<{ history: BattleHistoryItem[]; error?: string }>(
    `/api/history?refresh=${refreshKey}`,
    fetcher,
  )
  const history = data?.history ?? []

  async function exportPayments(battleId?: string) {
    const password = window.prompt("Digite a senha para exportar os pagamentos:")
    if (!password) return
    const response = await fetch("/api/history/export", {
      method: "POST",
      headers: { "content-type": "application/json", "x-export-password": password },
      body: JSON.stringify({ battleId }),
    })
    if (!response.ok) {
      const result = (await response.json().catch(() => ({}))) as { error?: string }
      window.alert(result.error ?? "Senha incorreta ou erro na exportação")
      return
    }
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `pagamentos-rinhas-${new Date().toISOString().slice(0, 10)}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  async function markPaid(paymentId: string, paid: boolean) {
    const password = window.prompt("Digite a senha administrativa:")
    if (!password) return
    const response = await fetch("/api/history/payments", {
      method: "PATCH",
      headers: { "content-type": "application/json", "x-export-password": password },
      body: JSON.stringify({ paymentId, paid }),
    })
    const result = (await response.json()) as { error?: string }
    if (!response.ok) return window.alert(result.error ?? "Não foi possível atualizar")
    await mutate()
  }

  return (
    <section className="rounded-3xl border border-border bg-card/60 p-6 backdrop-blur lg:col-span-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.3em] text-accent uppercase">
            <History className="size-3.5" /> Histórico
          </p>
          <h2 className="mt-1 text-2xl font-bold">Rinhas e pagamentos</h2>
          <p className="mt-1 text-sm text-muted-foreground">Dados sensíveis aparecem somente no arquivo protegido.</p>
        </div>
        <button
          type="button"
          onClick={() => exportPayments()}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-secondary px-4 text-xs font-bold text-secondary-foreground"
        >
          <LockKeyhole className="size-4" /> <Download className="size-4" /> Exportar tudo
        </button>
      </div>

      {data?.error && <p className="mt-4 text-sm text-amber-400">{data.error}</p>}
      {isLoading && <p className="mt-4 text-sm text-muted-foreground">Carregando histórico...</p>}
      {!isLoading && history.length === 0 && !data?.error && (
        <p className="mt-4 text-sm text-muted-foreground">Nenhuma rinha finalizada ainda.</p>
      )}

      <div className="mt-5 flex flex-col gap-4">
        {history.map((battle) => {
          const paid = battle.payments.filter((payment) => payment.status === "PAID").length
          return (
            <article key={battle.id} className="rounded-2xl border border-border bg-background/40 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold">{battle.groupName} · {battle.winnerEventName}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(battle.closedAt).toLocaleString("pt-BR")} · {paid}/{battle.payments.length} pagos
                  </p>
                </div>
                <button type="button" onClick={() => exportPayments(battle.id)} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold ring-1 ring-border">
                  <Download className="size-3.5" /> Exportar
                </button>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Mini label="Entradas" value={formatBRL(battle.entryTotal)} />
                <Mini label="Pote bruto" value={formatBRL(battle.grossPool)} />
                <Mini label="Taxa de 15%" value={formatBRL(battle.fee)} />
                <Mini label="Pote líquido" value={formatBRL(battle.netPool)} highlight />
              </div>

              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-xs">
                  <thead className="text-muted-foreground"><tr><th className="p-2">Vencedor</th><th className="p-2">Bilhetes</th><th className="p-2">A pagar</th><th className="p-2">Status</th><th className="p-2 text-right">Ação</th></tr></thead>
                  <tbody>
                    {battle.payments.map((payment) => (
                      <tr key={payment.id} className="border-t border-border">
                        <td className="p-2 font-semibold">{payment.username}</td>
                        <td className="p-2">{payment.quantity}</td>
                        <td className="p-2 font-bold text-emerald-400">{formatBRL(payment.prize)}</td>
                        <td className="p-2">{payment.status === "PAID" ? "Pago" : "Pendente"}</td>
                        <td className="p-2 text-right">
                          <button type="button" onClick={() => markPaid(payment.id, payment.status !== "PAID")} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 ring-1 ring-border">
                            <Check className="size-3" /> {payment.status === "PAID" ? "Desfazer" : "Marcar pago"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function Mini({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return <div className="rounded-xl bg-card/60 p-3"><p className="text-[11px] text-muted-foreground">{label}</p><p className={"mt-1 font-extrabold " + (highlight ? "text-emerald-400" : "")}>{value}</p></div>
}
