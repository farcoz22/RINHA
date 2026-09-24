import "server-only"

import { cookies } from "next/headers"
import { getAdminPassword } from "@/lib/db"

export const SITE_ACCESS_COOKIE = "nuuh-site-access"

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest("SHA-256", bytes)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("")
}

export async function getSiteAccessToken() {
  const password = await getAdminPassword()
  return sha256(`batalhas-do-nuuhzao:v1:${password}`)
}

export async function hasSiteAccess() {
  const cookieStore = await cookies()
  const supplied = cookieStore.get(SITE_ACCESS_COOKIE)?.value
  if (!supplied) return false

  try {
    return supplied === await getSiteAccessToken()
  } catch {
    return false
  }
}
