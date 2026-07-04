import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const session = getSession(request)
  if (!session) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })

  return NextResponse.json({
    user: session.user,
    scopes: session.scopes
  })
}
