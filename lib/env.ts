import type { NextRequest } from 'next/server'

export function getRequestOrigin(request: NextRequest) {
  const proto = request.headers.get('x-forwarded-proto') || 'http'
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host')
  if (!host) return 'http://localhost:3000'
  return `${proto}://${host}`
}

export function getConfiguredAppUrl() {
  const value = process.env.APP_URL?.trim().replace(/\/$/, '')
  if (!value || value === 'http://localhost:3000') return null
  return value
}

export function getOAuthBaseUrl(request: NextRequest) {
  // Prefer the actual URL the user is visiting. This avoids a common Vercel issue:
  // state cookie is set on one domain, but GitHub redirects to another APP_URL domain.
  return getRequestOrigin(request)
}

export function getPostLoginRedirectUrl(request: NextRequest) {
  return getConfiguredAppUrl() || getRequestOrigin(request)
}

export function requiredEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing environment variable: ${name}`)
  return value
}

export function githubScopes() {
  return process.env.GITHUB_SCOPES || 'read:user user:email public_repo'
}
