import Link from 'next/link'
import type { Metadata } from 'next'
import { loadOwnScript } from '@/lib/owner'
import ScriptForm from '@/components/ScriptForm'
import LoginRequired from '@/components/LoginRequired'

export const metadata: Metadata = { title: 'Редактировать скрипт' }
export const dynamic = 'force-dynamic'

export default async function EditScriptPage({ params }: { params: Promise<{ game: string; slug: string }> }) {
  const { game: gameSlug, slug } = await params
  const { supabase, user, profile, game, script } = await loadOwnScript(gameSlug, slug)
  if (!user || !profile) return <LoginRequired text="Войди, чтобы редактировать свой скрипт." />

  const [{ data: categories }, { data: shots }] = await Promise.all([
    supabase.from('categories').select('id, name').order('sort'),
    supabase.from('screenshots').select('id, path').eq('script_id', script.id).order('position'),
  ])

  return (
    <div className="container stack gap-24" style={{ paddingTop: 32, paddingBottom: 72 }}>
      <div className="stack gap-4">
        <span className="muted small"><Link href={`/s/${game.slug}/${script.slug}`} style={{ color: 'var(--muted)' }}>← {script.title}</Link></span>
        <h1 className="page-title">Редактировать карточку</h1>
        <span className="muted">Текст и скриншоты меняются сразу. Чтобы обновить сам код, <Link href={`/s/${game.slug}/${script.slug}/version`}>загрузи новую версию</Link>.</span>
      </div>
      <ScriptForm
        userId={user.id}
        games={[game]}
        categories={categories ?? []}
        trusted={profile.role !== 'user'}
        initial={{
          id: script.id,
          slug: script.slug,
          gameSlug: game.slug,
          game_id: game.id,
          kind: script.kind,
          title: script.title,
          short_desc: script.short_desc,
          description: script.description,
          category_id: script.category_id,
          store_url: script.store_url,
          shots: shots ?? [],
        }}
      />
    </div>
  )
}
