import { ExternalLink, Play, Radio, Sparkles, Trophy } from "lucide-react"

const TWITCH_URL = "https://www.twitch.tv/dukoth"

export function DukothSpotlight() {
  return <section className="relative overflow-hidden rounded-3xl border border-amber-400/30 bg-card/70 shadow-2xl shadow-amber-500/10">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(251,191,90,.2),transparent_37%),radial-gradient(circle_at_90%_80%,rgba(31,201,183,.16),transparent_35%)]" />
    <div className="relative grid lg:grid-cols-[.9fr_1.1fr]">
      <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
        <div className="flex items-center gap-4">
          <img src="/dukoth/mark.svg" alt="Marca do painel Dukoth" className="size-24 rounded-3xl ring-4 ring-amber-400/40 sm:size-28" />
          <div className="min-w-0">
            <p className="text-xs font-bold tracking-[.24em] text-amber-300 uppercase">Ao vivo na Twitch</p>
            <h2 className="mt-1 text-3xl font-black sm:text-4xl">Dukoth</h2>
            <p className="mt-1 text-sm text-muted-foreground">Sorteios, filas e batalhas da comunidade</p>
          </div>
        </div>
        <p className="mt-6 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">Acompanhe quem entra na rodada, o sorteio da vez e a premiação. As filas vêm da conta Rhyno configurada para este painel.</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Badge icon={<Trophy className="size-3.5" />}>Batalhas</Badge>
          <Badge icon={<Sparkles className="size-3.5" />}>Sorteios</Badge>
          <Badge icon={<Radio className="size-3.5" />}>Ao vivo</Badge>
        </div>
        <a href={TWITCH_URL} target="_blank" rel="noreferrer" className="mt-6 inline-flex h-12 w-fit items-center gap-2 rounded-xl bg-amber-500 px-5 text-sm font-extrabold text-slate-950 shadow-lg shadow-amber-500/20 transition hover:-translate-y-0.5 hover:bg-amber-400"><Play className="size-4 fill-current" /> Assistir na Twitch <ExternalLink className="size-3.5" /></a>
      </div>
      <div className="relative min-h-[290px] overflow-hidden bg-[#0c1a2d] lg:min-h-[390px]">
        <div className="absolute inset-0 bg-[url('/visual/confronto-original.webp')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#101625] via-transparent to-[#10162555]" />
        <div className="absolute inset-x-5 bottom-5 flex items-center justify-between gap-3 rounded-xl border border-amber-300/40 bg-slate-950/75 p-4 backdrop-blur">
          <span className="text-sm font-black tracking-wide text-amber-200">DUKOTH · AO VIVO</span>
          <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-bold text-emerald-200">PRÓXIMA RODADA</span>
        </div>
      </div>
    </div>
  </section>
}

function Badge({ children, icon }: { children: React.ReactNode; icon: React.ReactNode }) {
  return <span className="inline-flex items-center gap-1.5 rounded-full bg-background/60 px-3 py-1.5 text-xs font-bold ring-1 ring-border">{icon}{children}</span>
}
