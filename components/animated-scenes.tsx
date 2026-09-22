"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { formatBRL } from "@/lib/format"
import { makeActors, sceneTeams, type SceneActor } from "@/lib/scene-model"
import type { LiveData } from "@/lib/types"
import { getGameDescription, getPublicGameChoices } from "@/lib/roulette-games"
import type { WheelChoice } from "@/components/roulette"

type SceneTeam = ReturnType<typeof sceneTeams>[number]
type VillagePhase = "team" | "person" | "game" | "finished"
export type VillageResult = { groupId: string; teamId: string; personId: string; game: WheelChoice | null }

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
  return <div className={`scene-avatar scene-avatar--${activity} ${size === "small" ? "scene-avatar--small" : ""}`} style={{ "--avatar-hue": `${actor.hue}deg`, "--avatar-delay": `${-((actor.hue % 13) / 8)}s` } as React.CSSProperties} aria-label={`${actor.displayName}, personagem do bilhete na equipe ${actor.team}`}>
    <span className="scene-plumbob" aria-hidden="true" />
    <svg viewBox="0 0 110 164" role="img" aria-label={`Personagem de ${actor.displayName}`}>
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
    <span className="scene-avatar-name">{actor.displayName}</span>
  </div>
}

function AgentPortrait({ actor, frame = 0, small = false }: { actor: SceneActor; frame?: number; small?: boolean }) {
  return <div className={`scene-agent-portrait ${small ? "scene-agent-portrait--small" : ""}`} style={{ backgroundPosition: `${frame % 2 ? 100 : 0}% ${frame > 1 ? 100 : 0}%` }} role="img" aria-label={`Agente tático original representando o bilhete de ${actor.displayName}`}><span>{actor.displayName}</span></div>
}

const squadLines = [
  "Será que o Nuuh vai deixar nós vendo a cadeira novamente?",
  "Que hora começa isso?",
  "Que demora para pagar!",
  "Tem como já pagar meu bônus?",
  "Só sei ir veio do raio.",
]

function VillageDraw({ live, actors, teams, onResult, variant = "casino" }: { live: LiveData; actors: SceneActor[]; teams: SceneTeam[]; onResult?: (value: VillageResult) => void; variant?: "casino" | "squad" }) {
  const [phase, setPhase] = useState<VillagePhase>("team")
  const [teamId, setTeamId] = useState<string | null>(null)
  const [personId, setPersonId] = useState<string | null>(null)
  const [game, setGame] = useState<WheelChoice | null>(null)
  const [automatic, setAutomatic] = useState(false)
  const [drawing, setDrawing] = useState(false)
  const [highlight, setHighlight] = useState<string | null>(null)
  const [round, setRound] = useState(0)
  const [carousel, setCarousel] = useState(0)
  const [requestedTeam, setRequestedTeam] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const sceneRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])
  useEffect(() => {
    const clock = window.setInterval(() => setCarousel((value) => value + 1), 3700)
    return () => clearInterval(clock)
  }, [])

  const team = teams.find((item) => item.id === teamId) ?? null
  const people = team?.actors ?? []
  const person = people.find((item) => item.id === personId) ?? null
  const participant = live.participants.find((item) => item.id === personId) ?? null
  const games = useMemo(() => getPublicGameChoices(participant), [participant])
  const gameDescription = getGameDescription(participant, game)
  const activeIndex = team ? teams.findIndex((item) => item.id === team.id) : carousel % (teams.length || 1)
  const visibleTeams = Array.from({ length: Math.min(4, teams.length) }, (_, index) => teams[(activeIndex + index) % teams.length])
  const peopleStart = carousel % (people.length || 1)
  const visiblePeople = people.length ? Array.from({ length: Math.min(4, people.length) }, (_, index) => people[(peopleStart + index) % people.length]) : []
  const representatives = teams.map((item) => item.actors[carousel % item.actors.length])
  const extraActors = actors.filter((actor) => !representatives.some((item) => item.id === actor.id))
  const squadRoster = phase === "team"
    ? teams.length > 6
      ? Array.from({ length: 6 }, (_, index) => representatives[(carousel + index) % representatives.length])
      : [...representatives, ...Array.from({ length: Math.min(6 - representatives.length, extraActors.length) }, (_, index) => extraActors[(carousel + index) % extraActors.length])]
    : people.length ? Array.from({ length: Math.min(6, people.length) }, (_, index) => people[(carousel + index) % people.length]) : []
  const contribution = actors.reduce((total, actor) => total + actor.ticketAmount, 0)
  const options: WheelChoice[] = phase === "team"
    ? teams.map((item) => ({ id: item.id, label: item.name }))
    : phase === "person"
      ? people.map((item) => ({ id: item.id, label: item.displayName }))
      : phase === "game" ? games : []
  const phaseName = { team: "equipe", person: "pessoa", game: "jogo", finished: "resultado" }[phase]

  function nextRandom(max: number) {
    const values = new Uint32Array(1)
    window.crypto.getRandomValues(values)
    return Math.floor((values[0] / 2 ** 32) * max)
  }
  function groupFor(eventId: string) {
    return live.battleGroups.find((group) => group.events.some((event) => event.id === eventId))?.id ?? "__solo__"
  }
  function finish(selectedTeamId: string, selectedPersonId: string, selectedGame: WheelChoice | null) {
    setGame(selectedGame)
    setPhase("finished")
    onResult?.({ groupId: groupFor(selectedTeamId), teamId: selectedTeamId, personId: selectedPersonId, game: selectedGame })
  }
  function commit(choice: WheelChoice) {
    if (phase === "team") {
      const chosen = teams.find((item) => item.id === choice.id)
      if (!chosen) return
      setTeamId(chosen.id)
      setPersonId(null)
      setGame(null)
      if (chosen.actors.length === 1) {
        const only = chosen.actors[0]
        setPersonId(only.id)
        const publicGames = getPublicGameChoices(live.participants.find((item) => item.id === only.id) ?? null)
        if (publicGames.length) setPhase("game")
        else finish(chosen.id, only.id, null)
      } else setPhase("person")
    } else if (phase === "person" && team) {
      const chosen = people.find((item) => item.id === choice.id)
      if (!chosen) return
      setPersonId(chosen.id)
      const publicGames = getPublicGameChoices(live.participants.find((item) => item.id === chosen.id) ?? null)
      if (publicGames.length) setPhase("game")
      else finish(team.id, chosen.id, null)
    } else if (phase === "game" && team && person) finish(team.id, person.id, choice)
  }
  function draw(forcedId?: string) {
    if (drawing || phase === "finished" || !options.length) return
    const snapshot = [...options]
    const winner = forcedId ? snapshot.find((item) => item.id === forcedId) : snapshot[nextRandom(snapshot.length)]
    if (!winner) return
    setDrawing(true)
    intervalRef.current = setInterval(() => setHighlight(snapshot[nextRandom(snapshot.length)].id), 170)
    timerRef.current = setTimeout(() => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      intervalRef.current = null
      setHighlight(winner.id)
      setDrawing(false)
      commit(winner)
    }, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 220 : 3600)
  }
  function restart() {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (intervalRef.current) clearInterval(intervalRef.current)
    setDrawing(false)
    setHighlight(null)
    setTeamId(null)
    setPersonId(null)
    setGame(null)
    setPhase("team")
    setRound((value) => value + 1)
  }
  function chooseHouse(id: string) {
    if (drawing) return
    if (phase === "team") draw(id)
    else {
      restart()
      setRequestedTeam(id)
    }
  }
  useEffect(() => {
    if (!requestedTeam || phase !== "team" || drawing) return
    const id = requestedTeam
    setRequestedTeam(null)
    draw(id)
  }, [requestedTeam, phase, drawing, teams])
  useEffect(() => {
    if (!automatic || drawing || !teams.length) return
    const timer = window.setTimeout(() => {
      if (phase === "finished") restart()
      else draw()
    }, phase === "finished" ? 7500 : 1200)
    return () => clearTimeout(timer)
  }, [automatic, drawing, phase, teamId, personId, round, teams, games])

  const focus = phase === "finished" ? (gameDescription || game?.label || person?.displayName) : drawing ? options.find((item) => item.id === highlight)?.label : phase === "team" ? "Aguardando equipe" : phase === "person" ? "Aguardando pessoa" : "Aguardando jogo"
  return <section ref={sceneRef} className={`scene-shell scene-shell--village ${variant === "squad" ? "scene-shell--squad" : "scene-shell--casino"}`} aria-label={variant === "squad" ? "Sala tática interativa dos bilhetes" : "Mesa de sorteio tático dos bilhetes"}>
    <div className="scene-topbar"><div><span className="scene-overline">BATALHAS DO NUUHZÃO · {variant === "squad" ? "SALA DA COMUNIDADE" : "MESA DE SORTEIO"}</span><h2>{variant === "squad" ? "Sala dos bilhetes" : "Confronto & sorteio"}</h2></div><span className="scene-online"><i /> AO VIVO</span></div>
    {variant === "squad" ? <div className="scene-squad-stage">
      <div className="scene-squad-grid" aria-hidden="true" />
      <div className="scene-casino-head"><span>◈ {drawing ? "ELENCO EM MOVIMENTO" : phase === "finished" ? "RESULTADO DEFINIDO" : "SALA ABERTA"}</span><span>RODADA {String(round + 1).padStart(2, "0")}</span></div>
      <div className="scene-squad-platform" aria-hidden="true"><span /></div>
      {squadRoster.map((actor, index) => {
        const selected = highlight === (phase === "team" ? actor.eventId : actor.id) || person?.id === actor.id || (phase === "team" && team?.id === actor.eventId)
        const selectable = phase === "team" || phase === "person" && team?.id === actor.eventId
        return <button type="button" key={actor.id} className={`scene-squad-seat scene-squad-seat--${index + 1} ${selected ? "scene-squad-seat--selected" : ""}`} disabled={drawing || !selectable} onClick={() => draw(phase === "team" ? actor.eventId : actor.id)} aria-label={`${actor.displayName}, ${actor.team}${selectable ? "; clicar para escolher" : ""}`}>
          {index < 3 && <span className="scene-squad-bubble">{squadLines[(carousel + index) % squadLines.length]}</span>}
          <Avatar actor={actor} activity={selected ? "duel" : index % 2 ? "walk" : "idle"} />
          <span className="scene-squad-team">{actor.team}</span>
        </button>
      })}
      <div className="scene-squad-center" aria-live="polite" aria-atomic="true">
        <span>ETAPA {phase === "team" ? "01 · EQUIPE" : phase === "person" ? "02 · PESSOA" : "03 · JOGO"}</span>
        <strong key={`${phase}-${focus}`} className={drawing ? "scene-squad-rolling" : ""}>{focus}</strong>
        <small>{team?.name ?? "EQUIPE ?"} ✦ {person?.displayName ?? "PESSOA ?"} ✦ {game?.label ?? "JOGO ?"}</small>
      </div>
      <div className="scene-squad-status">{actors.length ? `${actors.length} bilhetes na sala · clique em um personagem ou use o sorteio` : "Aguardando os bilhetes chegarem à sala"}</div>
    </div> : <div className="scene-casino-stage">
      <div className="scene-casino-head"><span>◈ {phase === "finished" ? "RESULTADO REVELADO" : drawing ? "SORTEIO EM CURSO" : "MESA ABERTA"}</span><span>RODADA {String(round + 1).padStart(2, "0")}</span></div>
      <div className="scene-casino-center" aria-live="polite" aria-atomic="true">
        <span className="scene-casino-kicker">{phase === "finished" ? "ESCOLHIDO" : drawing ? `SORTEANDO ${phaseName.toUpperCase()}` : `ETAPA ${phase === "team" ? 1 : phase === "person" ? 2 : 3} / 3 · ${phaseName.toUpperCase()}`}</span>
        <div className={`scene-casino-reel ${drawing ? "scene-casino-reel--rolling" : ""} ${phase === "finished" ? "scene-casino-reel--won" : ""}`}><span className="scene-casino-pointer">▼</span><strong key={`${phase}-${focus}`}>{focus}</strong><span className="scene-casino-pointer">▲</span></div>
        <div className="scene-casino-trail"><span>{team?.name ?? "EQUIPE ?"}</span><span>✦</span><span>{person?.displayName ?? "PESSOA ?"}</span><span>✦</span><span>{game?.label ?? (phase === "finished" ? "SEM JOGO PÚBLICO" : "JOGO ?")}</span></div>
      </div>
      <div className="scene-casino-floor">{drawing ? "◆ ◆ ◆ ◆ ◆" : phase === "finished" ? "✦ BATALHA DEFINIDA ✦" : "PRONTO PARA O SORTEIO"}</div>
    </div>}
    <div className="scene-village-controls"><span className="scene-step-indicator">{drawing ? `Sorteando ${phaseName}...` : phase === "finished" ? "Resultado pronto para a live" : `Escolha ou sorteie ${phaseName}`}</span><div>
      <button type="button" onClick={() => setAutomatic((value) => !value)} aria-pressed={automatic}>{automatic ? "Automático: ligado" : "Automático: desligado"}</button>
      <button type="button" onClick={() => { if (document.fullscreenElement) void document.exitFullscreen(); else void (sceneRef.current?.closest(".live-play-grid") ?? sceneRef.current)?.requestFullscreen() }}>Tela cheia</button>
      <button type="button" onClick={restart} disabled={drawing}>Novo sorteio</button>
    </div></div>
    {teams.length ? <>
      <div className="scene-village-result" aria-label="Etapas do sorteio"><span>01 · {team?.name ?? "EQUIPE"}</span><span>02 · {person?.displayName ?? "PESSOA"}</span><span>03 · {gameDescription || game?.label || (phase === "finished" ? "SEM JOGO PÚBLICO" : "JOGO")}</span></div>
      <div className="scene-village-choices"><div className="scene-choices-heading"><span>{phase === "team" ? "Escolha uma equipe" : phase === "person" ? `Bilhetes de ${team?.name}` : phase === "game" ? `Jogos públicos de ${person?.displayName}` : "Sorteio concluído"}</span><b>{phase === "team" ? `${teams.length} equipes` : phase === "person" ? `${people.length} bilhetes` : phase === "game" ? `${games.length} jogos` : "RESULTADO"}</b></div>
        {phase === "finished" ? <div className="scene-finished"><strong>{person?.displayName}</strong><span>{team?.name} · {gameDescription || game?.label || "Sem jogo público disponível"}</span><button type="button" onClick={restart}>Nova rodada</button></div> : <div className="scene-choice-list">{options.map((choice) => <button type="button" key={choice.id} disabled={drawing} className={highlight === choice.id ? "scene-choice--lit" : ""} onClick={() => draw(choice.id)}>{choice.label}{phase === "team" ? ` · ${teams.find((item) => item.id === choice.id)?.actors.length} bilhete(s)` : phase === "game" ? ` · ${getGameDescription(participant, choice) ?? ""}` : ""}</button>)}</div>}
        {phase !== "finished" && <button type="button" className="scene-draw-button" disabled={drawing || !options.length} onClick={() => draw()}>{drawing ? "SORTEANDO..." : `◆ SORTEAR ${phaseName.toUpperCase()}`}</button>}
      </div>
      <div className="scene-team-switcher" aria-label="Escolher equipe diretamente"><span>EQUIPES</span>{teams.map((item) => <button key={item.id} type="button" disabled={drawing} aria-pressed={teamId === item.id} onClick={() => chooseHouse(item.id)}>{item.name} <small>{item.actors.length}</small></button>)}</div>
      <div className="scene-bottom"><div><span>EM DESTAQUE</span><b>{team?.name ?? visibleTeams[0]?.name}</b></div><div><span>BILHETES</span><b>{actors.length}</b></div><div><span>ENTRADAS DA FILA</span><b>{formatBRL(contribution)}</b></div><div><span>RODADA</span><b>{round + 1}</b></div></div>
    </> : <div className="scene-empty">Aguardando bilhetes para abrir a mesa de sorteio.</div>}
    <p className="scene-disclaimer">Confronto visual com agentes originais. Campos sensíveis ficam ocultos. O sorteio não altera vencedores ou pagamentos.</p>
  </section>
}

export function AnimatedScenes({ live, mode, onVillageResult }: { live: LiveData; mode: "neighborhood" | "squad" | "arena"; onVillageResult?: (value: VillageResult) => void }) {
  const actors = useMemo(() => makeActors(live.participants, live.recentDonations), [live.participants, live.recentDonations])
  const teams = useMemo(() => sceneTeams(live.battleGroups, actors), [live.battleGroups, actors])
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const clock = window.setInterval(() => setTick((previous) => previous + 1), 6500)
    return () => window.clearInterval(clock)
  }, [])

  const active = teams[tick % (teams.length || 1)]
  const next = teams[(tick + 1) % (teams.length || 1)]
  const teamRound = Math.floor(tick / (teams.length || 1))
  const current = active?.actors[teamRound % active.actors.length]
  const rival = teams.length > 1
      ? next?.actors[teamRound % (next.actors.length || 1)]
      : active && active.actors.length > 1
      ? active.actors[(teamRound + 1) % active.actors.length]
      : null
  const contribution = actors.reduce((total, actor) => total + actor.ticketAmount, 0)
  if (mode === "neighborhood") return <VillageDraw live={live} actors={actors} teams={teams} onResult={onVillageResult} />
  if (mode === "squad") return <VillageDraw live={live} actors={actors} teams={teams} onResult={onVillageResult} variant="squad" />

  return <section className="scene-shell" aria-label="Arena dos bilhetes, animação automática dos bilhetes">
    <div className="scene-topbar"><div><span className="scene-overline">AGENTES ORIGINAIS · CONFRONTO VISUAL</span><h2>Confronto tático</h2></div><span className="scene-online"><i /> CENA AUTOMÁTICA</span></div>
    {actors.length === 0 ? <div className="scene-empty">Aguardando bilhetes. Os agentes entrarão na cena quando houver pessoas na fila.</div> : <div className="scene-world scene-world--arena">
      <div className="scene-arena-grid" /><div className="scene-arena-glow" />
      <div className="scene-arena-banner">CONFRONTO VISUAL <span>Rodada {String(tick + 1).padStart(2, "0")}</span></div>
      <div className="scene-fighter scene-fighter--left" key={`${current?.id}-${tick}`}><AgentPortrait actor={current ?? actors[0]} frame={Math.max(0, actors.findIndex((actor) => actor.id === current?.id)) % 4} /><strong>{active?.name}</strong></div>
      <div className="scene-impact">VS<span>✦</span></div>
      <div className="scene-fighter scene-fighter--right" key={`${rival?.id}-${tick}`}>{rival ? <AgentPortrait actor={rival} frame={Math.max(0, actors.findIndex((actor) => actor.id === rival.id)) % 4} /> : <div className="scene-practice-target" aria-label="Alvo de treino">◎</div>}<strong>{rival ? next?.name : "TREINO"}</strong></div>
      <div className="scene-arena-feed"><span className="nuuh-meme-crop nuuh-meme-crop--susto" role="img" aria-label="Nuuh reagindo à disputa" />{current?.displayName} <span>{rival ? "enfrenta" : "treina com"}</span> {rival?.displayName ?? "o alvo"}</div>
    </div>}
    <div className="scene-bottom"><div><span>NA CENA</span><b>{active?.name ?? "Aguardando"}</b></div><div><span>BILHETES</span><b>{actors.length}</b></div><div><span>ENTRADAS DA FILA</span><b>{formatBRL(contribution)}</b></div><div><span>PRÓXIMA EQUIPE</span><b>{next?.name ?? "Aguardando"}</b></div></div>
    <div className="scene-roster"><span className="scene-roster-title">AGENTES DOS BILHETES · {teams.length} {teams.length === 1 ? "EQUIPE" : "EQUIPES"}</span>{teams.length > 4 && <span className="scene-rotation-note">Equipes e bilhetes alternam automaticamente para mostrar todos.</span>}<div>{actors.map((actor, index) => <div className="scene-roster-card" key={actor.id}><AgentPortrait actor={actor} frame={index % 4} small /><span><strong>{actor.displayName}</strong><small>{actor.team} · {formatBRL(actor.ticketAmount)} · {actor.donationXP} XP recente</small></span></div>)}</div></div>
    <p className="scene-disclaimer">Animação ilustrativa. As cenas não determinam o vencedor nem alteram a premiação. XP considera somente doações pagas recentes com nome único.</p>
  </section>
}
