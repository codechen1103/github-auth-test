import type { NextRequest } from 'next/server'

export function getRequestOrigin(request: NextRequest) {
  const proto = request.headers.get('x-forwarded-proto') || 'http'
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host')
  if (!host) return 'http://localhost:3000'
  return `${proto}://${host}`
}

export function getAppUrl(request?: NextRequest) {
  const fromEnv = process.env.APP_URL?.trim().replace(/\/$/, '')
  if (fromEnv) return fromEnv
  if (request) return getRequestOrigin(request)
  return 'http://localhost:3000'
}

export function requiredEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing environment variable: ${name}`)
  return value
}

export function githubScopes() {
  return process.env.GITHUB_SCOPES || 'read:user user:email public_repo'
}
