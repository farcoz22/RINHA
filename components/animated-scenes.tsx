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
  const skin = ["#55301f", "#70442c", "#8a5839", "#a86e47", "#c0875c", "#d9a77d", "#eac29a", "#f2d5af"][actor.skinTone]
  const armor = ["#247d8f", "#9e3b34", "#65488f", "#bf7e22", "#2b58a0", "#914c78", "#4e7e37", "#696b70"][actor.outfit]
  const trim = ["#79efff", "#ffbf68", "#b994ff", "#f6e080"][actor.hairColor % 4]
  const vocation = ["KNIGHT", "PALADIN", "DRUID", "SORCERER"][actor.outfit % 4]
  return <div className={`scene-avatar scene-avatar--${activity} scene-avatar--vocation-${actor.outfit % 4} ${size === "small" ? "scene-avatar--small" : ""}`} style={{ "--avatar-hue": `${actor.hue}deg`, "--avatar-delay": `${-((actor.hue % 13) / 8)}s` } as React.CSSProperties} aria-label={`${actor.displayName}, aventureiro do bilhete na equipe ${actor.team}`}>
    <span className="scene-rune" aria-hidden="true">✦</span>
    <svg viewBox="0 0 96 128" role="img" aria-label={`Aventureiro de ${actor.displayName}`} shapeRendering="crispEdges">
      <ellipse cx="48" cy="119" rx="31" ry="7" fill="#04101bbb" />
      <path d="M25 53 16 103 48 117 80 103 71 53Z" fill="#101b2a" stroke={trim} strokeWidth="4" />
      <path d="M30 57H66L72 102 48 112 24 102Z" fill={armor} />
      <path d="M35 80H61M48 58v48" stroke={trim} strokeWidth="4" />
      <path d="M31 104 26 120H43L48 108 53 120H70L65 104Z" fill="#172539" stroke="#05090e" strokeWidth="3" />
      <rect x="29" y="24" width="38" height="35" fill={skin} stroke="#070b10" strokeWidth="4" />
      <path d="M25 28 33 13H63L71 28 63 22H34Z" fill={armor} stroke={trim} strokeWidth="3" />
      <rect x="36" y="37" width="7" height="5" fill="#eafcff" /><rect x="55" y="37" width="7" height="5" fill="#eafcff" />
      {actor.outfit % 4 === 0 && <><path d="M17 58 5 88 20 96 28 69Z" fill="#6f4b24" stroke="#e7bf65" strokeWidth="4" /><path d="M70 61 89 45" stroke="#d8e8ed" strokeWidth="5" /></>}
      {actor.outfit % 4 === 1 && <><path d="M22 63 6 37M7 37l4 36" stroke="#d7aa5d" strokeWidth="4" /><path d="m71 61 17 26" stroke="#dde9f0" strokeWidth="4" /></>}
      {actor.outfit % 4 === 2 && <><path d="M24 61 8 93M8 93l-3-13m3 13 13-5" stroke="#79e6a0" strokeWidth="5" /><circle cx="8" cy="76" r="7" fill="#64e0a0" /></>}
      {actor.outfit % 4 === 3 && <><path d="M72 62 87 94" stroke="#c398f8" strokeWidth="5" /><circle cx="86" cy="78" r="8" fill="#7fcfff" /></>}
    </svg>
    <span className="scene-vocation">{vocation}</span>
    <span className="scene-avatar-name">{actor.displayName}</span>
  </div>
}

function AgentPortrait({ actor, frame = 0, small = false }: { actor: SceneActor; frame?: number; small?: boolean }) {
  return <div className={`scene-agent-portrait ${small ? "scene-agent-portrait--small" : ""}`} data-frame={frame % 4} role="img" aria-label={`Aventureiro de fantasia representando o bilhete de ${actor.displayName}`}><Avatar actor={actor} activity={frame % 2 ? "walk" : "idle"} size={small ? "small" : "normal"} /></div>
}

const squadLines = [
  "Partiu hunt com o Dukoth?",
  "Quem vai pra cave agora?",
  "Meu bilhete entrou na guild!",
  "Drop raro hoje?",
  "Essa rodada é da minha pt!",
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
  return <section ref={sceneRef} className={`scene-shell scene-shell--village ${variant === "squad" ? "scene-shell--squad" : "scene-shell--casino"}`} aria-label={variant === "squad" ? "Roda dos aventureiros da fila" : "Guild Hall do sorteio"}>
    <div className="scene-topbar"><div><span className="scene-overline">HIGH ONION CORPORATION · {variant === "squad" ? "RODA DOS AVENTUREIROS" : "GUILD HALL"}</span><h2>{variant === "squad" ? "Roda da guild" : "Sorteio da hunt"}</h2></div><span className="scene-online"><i /> ONLINE</span></div>
    {variant === "squad" ? <div className="scene-squad-stage">
      <div className="scene-squad-grid" aria-hidden="true" />
      <div className="scene-casino-head"><span>✦ {drawing ? "RUNAS EM MOVIMENTO" : phase === "finished" ? "AVENTUREIRO ESCOLHIDO" : "GUILD ABERTA"}</span><span>HUNT {String(round + 1).padStart(2, "0")}</span></div>
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
      <div className="scene-casino-head"><span>✦ {phase === "finished" ? "DESTINO REVELADO" : drawing ? "RUNAS EM MOVIMENTO" : "GUILD HALL ABERTA"}</span><span>HUNT {String(round + 1).padStart(2, "0")}</span></div>
      <div className="scene-casino-center" aria-live="polite" aria-atomic="true">
        <span className="scene-casino-kicker">{phase === "finished" ? "ESCOLHIDO" : drawing ? `SORTEANDO ${phaseName.toUpperCase()}` : `ETAPA ${phase === "team" ? 1 : phase === "person" ? 2 : 3} / 3 · ${phaseName.toUpperCase()}`}</span>
        <div className={`scene-casino-reel ${drawing ? "scene-casino-reel--rolling" : ""} ${phase === "finished" ? "scene-casino-reel--won" : ""}`}><span className="scene-casino-pointer">▼</span><strong key={`${phase}-${focus}`}>{focus}</strong><span className="scene-casino-pointer">▲</span></div>
        <div className="scene-casino-trail"><span>{team?.name ?? "EQUIPE ?"}</span><span>✦</span><span>{person?.displayName ?? "PESSOA ?"}</span><span>✦</span><span>{game?.label ?? (phase === "finished" ? "SEM JOGO PÚBLICO" : "JOGO ?")}</span></div>
      </div>
      <div className="scene-casino-floor">{drawing ? "✦ ✦ ✦ ✦ ✦" : phase === "finished" ? "✦ PARTY DEFINIDA ✦" : "RUNAS PRONTAS PARA O SORTEIO"}</div>
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
    <p className="scene-disclaimer">Aventureiros ilustrativos em pixel art. Campos sensíveis ficam ocultos. O sorteio não altera vencedores ou pagamentos.</p>
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

  return <section className="scene-shell" aria-label="Arena PvP dos bilhetes">
    <div className="scene-topbar"><div><span className="scene-overline">HIGH ONION CORPORATION · PVP</span><h2>Arena dos aventureiros</h2></div><span className="scene-online"><i /> CENA AUTOMÁTICA</span></div>
    {actors.length === 0 ? <div className="scene-empty">Aguardando bilhetes. Os aventureiros entrarão na arena quando houver pessoas na fila.</div> : <div className="scene-world scene-world--arena">
      <div className="scene-arena-grid" /><div className="scene-arena-glow" />
      <div className="scene-arena-banner">ARENA PVP <span>Round {String(tick + 1).padStart(2, "0")}</span></div>
      <div className="scene-fighter scene-fighter--left" key={`${current?.id}-${tick}`}><AgentPortrait actor={current ?? actors[0]} frame={Math.max(0, actors.findIndex((actor) => actor.id === current?.id)) % 4} /><strong>{active?.name}</strong></div>
      <div className="scene-impact">VS<span>✦</span></div>
      <div className="scene-fighter scene-fighter--right" key={`${rival?.id}-${tick}`}>{rival ? <AgentPortrait actor={rival} frame={Math.max(0, actors.findIndex((actor) => actor.id === rival.id)) % 4} /> : <div className="scene-practice-target" aria-label="Alvo de treino">☠</div>}<strong>{rival ? next?.name : "TRAINING"}</strong></div>
      <div className="scene-arena-feed"><span className="scene-feed-rune" aria-hidden="true">✦</span>{current?.displayName} <span>{rival ? "enfrenta" : "treina com"}</span> {rival?.displayName ?? "o alvo"}</div>
    </div>}
    <div className="scene-bottom"><div><span>NA CENA</span><b>{active?.name ?? "Aguardando"}</b></div><div><span>BILHETES</span><b>{actors.length}</b></div><div><span>ENTRADAS DA FILA</span><b>{formatBRL(contribution)}</b></div><div><span>PRÓXIMA EQUIPE</span><b>{next?.name ?? "Aguardando"}</b></div></div>
    <div className="scene-roster"><span className="scene-roster-title">AVENTUREIROS DA GUILD · {teams.length} {teams.length === 1 ? "PARTY" : "PARTIES"}</span>{teams.length > 4 && <span className="scene-rotation-note">Equipes e bilhetes alternam automaticamente para mostrar todos.</span>}<div>{actors.map((actor, index) => <div className="scene-roster-card" key={actor.id}><AgentPortrait actor={actor} frame={index % 4} small /><span><strong>{actor.displayName}</strong><small>{actor.team} · {formatBRL(actor.ticketAmount)} · {actor.donationXP} XP recente</small></span></div>)}</div></div>
    <p className="scene-disclaimer">Animação ilustrativa. As cenas não determinam o vencedor nem alteram a premiação. XP considera somente doações pagas recentes com nome único.</p>
  </section>
}
