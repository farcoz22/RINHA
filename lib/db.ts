import "server-only"

type D1Result<T = unknown> = { results?: T[]; success: boolean }
type D1Statement = {
  bind: (...values: unknown[]) => D1Statement
  all: <T = unknown>() => Promise<D1Result<T>>
  run: () => Promise<D1Result>
}
type D1Database = {
  exec: (sql: string) => Promise<unknown>
  prepare: (sql: string) => D1Statement
  batch: (statements: D1Statement[]) => Promise<D1Result[]>
}

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS battles (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL,
  group_name TEXT NOT NULL,
  winner_event_id TEXT NOT NULL,
  winner_event_name TEXT NOT NULL,
  entry_total REAL NOT NULL,
  gross_pool REAL NOT NULL,
  fee REAL NOT NULL,
  net_pool REAL NOT NULL,
  winner_count INTEGER NOT NULL,
  prize_per_ticket REAL NOT NULL,
  closed_at TEXT NOT NULL
)`,
  `CREATE TABLE IF NOT EXISTS payouts (
  id TEXT PRIMARY KEY,
  battle_id TEXT NOT NULL,
  participant_id TEXT NOT NULL,
  username TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  prize REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  fields_json TEXT NOT NULL DEFAULT '[]',
  paid_at TEXT,
  FOREIGN KEY (battle_id) REFERENCES battles(id)
)`,
  `CREATE INDEX IF NOT EXISTS idx_payouts_battle ON payouts(battle_id)`,
  `CREATE TABLE IF NOT EXISTS sponsor_banner (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  image_base64 TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  updated_at TEXT NOT NULL
)`,
]

export async function getDb(): Promise<D1Database> {
  const { env } = await import("cloudflare:workers")
  const db = (env as unknown as { DB?: D1Database }).DB
  if (!db) throw new Error("Banco D1 ainda não configurado no Cloudflare")
  // O D1 pode interpretar incorretamente blocos com vários comandos no `exec`.
  // Executar cada instrução separadamente evita o erro "incomplete input".
  for (const statement of SCHEMA) {
    await db.prepare(statement).run()
  }
  return db
}

export async function getAdminPassword(): Promise<string> {
  const { env } = await import("cloudflare:workers")
  const value = (env as unknown as { EXPORT_PASSWORD?: string }).EXPORT_PASSWORD
  if (!value) throw new Error("EXPORT_PASSWORD ainda não configurada no Cloudflare")
  return value
}

export async function requireAdminPassword(request: Request) {
  const expected = await getAdminPassword()
  const supplied = request.headers.get("x-export-password") ?? ""
  if (supplied !== expected) throw new Error("Senha incorreta")
}
