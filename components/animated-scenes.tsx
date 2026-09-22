"use client"

import { useEffect, useMemo, useState } from "react"
import { formatBRL } from "@/lib/format"
import { makeActors, sceneTeams, type SceneActor } from "@/lib/scene-model"
import type { LiveData } from "@/lib/types"

function Avatar({ actor, activity = "idle", size = "normal" }: { actor: SceneActor; activity?: "idle" | "walk" | "duel"; size?: "normal" | "small" }) {
  const skin = ["#442c26", "#603c2e", "#79503b", "#966444", "#b7815a", "#ce9a71", "#e3b48d", "#f3d2aa"][actor.skinTone]
  const hair = ["#1f2029", "#453126", "#6d4332", "#a77545", "#d8bd72", "#b46242", "#433f70", "#d3d8df"][actor.hairColor]
  const shirt = ["#35bfb1", "#df8271", "#9187dc", "#ebbf67", "#6baaeb", "#d179a9", "#8dc36e", "#b0a799"][actor.outfit]
  const trousers = ["#252c49", "#355370", "#69544b", "#536454", "#4e3c5b", "#222c32"][actor.pants]
  const hairPaths = [
    "M32 38 Q29 10 52 14 Q84 8 79 42 Q70 24 47 30Z",
    "M31 38 Q30 20 47 13 Q75 1 80 33 L77 49 Q65 24 39 35Z",
    "M33 40 Q35 19 51 19 Q75 14 79 37 Q69 24 46 32Z",
    "M33 38 Q32 15 56 14 Q82 13 77 42 Q67 27 45 31Z",
    "M31 40 Q25 29 34 19 Q43 9 53 18 Q64 6 74 19 Q87 22 78 42 Q63 27 46 34Z",
    "M30 42 Q25 18 50 13 Q81 7 81 42 L79 79 Q71 70 74 36 Q54 27 37 37 L36 76 Q25 65 30 42Z",
    "M32 35 Q38 13 60 17 Q78 17 79 34 Q59 28 32 35Z",
    "M30 42 Q30 18 52 14 Q82 11 79 39 Q61 24 40 34Z",
  ]
  return <div className={`scene-avatar scene-avatar--${activity} ${size === "small" ? "scene-avatar--small" : ""}`} style={{ "--avatar-hue": `${actor.hue}deg`, "--avatar-delay": `${-((actor.hue % 13) / 8)}s` } as React.CSSProperties} aria-label={`${actor.name}, personagem do bilhete na equipe ${actor.team}`}>
    <span className="scene-plumbob" aria-hidden="true" />
    <svg viewBox="0 0 110 164" role="img" aria-label={`Personagem de ${actor.name}`}>
      <ellipse cx="55" cy="157" rx="30" ry="5" fill="#0a182950" />
      <path d="M42 113 L40 151 L54 151 L58 114 M61 113 L65 151 L80 151 L73 108" stroke={trousers} strokeWidth="15" strokeLinecap="round" />
      <path d="M36 66 Q53 55 75 67 L78 116 Q55 125 34 115Z" fill={shirt} stroke="#1c3044" strokeWidth="3" />
      {actor.outfit % 2 === 0 ? <path d="M47 62 L55 79 L64 62 M54 78 L54 117" fill="none" stroke="#fff9" strokeWidth="3" /> : <path d="M38 72 Q55 83 73 72 M42 95 L68 95" fill="none" stroke="#24243f88" strokeWidth="4" />}
      <path d="M35 71 Q20 81 25 110 M75 70 Q91 85 84 109" fill="none" stroke={skin} strokeWidth="12" strokeLinecap="round" />
      {actor.hairstyle === 7 && <path d="M75 28 Q104 39 89 71" fill="none" stroke={hair} strokeWidth="13" strokeLinecap="round" />}
      <circle cx="55" cy="43" r="23" fill={skin} stroke="#473129" strokeWidth="2" />
      {actor.hairstyle === 2 && <circle cx="57" cy="13" r="13" fill={hair} />}
      <path d={hairPaths[actor.hairstyle]} fill={hair} />
      {actor.hairstyle === 3 && <path d="M34 33 Q24 61 32 77 M76 34 Q89 65 80 78" fill="none" stroke={hair} strokeWidth="7" strokeLinecap="round" />}
      {actor.accessory === 1 && <path d="M37 42 H53 M58 42 H74 M52 42 H59" fill="none" stroke="#142935" strokeWidth="3" />}
      {actor.accessory === 2 && <circle cx="76" cy="58" r="4" fill="#f6d47b" />}
      {actor.accessory === 3 && <path d="M35 29 Q54 23 77 29" fill="none" stroke="#fddeb6" strokeWidth="4" />}
      {actor.accessory === 4 && <path d="M29 27 Q46 6 69 13 L83 25 Q56 22 29 27Z" fill="#273b50" stroke="#bedfe2" strokeWidth="2" />}
      <circle cx="47" cy="45" r="2" fill="#263040" /><circle cx="64" cy="45" r="2" fill="#263040" />
      <path d="M49 55 Q56 60 63 55" stroke="#704c40" fill="none" strokeWidth="2" />
      <path d="M28 106 L28 119 M85 106 L85 119" stroke={skin} strokeWidth="7" strokeLinecap="round" />
      <path d="M40 151 L54 151 M66 151 L81 151" stroke="#151d2b" strokeWidth="9" strokeLinecap="round" />
    </svg>
    <span className="scene-avatar-name">{actor.name}</span>
  </div>
}

export function AnimatedScenes({ live, mode }: { live: LiveData; mode: "neighborhood" | "arena" }) {
  const actors = useMemo(() => makeActors(live.participants, live.recentDonations), [live.participants, live.recentDonations])
  const teams = useMemo(() => sceneTeams(live.battleGroups, actors), [live.battleGroups, actors])
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const clock = window.setInterval(() => setTick((previous) => previous + 1), 6500)
    return () => window.clearInterval(clock)
  }, [])

  const active = teams[tick % (teams.length || 1)]
  const next = teams[(tick + 1) % (teams.length || 1)]
  const visibleTeams = Array.from({ length: Math.min(4, teams.length) }, (_, index) => teams[(tick + index) % teams.length])
  const teamRound = Math.floor(tick / (teams.length || 1))
  const current = active?.actors[teamRound % active.actors.length]
  const visibleActors = active ? Array.from({ length: Math.min(4, active.actors.length) }, (_, index) => active.actors[(teamRound + index) % active.actors.length]) : []
  const rival = teams.length > 1
      ? next?.actors[teamRound % (next.actors.length || 1)]
      : active && active.actors.length > 1
      ? active.actors[(teamRound + 1) % active.actors.length]
      : null
  const contribution = actors.reduce((total, actor) => total + actor.ticketAmount, 0)
  const sceneTitle = mode === "neighborhood" ? "Vila da fila" : "Arena dos bilhetes"

  return <section className="scene-shell" aria-label={`${sceneTitle}, animação automática dos bilhetes`}>
    <div className="scene-topbar"><div><span className="scene-overline">SIMULAÇÃO AO VIVO · SEM CLIQUES</span><h2>{sceneTitle}</h2></div><span className="scene-online"><i /> ATUALIZAÇÃO AUTOMÁTICA</span></div>
    {actors.length === 0 ? <div className="scene-empty">Aguardando bilhetes. Os personagens entrarão na cena quando houver pessoas na fila.</div> : mode === "neighborhood" ? <div className="scene-world scene-world--village">
      <div className="scene-sky"><span className="scene-sun" /><span className="scene-cloud" /><span className="scene-cloud scene-cloud--second" /></div>
      <div className="scene-hills" /><div className="scene-ground" /><div className="scene-road" />
      {visibleTeams.map((team, index) => <div key={team.id} className={`scene-home scene-home--${index + 1} ${team.id === active?.id ? "scene-home--active" : ""}`}>
        <div className="scene-home-roof" /><span className="scene-home-window" /><span className="scene-home-door" /><span className="scene-home-sign">{team.name}</span><small>{team.actors.length} {team.actors.length === 1 ? "bilhete" : "bilhetes"}</small>
      </div>)}
      <div className="scene-village-actors" key={`${active?.id}-${tick}`}>
        {visibleActors.map((actor) => <Avatar key={actor.id} actor={actor} activity="walk" />)}
      </div>
      <div className="scene-event" aria-live="polite"><strong>{current?.name}</strong><span> saiu de {active?.name} para explorar a vila · nível {current?.level}</span></div>
    </div> : <div className="scene-world scene-world--arena">
      <div className="scene-arena-grid" /><div className="scene-arena-glow" />
      <div className="scene-arena-banner">CONFRONTO VISUAL <span>Rodada {String(tick + 1).padStart(2, "0")}</span></div>
      <div className="scene-fighter scene-fighter--left" key={`${current?.id}-${tick}`}><Avatar actor={current ?? actors[0]} activity="duel" /><strong>{active?.name}</strong></div>
      <div className="scene-impact">VS<span>✦</span></div>
      <div className="scene-fighter scene-fighter--right" key={`${rival?.id}-${tick}`}>{rival ? <Avatar actor={rival} activity="duel" /> : <div className="scene-practice-target" aria-label="Alvo de treino">◎</div>}<strong>{rival ? next?.name : "TREINO"}</strong></div>
      <div className="scene-arena-feed">{current?.name} <span>{rival ? "encontra" : "treina com"}</span> {rival?.name ?? "o alvo"} <span>na próxima cena</span></div>
    </div>}
    <div className="scene-bottom"><div><span>NA CENA</span><b>{active?.name ?? "Aguardando"}</b></div><div><span>BILHETES</span><b>{actors.length}</b></div><div><span>ENTRADAS DA FILA</span><b>{formatBRL(contribution)}</b></div><div><span>PRÓXIMA EQUIPE</span><b>{next?.name ?? "Aguardando"}</b></div></div>
    <div className="scene-roster"><span className="scene-roster-title">PERSONAGENS DOS BILHETES · {teams.length} {teams.length === 1 ? "EQUIPE" : "EQUIPES"}</span>{teams.length > 4 && <span className="scene-rotation-note">Casas e bilhetes alternam automaticamente para mostrar todos.</span>}<div>{actors.map((actor) => <div className="scene-roster-card" key={actor.id}><Avatar actor={actor} size="small" /><span><strong>{actor.name}</strong><small>{actor.team} · {formatBRL(actor.ticketAmount)} · {actor.donationXP} XP recente</small></span></div>)}</div></div>
    <p className="scene-disclaimer">Animação ilustrativa. As cenas não determinam o vencedor nem alteram a premiação. XP considera somente doações pagas recentes com nome único.</p>
  </section>
}
