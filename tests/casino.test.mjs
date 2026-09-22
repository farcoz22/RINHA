import assert from "node:assert/strict"
import { test } from "node:test"
import { randomInt } from "node:crypto"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { createServer } from "vite"
import react from "@vitejs/plugin-react"
import { makeTestLiveData } from "./fixtures/live-many-teams.mjs"
import { makeActors, sceneTeams } from "../lib/scene-model.ts"
import { getGameDescription, getPublicGameChoices } from "../lib/roulette-games.ts"
import { getPoolPreview } from "../lib/pool-preview.ts"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const live = makeTestLiveData()
const actors = makeActors(live.participants, live.recentDonations)
const teams = sceneTeams(live.battleGroups, actors)

test("base isolada: 12 equipes com 10 pessoas distintas por equipe e uma fila avulsa", () => {
  assert.equal(live.participants.length, 121)
  assert.equal(teams.length, 13)
  assert.equal(teams.filter((team) => team.actors.length === 10).length, 12)
  assert.equal(teams.find((team) => team.id === "sim-solo")?.actors.length, 1)
  assert.equal(teams.some((team) => team.id === "sim-vazia"), false)
  assert.equal(new Set(live.participants.map((person) => person.id)).size, 121)
  for (const team of teams.filter((item) => item.actors.length === 10)) {
    assert.equal(new Set(team.actors.map((person) => person.id)).size, 10)
    assert.equal(new Set(team.actors.map((person) => person.name)).size, 10)
  }
  assert.equal(live.stats.totalEntradas, 2420)
})

test("sorteio por etapas encontra somente pessoa do time escolhido", () => {
  // Percorre todas as combinações, inclusive 10 bilhetes nas equipes cheias.
  let combinations = 0
  for (const team of teams) {
    for (const actor of team.actors) {
      const participant = live.participants.find((person) => person.id === actor.id)
      assert.ok(participant)
      assert.equal(participant.eventId, team.id)
      const games = getPublicGameChoices(participant)
      for (const game of games) {
        const description = getGameDescription(participant, game)
        assert.ok(description)
        assert.doesNotMatch(description, /SEGREDO-SENSIVEL|DOCUMENTO-SIMULADO/)
      }
      combinations++
    }
  }
  assert.equal(combinations, 121)
  assert.deepEqual(getPublicGameChoices(live.participants.at(-1)), [])
})

test("nomes repetidos têm rótulos próprios e não recebem XP por doação ambígua", () => {
  const guests = actors.filter((actor) => actor.name === "Convidado")
  assert.equal(guests.length, 12)
  assert.equal(new Set(guests.map((actor) => actor.displayName)).size, 12)
  assert.ok(guests.every((actor) => actor.donationXP === 0))
  assert.equal(actors.find((actor) => actor.name === "Ana_1")?.donationXP, 100)
})

test("simulações repetidas preservam os candidatos e os grupos", () => {
  for (let spin = 0; spin < 5000; spin++) {
    const team = teams[randomInt(teams.length)]
    const actor = team.actors[randomInt(team.actors.length)]
    const person = live.participants.find((item) => item.id === actor.id)
    const games = getPublicGameChoices(person)
    const game = games.length ? games[randomInt(games.length)] : null
    assert.ok(live.battleGroups.some((group) => group.events.some((event) => event.id === team.id)))
    assert.equal(person.eventId, team.id)
    if (game) assert.ok(getGameDescription(person, game))
  }
})

test("placar aplica 15% e divide pelo número de bilhetes da equipe marcada", () => {
  const group = live.battleGroups[0]
  const draft = { [group.id]: { winnerId: group.events[0].id, casinoReturns: { [group.events[0].id]: "500,00" } } }
  const pool = getPoolPreview(group, live.participants, draft)
  assert.equal(pool.gross, 500)
  assert.equal(pool.fee, 75)
  assert.equal(pool.net, 425)
  assert.equal(pool.winningTickets, 10)
  assert.equal(pool.perTicket, 42.5)
  assert.equal(pool.entries, 800)
  assert.equal(getPoolPreview(group, live.participants, {}).perTicket, 0)
})

test("interface real comporta todos os times sem renderizar dados sensíveis", async () => {
  const server = await createServer({
    configFile: false, root,
    plugins: [react()],
    resolve: { alias: { "@": root } },
    server: { middlewareMode: true },
    appType: "custom",
  })
  try {
    const { AnimatedScenes } = await server.ssrLoadModule("/components/animated-scenes.tsx")
    const html = renderToStaticMarkup(createElement(AnimatedScenes, { live, mode: "neighborhood" }))
    const squad = renderToStaticMarkup(createElement(AnimatedScenes, { live, mode: "squad" }))
    const { LiveSidebar } = await server.ssrLoadModule("/components/live-sidebar.tsx")
    const group = live.battleGroups[0]
    const sidebar = renderToStaticMarkup(createElement(LiveSidebar, {
      groups: live.battleGroups, participants: live.participants, groupId: group.id,
      draft: { [group.id]: { winnerId: group.events[0].id, casinoReturns: { [group.events[0].id]: "500,00" } } },
      onGroupChange: () => {},
      onDraftChange: () => {},
    }))
    assert.match(html, /Automático: desligado/)
    assert.match(html, /13 equipes/)
    assert.match(html, /121/)
    assert.match(html, /R\$[\s\u00a0]2\.420,00/)
    for (const team of teams) assert.ok(html.includes(team.name), team.name)
    assert.doesNotMatch(html, /SEGREDO-SENSIVEL|DOCUMENTO-SIMULADO/)
    assert.match(squad, /Sala dos bilhetes/)
    assert.match(squad, /Será que o Nuuh vai deixar nós vendo a cadeira novamente\?/)
    assert.match(squad, /Que hora começa isso\?/)
    assert.match(squad, /Que demora para pagar!/)
    assert.equal((squad.match(/personagem do bilhete na equipe/g) ?? []).length, 6)
    assert.doesNotMatch(squad, /SEGREDO-SENSIVEL|DOCUMENTO-SIMULADO/)
    assert.match(sidebar, /R\$[\s\u00a0]425,00/)
    assert.match(sidebar, /R\$[\s\u00a0]42,50/)
    assert.match(sidebar, /SEM PATROCÍNIO ATIVO/)
    assert.match(sidebar, /Enviar imagem do patrocinador/)
    assert.match(sidebar, /Finalizar e salvar rinha/)
    assert.equal((sidebar.match(/Retorno do cassino para/g) ?? []).length, group.events.length)
    assert.doesNotMatch(sidebar, /SEGREDO-SENSIVEL|DOCUMENTO-SIMULADO/)
  } finally {
    await server.close()
  }
})
