import Link from 'next/link'
import type { Metadata } from 'next'
import { loadOwnScript } from '@/lib/owner'
import VersionForm from '@/components/VersionForm'
import LoginRequired from '@/components/LoginRequired'
import { compareVersions } from '@/lib/util'

export const metadata: Metadata = { title: 'Новая версия' }
export const dynamic = 'force-dynamic'

export default async function NewVersionPage({ params }: { params: Promise<{ game: string; slug: string }> }) {
  const { game: gameSlug, slug } = await params
  const { supabase, user, profile, game, script } = await loadOwnScript(gameSlug, slug)
  if (!user || !profile) return <LoginRequired text="Войди, чтобы загрузить новую версию." />

  const { data: versions } = await supabase.from('script_versions').select('version, status').eq('script_id', script.id)
  const live = (versions ?? []).filter((v) => v.status !== 'rejected').map((v) => v.version)
  const latest = live.sort(compareVersions).at(-1) ?? null
  const href = `/s/${game.slug}/${script.slug}`

  return (
    <div className="container stack gap-24" style={{ paddingTop: 32, paddingBottom: 72, maxWidth: 860 }}>
      <div className="stack gap-4">
        <span className="muted small"><Link href={href} style={{ color: 'var(--muted)' }}>← {script.title}</Link></span>
        <h1 className="page-title">Загрузить новую версию</h1>
        <span className="muted">
          {profile.role !== 'user'
            ? 'Версия опубликуется сразу, если автопроверка не найдёт ничего опасного, и придёт игрокам автообновлением.'
            : 'Модератор увидит, что изменилось в коде, и после одобрения версия придёт игрокам автообновлением.'}
        </span>
      </div>
      <VersionForm
        userId={user.id}
        scriptId={script.id}
        kind={script.kind}
        href={href}
        latest={latest}
        trusted={profile.role !== 'user'}
        hasPending={(versions ?? []).some((v) => v.status === 'pending')}
      />
    </div>
  )
}
