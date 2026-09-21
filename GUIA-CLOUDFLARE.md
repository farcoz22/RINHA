# Publicar no Cloudflare Workers

Este projeto já está configurado para Cloudflare Workers com Next.js 16 e vinext.

## Antes de começar

Você precisa ter:

- uma conta gratuita no Cloudflare;
- este projeto enviado ao GitHub;
- `RHYNO_CLIENT_ID` e `RHYNO_CLIENT_SECRET` válidos.

Nunca coloque as credenciais da Rhyno em arquivos enviados ao GitHub.

## Publicação pelo painel do Cloudflare

1. Entre em https://dash.cloudflare.com/.
2. Abra **Workers & Pages**.
3. Clique em **Create application**.
4. Selecione **Import a repository** ou **Connect to Git**.
5. Conecte sua conta do GitHub e escolha o repositório deste projeto.
6. Use o nome `rhyno-apostas`.
7. Configure o comando de build como `pnpm run build:vinext`.
8. Configure o comando de deploy como `pnpm run deploy:vinext` caso o painel solicite esse campo.
9. Salve e aguarde o primeiro deploy.

## Credenciais da Rhyno

Depois que o Worker for criado:

1. Abra o Worker `rhyno-apostas`.
2. Entre em **Settings**.
3. Abra **Variables and Secrets**.
4. Adicione `RHYNO_CLIENT_ID` como **Secret**.
5. Adicione `RHYNO_CLIENT_SECRET` como **Secret**.
6. Adicione `EXPORT_PASSWORD` como **Secret**. Essa será a senha usada para finalizar rinhas, exportar pagamentos e marcar ganhadores como pagos.
7. Salve sem colocar aspas ou o sinal `=` no nome.

## Histórico e pagamentos (D1)

O histórico precisa de um banco D1 para continuar salvo depois de cada deploy:

1. No painel do Cloudflare, abra **Storage & Databases** → **D1 SQL database**.
2. Clique em **Create database**, use o nome `rinha-historico` e conclua.
3. Copie o **Database ID** mostrado na página do banco.
4. No arquivo `wrangler.jsonc`, adicione antes do último `}`:

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "rinha-historico",
    "database_id": "COLE_AQUI_O_DATABASE_ID"
  }
]
```

5. Envie essa alteração ao GitHub. O Cloudflare fará um novo deploy automaticamente.

Não é preciso criar tabelas manualmente: o aplicativo cria as tabelas de rinhas e pagamentos no primeiro acesso.

## Novo deploy

Depois de cadastrar os segredos e o D1, abra **Deployments** e faça um novo deploy. Alterações futuras enviadas à branch `main` também serão publicadas automaticamente.

## Configuração esperada

| Campo | Valor |
| --- | --- |
| Framework | Next.js / Worker |
| Build command | `pnpm run build:vinext` |
| Deploy command | `pnpm run deploy:vinext` |
| Node.js | 20 ou superior |
| D1 binding | `DB` |
| Senha administrativa | `EXPORT_PASSWORD` (Secret) |

O painel atualiza os dados a cada 60 segundos para reduzir o uso gratuito.

## Teste

Abra a URL terminada em `.workers.dev`. Se aparecer erro de credenciais ausentes, confira se os dois segredos foram cadastrados e faça um novo deploy. Se aparecer `401 Invalid credentials`, as credenciais existem, mas precisam ser validadas ou recriadas pela equipe da Rhyno.
