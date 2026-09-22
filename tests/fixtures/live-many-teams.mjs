// Dados totalmente fictícios. Importados apenas pelos testes locais: não há rota ou
// configuração de produção que exponha esta base no site.
export function makeTestLiveData() {
  const names = ["Águias", "Trovão", "Nébula", "Cometas", "Titãs", "Vórtice", "Fênix", "Orion", "Centelhas", "Raposa", "Espectros", "Maré"]
  const firstNames = ["Ana", "Bia", "Caio", "Davi", "Eva", "Iara", "João", "Lia", "Noah", "Ravi"]
  const participants = []
  const battleGroups = [0, 1, 2].map((groupIndex) => ({
    id: `sim-grupo-${groupIndex + 1}`,
    name: `Simulação ${groupIndex + 1}`,
    events: names.slice(groupIndex * 4, groupIndex * 4 + 4).map((name, index) => ({
      id: `sim-time-${groupIndex * 4 + index + 1}`,
      name,
      occupiedEntries: 10,
      maxEntries: 10,
      availableEntries: 0,
      minValue: 20,
    })),
  }))

  for (const group of battleGroups) {
    for (const event of group.events) {
      for (let index = 0; index < 10; index++) {
        const number = Number(event.id.split("-").at(-1))
        const id = `${event.id}-pessoa-${index + 1}`
        // Mesmo nome em algumas equipes testa identificação de bilhetes repetidos.
        const username = index === 9 ? "Convidado" : `${firstNames[index]}_${number}`
        participants.push({
          id, username, message: null, amount: 20, quantity: 1,
          eventId: event.id, eventName: event.name, groupName: group.name,
          createdAt: "2026-01-01T12:00:00.000Z",
          fields: [
            { label: "Jogo 1 Time 1", value: `Equipe ${number}`, sensitive: false },
            { label: "Jogo 1 Time 2", value: `Equipe ${number + 1}`, sensitive: index % 4 === 0 },
            { label: "Jogo 2", value: `Mapa ${number}`, sensitive: index % 5 === 0 },
            { label: "Jogo 3", value: "SEGREDO-SENSIVEL-SIMULADO", sensitive: true },
            { label: "CPF", value: "DOCUMENTO-SIMULADO-OCULTO", sensitive: true },
          ],
        })
      }
    }
  }
  // Fila avulsa com uma pessoa; outra equipe sem bilhetes para testar a filtragem.
  battleGroups.push({
    id: "sim-avulsa", name: "Fila avulsa",
    events: [
      { id: "sim-solo", name: "Solo", occupiedEntries: 1, maxEntries: 1, availableEntries: 0, minValue: 20 },
      { id: "sim-vazia", name: "Vazia", occupiedEntries: 0, maxEntries: 10, availableEntries: 10, minValue: 20 },
    ],
  })
  participants.push({
    id: "sim-solo-pessoa", username: "PessoaSolo", message: null,
    amount: 20, quantity: 1, eventId: "sim-solo", eventName: "Solo", groupName: "Fila avulsa",
    createdAt: "2026-01-01T12:00:00.000Z",
    fields: [{ label: "Jogo 1", value: "SEGREDO-SENSIVEL-SIMULADO", sensitive: true }],
  })
  const totalEntradas = participants.reduce((sum, person) => sum + person.amount, 0)
  return {
    updatedAt: "2026-01-01T12:00:00.000Z",
    participants, battleGroups,
    recentDonations: [
      { id: "sim-doacao-1", username: "Ana_1", amount: 10, status: "PAID", message: null, createdAt: "2026-01-01T12:00:00.000Z" },
      { id: "sim-doacao-2", username: "Convidado", amount: 100, status: "PAID", message: null, createdAt: "2026-01-01T12:00:00.000Z" },
    ],
    stats: { participants: participants.length, events: 14, groups: 4, totalEntradas, totalGanhos: 0, paidDonations: 2 },
  }
}
