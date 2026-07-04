import { NextRequest, NextResponse } from 'next/server'
import { getAppUrl, getRequestOrigin, requiredEnv } from '@/lib/env'
import { exchangeCodeForToken, getCurrentUser } from '@/lib/github'
import { STATE_COOKIE, clearOAuthState, setSession } from '@/lib/session'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const appUrl = getAppUrl(request)
  const requestOrigin = getRequestOrigin(request)
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const error = url.searchParams.get('error')
  const expectedState = request.cookies.get(STATE_COOKIE)?.value

  if (requestOrigin !== appUrl) {
    const target = new URL(appUrl)
    target.searchParams.set('error', 'callback_origin_mismatch')
    target.searchParams.set('callback_origin', requestOrigin)
    return NextResponse.redirect(target)
  }

  if (error) {
    return NextResponse.redirect(`${appUrl}/?error=${encodeURIComponent(error)}`)
  }

  if (!code || !state || !expectedState || state !== expectedState) {
    const reason = !code
      ? 'missing_code'
      : !state
        ? 'missing_state'
        : !expectedState
          ? 'missing_state_cookie_domain_or_cookie_blocked'
          : 'state_mismatch'

    const target = new URL(appUrl)
    target.searchParams.set('error', 'oauth_state_invalid')
    target.searchParams.set('reason', reason)
    target.searchParams.set('callback_origin', requestOrigin)
    return NextResponse.redirect(target)
  }

  const redirectUri = `${appUrl}/api/auth/github/callback`
  const { accessToken, scopes } = await exchangeCodeForToken({
    clientId: requiredEnv('GITHUB_CLIENT_ID'),
    clientSecret: requiredEnv('GITHUB_CLIENT_SECRET'),
    code,
    redirectUri
  })

  const user = await getCurrentUser(accessToken, scopes)

  const response = NextResponse.redirect(appUrl)
  clearOAuthState(response)
  setSession(response, {
    accessToken,
    scopes,
    user,
    createdAt: Date.now()
  })
  return response
}
