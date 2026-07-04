import { NextRequest, NextResponse } from 'next/server'
import { getBaseUrl, requiredEnv } from '@/lib/env'
import { exchangeCodeForToken, getCurrentUser } from '@/lib/github'
import { STATE_COOKIE, clearOAuthState, setSession } from '@/lib/session'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const baseUrl = getBaseUrl(request)
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const error = url.searchParams.get('error')
  const expectedState = request.cookies.get(STATE_COOKIE)?.value

  if (error) {
    return NextResponse.redirect(`${baseUrl}/?error=${encodeURIComponent(error)}`)
  }

  if (!code || !state || !expectedState || state !== expectedState) {
    return new NextResponse('Invalid OAuth state or missing code', { status: 400 })
  }

  const { accessToken, scopes } = await exchangeCodeForToken({
    clientId: requiredEnv('GITHUB_CLIENT_ID'),
    clientSecret: requiredEnv('GITHUB_CLIENT_SECRET'),
    code,
    redirectUri: `${baseUrl}/api/auth/github/callback`
  })

  const user = await getCurrentUser(accessToken, scopes)

  const response = NextResponse.redirect(baseUrl)
  clearOAuthState(response)
  setSession(response, {
    accessToken,
    scopes,
    user,
    createdAt: Date.now()
  })
  return response
}
