import "server-only"

const BASE_URL = "https://open-api.thecoolrhyno.com"

/* ---------- Tipos da API pública da Rhyno ---------- */

export type DonationStatus = "CREATED" | "PAID" | "CANCELED" | "EXPIRED"

export interface Donation {
  id: string
  streamerId: string
  amount: number
  username: string
  message?: string
  status: DonationStatus
  createdAt: string
}

export interface QueueField {
  id: string
  fieldKey: string
  label: string
  required: boolean
  sensitive?: boolean | string | number
  isSensitive?: boolean | string | number
}

export interface QueueEvent {
  id: string
  name: string
  description: string | null
  minValue: number
  maxEntries: number | null
  maxPerUser: number | null
  occupiedEntries: number
  availableEntries: number | null
  groupId: string | null
  groupName: string | null
  fields: QueueField[]
}

export interface QueueEntryFieldValue {
  label: string
  value: string
  sensitive?: boolean | string | number
  isSensitive?: boolean | string | number
}

export interface QueueEntry {
  id: string
  username: string
  message: string | null
  amount: number
  quantity: number
  fieldValues: QueueEntryFieldValue[]
  createdAt: string
}

export interface QueueEventDetail extends QueueEvent {
  entries: QueueEntry[]
}

/* ---------- Autenticação (token em cache na memória do servidor) ---------- */

interface CachedToken {
  accessToken: string
  expiresAt: number
  scopes: string[]
}

let tokenCache: CachedToken | null = null

async function getAccessToken(): Promise<string> {
  const now = Date.now()
  // Reaproveita o token enquanto faltar mais de 60s para expirar.
  if (tokenCache && tokenCache.expiresAt - 60_000 > now) {
    return tokenCache.accessToken
  }

  const clientId = process.env.RHYNO_CLIENT_ID
  const clientSecret = process.env.RHYNO_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error("Credenciais da Rhyno ausentes (RHYNO_CLIENT_ID / RHYNO_CLIENT_SECRET).")
  }

  const res = await fetch(`${BASE_URL}/v1/auth/token`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
    cache: "no-store",
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Falha ao autenticar na Rhyno (${res.status}): ${text}`)
  }

  const data = (await res.json()) as {
    access_token: string
    expires_in: number
    scopes: string[]
  }

  tokenCache = {
    accessToken: data.access_token,
    expiresAt: now + data.expires_in * 1000,
    scopes: data.scopes ?? [],
  }

  return tokenCache.accessToken
}

async function rhynoFetch<T>(path: string): Promise<T> {
  const token = await getAccessToken()
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { authorization: `Bearer ${token}` },
    cache: "no-store",
  })

  // Token pode ter sido revogado — tenta renovar uma vez.
  if (res.status === 401) {
    tokenCache = null
    const retryToken = await getAccessToken()
    const retry = await fetch(`${BASE_URL}${path}`, {
      headers: { authorization: `Bearer ${retryToken}` },
      cache: "no-store",
    })
    if (!retry.ok) {
      throw new Error(`Rhyno ${path} respondeu ${retry.status}`)
    }
    return retry.json() as Promise<T>
  }

  if (!res.ok) {
    throw new Error(`Rhyno ${path} respondeu ${res.status}`)
  }

  return res.json() as Promise<T>
}

/* ---------- Endpoints ---------- */

export async function listQueueEvents(): Promise<QueueEvent[]> {
  const data = await rhynoFetch<{ events: QueueEvent[] }>("/v1/queue-tickets")
  return data.events ?? []
}

export async function getQueueEventDetail(eventId: string, limit = 1000): Promise<QueueEventDetail> {
  return rhynoFetch<QueueEventDetail>(`/v1/queue-tickets/${eventId}?limit=${limit}`)
}

export interface DonationQuery {
  page?: number
  limit?: number
  from?: string
  to?: string
  status?: DonationStatus
}

export interface DonationPage {
  data: Donation[]
  meta: { total: number; page: number; limit: number; totalPages: number }
}

export async function listDonations(query: DonationQuery = {}): Promise<DonationPage> {
  const params = new URLSearchParams()
  params.set("page", String(query.page ?? 1))
  params.set("limit", String(query.limit ?? 20))
  if (query.from) params.set("from", query.from)
  if (query.to) params.set("to", query.to)
  if (query.status) params.set("status", query.status)
  return rhynoFetch<DonationPage>(`/v1/donations?${params.toString()}`)
}
