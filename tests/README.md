# Base fictícia de teste

Execute `pnpm test:casino` na raiz do projeto (Node.js 22.18+ ou 24+).

Esta base contém 12 equipes com 10 bilhetes de pessoas diferentes em cada uma, uma equipe avulsa com 1 bilhete e uma equipe vazia. São 121 bilhetes e R$ 2.420 em entradas fictícias. Alguns nomes se repetem entre equipes, há jogos públicos, campos sensíveis e uma pessoa sem jogo público.

O teste percorre as escolhas de todos os bilhetes, realiza 5.000 simulações, verifica o filtro de dados sensíveis e renderiza o componente real do cassino com a base cheia.

Os arquivos desta pasta só são importados pelo comando de teste. A aplicação, a API `/api/live` e o build de produção não importam estes dados. O teste não faz requisições à Rhyno, não grava no D1 e não finaliza rinhas.
