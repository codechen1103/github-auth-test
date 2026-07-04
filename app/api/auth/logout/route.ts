import { NextResponse } from 'next/server'
import { clearSession } from '@/lib/session'

export const runtime = 'nodejs'

export async function POST() {
  const response = NextResponse.json({ ok: true })
  clearSession(response)
  return response
}
