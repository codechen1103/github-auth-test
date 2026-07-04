import { NextRequest, NextResponse } from 'next/server'
import { getAppUrl, getRequestOrigin, githubScopes, requiredEnv } from '@/lib/env'
import { randomState, setOAuthState } from '@/lib/session'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const appUrl = getAppUrl(request)
  const requestOrigin = getRequestOrigin(request)

  // Important for Vercel:
  // If the user clicks login from a preview deployment domain, move them to the
  // canonical APP_URL first. Otherwise the state cookie is set on one domain but
  // GitHub redirects to another, or GitHub rejects redirect_uri.
  if (requestOrigin !== appUrl) {
    return NextResponse.redirect(`${appUrl}/api/auth/github`)
  }

  const clientId = requiredEnv('GITHUB_CLIENT_ID')
  const redirectUri = `${appUrl}/api/auth/github/callback`
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
