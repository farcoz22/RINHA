"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import useSWR from "swr"
import { AlertTriangle, Check, Expand, RefreshCw, RotateCcw, Trophy } from "lucide-react"
import type { LiveData } from "@/lib/types"
import { SiteHeader } from "@/components/site-header"
import { Hero } from "@/components/hero"
import { Roulette, type RouletteSound, type WheelChoice } from "@/components/roulette"
import { Ranking } from "@/components/ranking"
import { NuuhSpotlight } from "@/components/nuuh-spotlight"
import { getGameDescription, getPublicGameChoices } from "@/lib/roulette-games"
import { AnimatedScenes, type VillageResult } from "@/components/animated-scenes"
import type { SceneMode } from "@/lib/scene-model"
import type { PoolDraft } from "@/lib/pool-preview"
import { LiveSidebar } from "@/components/live-sidebar"

const fetcher = (url: string) => fetch(url).then((response) => response.json() as Promise<LiveData>)
type Stage = "team" | "person" | "game"
type Tab = "ao-vivo" | "fila"

export function LivePanel({ initialData }: { initialData: LiveData }) {
  const { data, mutate, isValidating } = useSWR<LiveData>("/api/live", fetcher, {
    refreshInterval: 600_000,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    fallbackData: initialData,
    keepPreviousData: true,
  })
  const live = data ?? initialData
  const [tab, setTab] = useState<Tab>("ao-vivo")
  const [sceneMode, setSceneMode] = useState<SceneMode>("roulette")
  const [autoPlayRoulette, setAutoPlayRoulette] = useState(true)
  const [poolDraft, setPoolDraft] = useState<PoolDraft>({})
  useEffect(() => {
    const saved = window.localStorage.getItem("rinha-scene-mode")
    if (saved === "neighborhood" || saved === "arena" || saved === "roulette") setSceneMode(saved)
    if (window.localStorage.getItem("rinha-roulette-auto") === "off") setAutoPlayRoulette(false)
    try {
      const saved = window.localStorage.getItem("rhyno-pool-calculator")
      if (saved) setPoolDraft(JSON.parse(saved) as PoolDraft)
    } catch { /* A live continua mesmo sem acesso ao armazenamento local. */ }
    const onPoolChange = (event: Event) => setPoolDraft((event as CustomEvent<PoolDraft>).detail)
    window.addEventListener("rhyno-pool-draft-change", onPoolChange)
    return () => window.removeEventListener("rhyno-pool-draft-change", onPoolChange)
  }, [])
  function changeSceneMode(next: SceneMode) {
    if (next !== sceneMode) reset()
    setSceneMode(next)
    window.localStorage.setItem("rinha-scene-mode", next)
  }
  function toggleRouletteAuto() {
    const enabled = !autoPlayRoulette
    setAutoPlayRoulette(enabled)
    window.localStorage.setItem("rinha-roulette-auto", enabled ? "on" : "off")
  }
  const [stage, setStage] = useState<Stage>("team")
  const [groupId, setGroupId] = useState<string | null>(null)
  const [teamId, setTeamId] = useState<string | null>(null)
  const [participantId, setParticipantId] = useState<string | null>(null)
  const [game, setGame] = useState<WheelChoice | null>(null)
  const [sound, setSound] = useState<RouletteSound>("classic")
  const [spinning, setSpinning] = useState(false)
  const rouletteStageRef = useRef<HTMLElement | null>(null)

  const groups = useMemo(() =>
    live.battleGroups.map((group) => ({
      ...group,
      events: group.events.filter((event) => live.participants.some((person) => person.eventId === event.id)),
    })).filter((group) => group.events.length > 0),
  [live.battleGroups, live.participants])

  const selectedGroup = groups.find((group) => group.id === groupId) ?? groups[0] ?? null
  const selectedTeam = selectedGroup?.events.find((event) => event.id === teamId) ?? null
  const teamPeople = selectedTeam ? live.participants.filter((person) => person.eventId === selectedTeam.id) : []
  const selectedPerson = teamPeople.find((person) => person.id === participantId) ?? null
  const games = useMemo(() => getPublicGameChoices(selectedPerson), [selectedPerson])
  const selectedGame = game && games.some((choice) => choice.label === game.label) ? game : null
  const gameDescription = getGameDescription(selectedPerson, selectedGame)

  const choices: WheelChoice[] = stage === "team"
    ? (selectedGroup?.events ?? []).map((team) => ({ id: team.id, label: team.name }))
    : stage === "person"
      ? teamPeople.map((person) => ({ id: person.id, label: person.username }))
      : games

  const labels: Record<Stage, string> = { team: "Sortear equipe", person: "Sortear pessoa", game: "Sortear jogo" }

  function chooseGroup(id: string) {
    if (spinning) return
    setGroupId(id)
    reset()
  }

  function reset() {
    setStage("team")
    setTeamId(null)
    setParticipantId(null)
    setGame(null)
  }

  function handleSelected(choice: WheelChoice) {
    if (stage === "team") {
      setTeamId(choice.id)
      const people = live.participants.filter((person) => person.eventId === choice.id)
      setParticipantId(people.length === 1 ? people[0].id : null)
      setGame(null)
    } else if (stage === "person") {
      setParticipantId(choice.id)
      setGame(null)
    } else {
      setGame(choice)
    }
  }

  function handleVillageResult(result: VillageResult) {
    setGroupId(result.groupId)
    setTeamId(result.teamId)
    setParticipantId(result.personId)
    setGame(result.game)
    setStage("game")
  }

  const nextStage: Stage | null = stage === "team" && selectedTeam
    ? teamPeople.length > 1 ? "person" : selectedPerson ? "game" : null
    : stage === "person" && selectedPerson ? "game" : null
  const canPickGame = Boolean(selectedPerson && games.length)
  const currentResult = stage === "team" ? selectedTeam?.name : stage === "person" ? selectedPerson?.username : selectedGame?.label

  // A roleta também funciona sem operador: sorteia equipe, pessoa e jogo,
  // exibe o resultado por alguns segundos e reinicia sozinha.
  useEffect(() => {
    if (sceneMode !== "roulette" || tab !== "ao-vivo" || !autoPlayRoulette || spinning) return
    let next: Stage | null = null
    if (stage === "team" && selectedTeam) next = teamPeople.length > 1 ? "person" : "game"
    else if (stage === "person" && selectedPerson) next = "game"
    if (next === "game" && !canPickGame) next = null
    if (!next && stage !== "game" && !selectedTeam && !selectedPerson) return
    const timer = setTimeout(() => {
      if (next) setStage(next)
      else {
        if (groups.length > 1) {
          const index = groups.findIndex((group) => group.id === selectedGroup?.id)
          setGroupId(groups[(index + 1) % groups.length].id)
        }
        reset()
      }
    }, next ? 3200 : 8500)
    return () => clearTimeout(timer)
  }, [sceneMode, tab, autoPlayRoulette, spinning, stage, selectedTeam?.id, selectedPerson?.id, selectedGame?.id, selectedGroup?.id, groups, teamPeople.length, canPickGame])

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6">
      <SiteHeader />
      <NuuhSpotlight />
      {live.error && (
        <div className="flex items-center gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="size-4 shrink-0" />
          <span>Não foi possível carregar tudo da API da Rhyno: {live.error}</span>
        </div>
      )}
      <Hero selectedTeam={selectedTeam?.name ?? null} selectedName={selectedPerson?.username ?? null} selectedGame={selectedGame?.label ?? null} stats={live.stats} updatedAt={live.updatedAt} />

      <div className="flex flex-wrap items-center gap-2" id="ao-vivo">
        <button type="button" onClick={() => setTab("ao-vivo")} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${tab === "ao-vivo" ? "bg-gradient-to-r from-primary to-sky-500 text-primary-foreground shadow-lg shadow-primary/30" : "text-muted-foreground ring-1 ring-border hover:text-foreground"}`}>Ao vivo</button>
        <button type="button" onClick={() => setTab("fila")} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${tab === "fila" ? "bg-gradient-to-r from-primary to-sky-500 text-primary-foreground shadow-lg shadow-primary/30" : "text-muted-foreground ring-1 ring-border hover:text-foreground"}`}>Apostas, pote &amp; ranking</button>
        <div className="ml-auto flex flex-wrap justify-end gap-2">
          <button type="button" onClick={() => void mutate()} disabled={isValidating} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-muted-foreground ring-1 ring-border transition hover:text-foreground disabled:opacity-50">
            <RefreshCw className={`size-3.5 ${isValidating ? "animate-spin" : ""}`} /> {isValidating ? "Atualizando..." : "Atualizar dados"}
          </button>
          {(teamId || participantId || game) && <button type="button" onClick={reset} disabled={spinning} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-muted-foreground ring-1 ring-border transition hover:text-foreground disabled:opacity-50"><RotateCcw className="size-3.5" /> Reiniciar sorteio</button>}
        </div>
      </div>

      {tab === "ao-vivo" ? (<>
        <nav className="scene-mode-switch" aria-label="Escolher visualização da live">
          <span>VISUAL DA LIVE</span>
          <button type="button" aria-pressed={sceneMode === "neighborhood"} onClick={() => changeSceneMode("neighborhood")}>Cassino tático</button>
          <button type="button" aria-pressed={sceneMode === "arena"} onClick={() => changeSceneMode("arena")}>Confronto</button>
          <button type="button" aria-pressed={sceneMode === "roulette"} onClick={() => changeSceneMode("roulette")}>Roleta</button>
        </nav>
        {sceneMode === "roulette" ? <section ref={rouletteStageRef} className="roulette-stage grid gap-6 lg:grid-cols-2" id="fila">
          <div className="rounded-3xl border border-border bg-card/60 p-6 backdrop-blur">
            <p className="text-center text-xs font-semibold tracking-[0.3em] text-accent uppercase">Roleta do Nuuhzão</p>
            <h2 className="mb-4 mt-1 text-center text-2xl font-bold">Quem vai jogar agora?</h2>
            <button type="button" onClick={() => { if (document.fullscreenElement) void document.exitFullscreen(); else void rouletteStageRef.current?.requestFullscreen() }} className="mb-3 flex items-center gap-2 rounded-lg border border-amber-400/30 px-3 py-1.5 text-xs font-semibold text-amber-200 transition hover:bg-amber-400/10"><Expand className="size-3.5" /> Tela cheia para a live</button>
            <button type="button" onClick={toggleRouletteAuto} aria-pressed={autoPlayRoulette} className="mb-3 ml-2 rounded-lg border border-amber-400/30 px-3 py-1.5 text-xs font-semibold text-amber-200 transition hover:bg-amber-400/10">Giro automático: {autoPlayRoulette ? "ligado" : "desligado"}</button>
            {groups.length > 1 && <label className="mb-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              Confronto
              <select value={selectedGroup?.id ?? ""} onChange={(event) => chooseGroup(event.target.value)} disabled={spinning} className="max-w-[65%] rounded-lg border border-input bg-background px-3 py-2 text-foreground">
                {groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
              </select>
            </label>}
            <div className="mb-6 flex flex-wrap justify-center gap-2">
              <Step number={1} label="Equipes" active={stage === "team"} disabled={spinning} onClick={() => setStage("team")} />
              <Step number={2} label="Pessoas" active={stage === "person"} disabled={spinning || teamPeople.length < 2} onClick={() => setStage("person")} />
              <Step number={3} label="Jogos" active={stage === "game"} disabled={spinning || !canPickGame} onClick={() => setStage("game")} />
            </div>
            <Roulette key={`${selectedGroup?.id ?? "none"}-${stage}-${stage === "team" ? "" : teamId}-${stage === "game" ? participantId : ""}`} choices={choices} onSelected={handleSelected} onSpinningChange={setSpinning} buttonLabel={labels[stage]} sound={sound} onSoundChange={setSound} autoSpin={autoPlayRoulette} />
            <div className="mt-6 rounded-2xl border border-border bg-background/40 p-5 text-center" aria-live="polite">
              {currentResult ? <>
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-amber-400/15 text-amber-400 ring-1 ring-amber-400/40"><Trophy className="size-6" /></div>
                <p className="mt-3 text-xs font-bold tracking-[0.2em] text-amber-400 uppercase">Sorteado: {stage === "team" ? "equipe" : stage === "person" ? "pessoa" : "jogo"}</p>
                <p className="mt-1 break-words text-2xl font-extrabold">{currentResult}</p>
                {stage === "game" && gameDescription && gameDescription !== selectedGame?.label && <p className="mt-2 break-words text-sm text-muted-foreground">{gameDescription}</p>}
              </> : <p className="text-sm text-muted-foreground">{stage === "team" ? "Sorteie uma das equipes com participantes." : stage === "person" ? "Sorteie uma das pessoas da equipe." : "Sorteie um jogo entre os campos públicos da pessoa."}</p>}
              {nextStage && <button type="button" onClick={() => setStage(nextStage)} disabled={spinning || nextStage === "game" && !canPickGame} className="mt-4 rounded-xl bg-primary px-5 py-2 text-sm font-bold text-primary-foreground disabled:opacity-40">
                {nextStage === "person" ? "Agora sortear pessoa" : "Agora sortear jogo"}
              </button>}
              {selectedPerson && !games.length && <p className="mt-3 text-xs text-muted-foreground">Essa pessoa não tem jogos ou campos públicos disponíveis para sortear.</p>}
            </div>
          </div>
          <div className="live-secondary"><LiveSidebar groups={groups} participants={live.participants} groupId={selectedGroup?.id ?? null} draft={poolDraft} onGroupChange={chooseGroup} />
          <div className="rounded-3xl border border-border bg-card/60 p-6 backdrop-blur">
            <p className="text-xs font-semibold tracking-[0.3em] text-accent uppercase">Ordem do sorteio</p>
            <h2 className="mt-1 text-2xl font-bold">Equipe · pessoa · jogo</h2>
            <div className="mt-5 grid gap-3">
              <Outcome number={1} label="Equipe" value={selectedTeam?.name} />
              <Outcome number={2} label="Pessoa" value={selectedPerson?.username} hint={selectedTeam && teamPeople.length === 1 ? "Única pessoa da equipe" : undefined} />
              <Outcome number={3} label="Jogo" value={selectedGame?.label} detail={gameDescription && gameDescription !== selectedGame?.label ? gameDescription : undefined} />
            </div>
            {selectedPerson && selectedPerson.fields.some((field) => field.sensitive === false && field.value?.trim()) && <>
              <p className="mt-6 text-xs font-bold tracking-wide text-muted-foreground uppercase">Campos públicos preenchidos</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {selectedPerson.fields.filter((field) => field.sensitive === false && field.value?.trim()).map((field, index) => (
                  <div key={`${field.label}-${index}`} className="min-w-0 rounded-xl bg-background/40 p-3">
                    <p className="text-[11px] text-muted-foreground">{field.label}</p>
                    <p className="break-words text-sm font-bold">{field.value}</p>
                  </div>
                ))}
              </div>
            </>}
            {selectedTeam && <p className="mt-5 text-xs text-muted-foreground">Pessoas disponíveis na equipe: {teamPeople.length}. Pode voltar a uma etapa e girar novamente.</p>}
          </div></div>
        </section> : <div className="live-play-grid" id="fila"><AnimatedScenes live={live} mode={sceneMode} onVillageResult={handleVillageResult} /><LiveSidebar groups={groups} participants={live.participants} groupId={selectedGroup?.id ?? null} draft={poolDraft} onGroupChange={chooseGroup} /></div>}
      </>) : <Ranking participants={live.participants} battleGroups={live.battleGroups} donations={live.recentDonations} />}
      <footer className="mt-2 border-t border-border pt-5 text-xs text-muted-foreground">18+ | Jogue com responsabilidade! · Atualização automática a cada 10 minutos</footer>
    </div>
  )
}

function Step({ number, label, active, disabled, onClick }: { number: number; label: string; active: boolean; disabled: boolean; onClick: () => void }) {
  return <button type="button" disabled={disabled} onClick={onClick} className={`rounded-full px-3 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${active ? "bg-primary text-primary-foreground" : "bg-background/60 text-muted-foreground ring-1 ring-border hover:text-foreground"}`}>{number}. {label}</button>
}

function Outcome({ number, label, value, hint, detail }: { number: number; label: string; value?: string; hint?: string; detail?: string }) {
  return <div className={`flex gap-3 rounded-2xl border p-4 ${value ? "border-emerald-500/35 bg-emerald-500/10" : "border-border bg-background/40"}`}>
    <span className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${value ? "bg-emerald-500/20 text-emerald-400" : "bg-secondary text-muted-foreground"}`}>{value ? <Check className="size-4" /> : number}</span>
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}{hint ? ` · ${hint}` : ""}</p>
      <p className="mt-0.5 break-words text-lg font-bold">{value ?? "Aguardando sorteio"}</p>
      {detail && <p className="mt-1 break-words text-xs text-muted-foreground">{detail}</p>}
    </div>
  </div>
}
