import { ExternalLink, Gamepad2, Play, Radio, Sparkles } from "lucide-react"

const TWITCH_URL = "https://www.twitch.tv/nuuhfps"

export function NuuhSpotlight() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-[#9147ff]/35 bg-card/70 shadow-2xl shadow-[#9147ff]/10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(145,71,255,.22),transparent_36%),radial-gradient(circle_at_90%_80%,rgba(34,211,238,.14),transparent_34%)]" />
      <div className="relative grid lg:grid-cols-[0.9fr_1.1fr]">
        <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-[#9147ff] to-cyan-400 opacity-80 blur-sm" />
              <img
                src="/nuuh/avatar.png"
                alt="Avatar oficial do canal NuuhFPS"
                width={112}
                height={112}
                className="relative size-24 rounded-full object-cover ring-4 ring-background sm:size-28"
              />
              <span className="absolute bottom-1 right-1 flex size-7 items-center justify-center rounded-full bg-[#9147ff] text-white ring-4 ring-background">
                <Radio className="size-3.5" />
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold tracking-[0.24em] text-[#bf94ff] uppercase">Canal oficial</p>
              <h2 className="mt-1 truncate text-3xl font-black sm:text-4xl">nuuhfps</h2>
              <p className="mt-1 text-sm text-muted-foreground">Gustavo Rocha · Uberlândia, MG</p>
            </div>
          </div>

          <p className="mt-6 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
            VALORANT, desafios, resenha e batalhas com a comunidade do Nuuhzão.
            Acompanhe as jogadas e participe da próxima rinha ao vivo.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <Badge icon={<Gamepad2 className="size-3.5" />}>VALORANT</Badge>
            <Badge icon={<Sparkles className="size-3.5" />}>Batalhas</Badge>
            <Badge icon={<Radio className="size-3.5" />}>Comunidade</Badge>
          </div>

          <a
            href={TWITCH_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex h-12 w-fit items-center gap-2 rounded-xl bg-[#9147ff] px-5 text-sm font-extrabold text-white shadow-lg shadow-[#9147ff]/25 transition hover:-translate-y-0.5 hover:bg-[#a970ff]"
          >
            <Play className="size-4 fill-current" /> Assistir na Twitch <ExternalLink className="size-3.5" />
          </a>
        </div>

        <div className="grid min-h-[300px] grid-cols-2 gap-2 p-3 lg:min-h-[390px]">
          <Highlight
            src="/nuuh/salve-desmaio.jpg"
            alt="NuuhFPS jogando VALORANT em sua transmissão"
            label="VALORANT"
            className="col-span-2"
          />
          <Highlight
            src="/nuuh/susto-obvio.jpg"
            alt="NuuhFPS jogando The Walking Dead em sua transmissão"
            label="The Walking Dead"
          />
          <a
            href={TWITCH_URL}
            target="_blank"
            rel="noreferrer"
            className="group flex min-h-28 flex-col items-center justify-center rounded-2xl border border-[#9147ff]/30 bg-[#9147ff]/10 p-4 text-center transition hover:bg-[#9147ff]/20"
          >
            <span className="flex size-11 items-center justify-center rounded-full bg-[#9147ff] text-white shadow-lg shadow-[#9147ff]/30 transition group-hover:scale-110">
              <Play className="ml-0.5 size-5 fill-current" />
            </span>
            <span className="mt-3 text-xs font-extrabold tracking-wide text-[#bf94ff] uppercase">Ver canal completo</span>
          </a>
        </div>
      </div>
    </section>
  )
}

function Badge({ children, icon }: { children: React.ReactNode; icon: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-background/60 px-3 py-1.5 text-xs font-bold ring-1 ring-border">
      {icon}{children}
    </span>
  )
}

function Highlight({ src, alt, label, className = "" }: { src: string; alt: string; label: string; className?: string }) {
  return (
    <a href={TWITCH_URL} target="_blank" rel="noreferrer" className={`group relative min-h-40 overflow-hidden rounded-2xl ${className}`}>
      <img src={src} alt={alt} className="absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
      <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-extrabold text-white backdrop-blur">
        <Play className="size-3 fill-current text-[#bf94ff]" /> {label}
      </span>
    </a>
  )
}
