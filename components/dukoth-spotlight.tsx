import { ExternalLink, Flame, Play, Radio, Shield, Swords } from "lucide-react"

const TWITCH_URL = "https://www.twitch.tv/dukoth"

export function DukothSpotlight() {
  return <section className="dukoth-spotlight">
    <img src="/dukoth/twitch-banner.webp" alt="" className="dukoth-spotlight__backdrop" />
    <div className="dukoth-spotlight__shade" />
    <div className="dukoth-spotlight__content">
      <div className="dukoth-channel-emblem" aria-label="Personagem e marca exibidos no banner oficial do canal Dukoth">
        <img src="/dukoth/twitch-banner.webp" alt="Personagem e marca Dukoth do banner oficial da Twitch" />
      </div>
      <div>
        <p className="dukoth-eyebrow">HIGH ONION CORPORATION · AO VIVO</p>
        <h2>Dukoth</h2>
        <p className="dukoth-tagline">Do frango à fibra.</p>
      </div>
      <a href={TWITCH_URL} target="_blank" rel="noreferrer" className="dukoth-watch"><Play className="size-4 fill-current" /> Assistir na Twitch <ExternalLink className="size-3.5" /></a>
    </div>
    <div className="dukoth-spotlight__info">
      <p>Hunts, desafios, resenha e sorteios com a comunidade. Cada bilhete entra no painel como um aventureiro da guild.</p>
      <div>
        <Badge icon={<Swords />}>Tibia</Badge>
        <Badge icon={<Shield />}>Guild</Badge>
        <Badge icon={<Flame />}>Hunts</Badge>
        <Badge icon={<Radio />}>Ao vivo</Badge>
      </div>
    </div>
  </section>
}

function Badge({ children, icon }: { children: React.ReactNode; icon: React.ReactNode }) {
  return <span className="dukoth-badge">{icon}{children}</span>
}
