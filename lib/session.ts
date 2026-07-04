import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export const SESSION_COOKIE = 'notes_generator_session'
export const STATE_COOKIE = 'notes_generator_oauth_state'

export type SessionUser = {
  id: number
  login: string
  name: string | null
  avatar_url: string
  html_url: string
  email: string | null
}

export type SessionData = {
  accessToken: string
  scopes: string[]
  user: SessionUser
  createdAt: number
}

const textEncoder = new TextEncoder()

export function randomState() {
  return randomBytes(24).toString('base64url')
}

export function getSession(request: NextRequest): SessionData | null {
  const value = request.cookies.get(SESSION_COOKIE)?.value
  if (!value) return null

  try {
    return JSON.parse(decrypt(value)) as SessionData
  }
  catch {
    return null
  }
}

export function setSession(response: NextResponse, session: SessionData) {
  response.cookies.set(SESSION_COOKIE, encrypt(JSON.stringify(session)), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24
  })
}

export function clearSession(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0
  })
}

export function setOAuthState(response: NextResponse, state: string) {
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 10
  })
}

export function clearOAuthState(response: NextResponse) {
  response.cookies.set(STATE_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0
  })
}

function key() {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret === 'replace_with_a_long_random_secret') {
    throw new Error('Missing SESSION_SECRET. Generate one with: openssl rand -base64 32')
  }
  return createHash('sha256').update(textEncoder.encode(secret)).digest()
}

function encrypt(plainText: string) {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key(), iv)
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, encrypted]).toString('base64url')
}

function decrypt(payload: string) {
  const buffer = Buffer.from(payload, 'base64url')
  const iv = buffer.subarray(0, 12)
  const tag = buffer.subarray(12, 28)
  const encrypted = buffer.subarray(28)
  const decipher = createDecipheriv('aes-256-gcm', key(), iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8')
}
