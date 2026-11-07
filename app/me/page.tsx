import Link from 'next/link'
import type { Metadata } from 'next'
import { getViewer } from '@/lib/supabase/server'
import LoginRequired from '@/components/LoginRequired'
import { formatCount, KIND_LABEL, ROLE_LABEL, STATUS_LABEL, timeAgo, VERSION_STATUS_LABEL } from '@/lib/util'

export const metadata: Metadata = { title: 'Мои скрипты' }
export const dynamic = 'force-dynamic'

const STATUS_BADGE = { draft: '', pending: 'badge-warn', published: 'badge-ok', rejected: 'badge-bad', hidden: 'badge-bad' } as const

export default async function MyScriptsPage() {
  const { supabase, user, profile } = await getViewer()
  if (!user || !profile) return <LoginRequired text="Войди через Twitch, чтобы управлять своими скриптами." />

  const { data: scripts } = await supabase
    .from('scripts')
    .select('id, slug, title, kind, status, installs_count, rating_avg, rating_count, updated_at, game:games(slug, name), versions:script_versions!script_versions_script_id_fkey(id, version, status, review_note, created_at)')
    .eq('author_id', user.id)
    .order('updated_at', { ascending: false })

  return (
    <div className="container stack gap-24" style={{ paddingTop: 32, paddingBottom: 72 }}>
      <div className="row gap-16" style={{ justifyContent: 'space-between' }}>
        <div className="stack gap-4">
          <h1 className="page-title">Мои скрипты</h1>
          <span className="muted">Статус: <span style={{ color: profile.role === 'user' ? 'var(--text)' : 'var(--accent)' }}>{ROLE_LABEL[profile.role]}</span></span>
        </div>
        <Link href="/new" className="btn btn-primary">+ Добавить скрипт</Link>
      </div>

      {(scripts ?? []).length === 0 && (
        <div className="panel"><span className="muted">У тебя пока нет скриптов.</span></div>
      )}

      {(scripts ?? []).map((s) => {
        const game = s.game as unknown as { slug: string; name: string }
        const versions = [...((s.versions as unknown as { id: string; version: string; status: 'pending' | 'approved' | 'rejected'; review_note: string | null; created_at: string }[]) ?? [])]
          .sort((a, b) => b.created_at.localeCompare(a.created_at))
        const lastVersion = versions[0]
        const href = `/s/${game.slug}/${s.slug}`
        return (
          <div key={s.id} className="panel stack gap-12">
            <div className="row gap-12">
              <Link href={href} style={{ fontWeight: 600, fontSize: 17, color: 'var(--text)' }}>{s.title}</Link>
              <span className={`badge ${STATUS_BADGE[s.status]}`}>{STATUS_LABEL[s.status]}</span>
              <span className="badge">{KIND_LABEL[s.kind]}</span>
              <span className="muted tiny">{game.name}</span>
              <span className="grow" />
              <span className="muted tiny">↓ {formatCount(s.installs_count)}</span>
              {s.rating_count > 0 && <span className="muted tiny">★ {Number(s.rating_avg).toFixed(1)}</span>}
            </div>
            {lastVersion && (
              <div className="row gap-8 small">
                <span className="mono">v{lastVersion.version}</span>
                <span className={`badge ${lastVersion.status === 'approved' ? 'badge-ok' : lastVersion.status === 'rejected' ? 'badge-bad' : 'badge-warn'}`}>{VERSION_STATUS_LABEL[lastVersion.status]}</span>
                <span className="faint tiny">{timeAgo(lastVersion.created_at)}</span>
              </div>
            )}
            {lastVersion?.status === 'rejected' && lastVersion.review_note && (
              <div className="notice bad small">Модератор: {lastVersion.review_note}</div>
            )}
            <div className="row gap-8">
              <Link href={`${href}/version`} className="btn btn-ghost btn-sm">Новая версия</Link>
              <Link href={`${href}/edit`} className="btn btn-ghost btn-sm">Редактировать</Link>
              <Link href={href} className="btn btn-ghost btn-sm">Открыть</Link>
            </div>
          </div>
        )
      })}
    </div>
  )
}
