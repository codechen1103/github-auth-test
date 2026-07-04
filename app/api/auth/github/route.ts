import { NextRequest, NextResponse } from 'next/server'
import { getOAuthBaseUrl, githubScopes, requiredEnv } from '@/lib/env'
import { randomState, setOAuthState } from '@/lib/session'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const clientId = requiredEnv('GITHUB_CLIENT_ID')
  const baseUrl = getOAuthBaseUrl(request)
  const redirectUri = `${baseUrl}/api/auth/github/callback`
  const state = randomState()

  const authorizeUrl = new URL('https://github.com/login/oauth/authorize')
  authorizeUrl.searchParams.set('client_id', clientId)
  authorizeUrl.searchParams.set('redirect_uri', redirectUri)
  authorizeUrl.searchParams.set('scope', githubScopes())
  authorizeUrl.searchParams.set('state', state)

  const response = NextResponse.redirect(authorizeUrl)
  setOAuthState(response, state)
  return response
}
