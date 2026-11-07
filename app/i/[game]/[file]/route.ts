import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { patchUserscript } from '@/lib/util'

// Install endpoints:
//   /i/legion/my-script.user.js  → full script (counts an install, used by @downloadURL)
//   /i/legion/my-script.meta.js  → header only (Tampermonkey update checks, not counted)
//   /i/legion/my-script.zip      → redirect to the approved extension archive
export async function GET(request: Request, { params }: { params: Promise<{ game: string; file: string }> }) {
  const { game, file } = await params
  const m = file.match(/^([a-z0-9-]{2,60})\.(user\.js|meta\.js|zip)$/)
  if (!m) return new NextResponse('Not found', { status: 404 })
  const [, slug, ext] = m

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_install', { p_game: game, p_slug: slug, p_count: ext !== 'meta.js' })
  const row = data?.[0]
  if (error || !row) return new NextResponse('Скрипт не найден или ещё не опубликован', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })

  if (ext === 'zip') {
    if (row.kind !== 'extension' || !row.file_path) return new NextResponse('Not found', { status: 404 })
    const { data: signed, error: signError } = await supabase.storage.from('script-files').createSignedUrl(row.file_path, 300, { download: `${slug}-${row.version}.zip` })
    if (signError || !signed) return new NextResponse('Архив недоступен', { status: 404 })
    return NextResponse.redirect(signed.signedUrl, 302)
  }

  if (row.kind !== 'userscript' || !row.code) return new NextResponse('Not found', { status: 404 })

  const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin
  const base = `${origin}/i/${game}/${slug}`
  const { full, header } = patchUserscript(row.code, { version: row.version, base })

  return new NextResponse(ext === 'meta.js' ? header + '\n' : full, {
    headers: {
      'Content-Type': 'text/javascript; charset=utf-8',
      // Downloads must reach the server to be counted; update checks can be cached briefly.
      'Cache-Control': ext === 'meta.js' ? 'public, max-age=60, s-maxage=60' : 'no-store',
    },
  })
}
