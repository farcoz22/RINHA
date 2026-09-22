# Instalar a versão do Dukoth

Esta cópia usa um Worker, um banco D1 e credenciais próprios. A publicação atual do Nuuh permanece separada.

## Preparar os dados

1. No painel Cloudflare, abra **Storage & Databases → D1 SQL database → Create database**.
2. Crie `rinha-dukoth-historico` e copie o **Database ID**.
3. Em `wrangler.jsonc`, substitua `00000000-0000-0000-0000-000000000000` pelo ID novo. Mantenha `binding: "DB"` e `name: "rinha-dukoth"`.
4. Envie essa alteração apenas para a cópia do Dukoth. **Nunca use o ID do banco `rinha-historico` do Nuuh.**

## Conectar o GitHub

No painel Cloudflare, abra **Workers & Pages → Create application → Import a repository**. Escolha o repositório da cópia do Dukoth. Se estiver usando temporariamente uma branch do repositório RINHA, selecione `dukoth-preparacao` como branch de produção e confira que o Worker novo se chama `rinha-dukoth`. Não associe a cópia ao Worker `rinha`.

| Campo | Valor |
| --- | --- |
| Diretório raiz | `/` |
| Build command | `pnpm run build:vinext` |
| Deploy command | `pnpm run deploy:vinext` |
| Nome do Worker | `rinha-dukoth` |
| D1 binding | `DB` → `rinha-dukoth-historico` |

Após criar o Worker, em **Settings → Variables and Secrets**, cadastre como **Secret**: `RHYNO_CLIENT_ID` e `RHYNO_CLIENT_SECRET` da conta usada para as filas do Dukoth, e um `EXPORT_PASSWORD` novo para exportação e fechamento. Nenhum valor dessas variáveis deve entrar no GitHub. Faça novo deploy depois de cadastrar os segredos.

O aplicativo cria suas tabelas D1 ao primeiro acesso. Se houver erro na leitura das filas, confira as credenciais da Rhyno e a associação do D1. O endereço do site aparecerá em **Domains and routes**, normalmente `https://rinha-dukoth.<seu-subdominio>.workers.dev/`.

## Publicação posterior

Envie mudanças do Dukoth para a branch/repositório dele. A versão do Nuuh permanece na branch `main` do repositório original. Antes de publicar, confira que `wrangler.jsonc` contém o ID exclusivo do D1 do Dukoth e que a origem selecionada aponta para o Worker `rinha-dukoth`.
