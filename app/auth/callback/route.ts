import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isSafeNext } from '@/lib/util'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('next')
  const target = isSafeNext(next) ? next! : '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(new URL(target, url.origin))
  }
  return NextResponse.redirect(new URL('/?login=failed', url.origin))
}
