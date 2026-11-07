import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { requireModerator } from '@/lib/mod'
import { authorName } from '@/lib/queries'
import { readAutocheck, ROLE_LABEL, timeAgo, VERSION_STATUS_LABEL } from '@/lib/util'
import AutocheckList from '@/components/AutocheckList'
import { buildDiff, CodeLines, plainLines } from '@/components/CodeDiff'
import { VersionActions, ZipDownload } from '@/components/ModActions'

export const metadata: Metadata = { title: 'Проверка версии' }
export const dynamic = 'force-dynamic'

export default async function ModVersionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase, isAdmin } = await requireModerator()

  const { data: v } = await supabase
    .from('script_versions')
    .select('*, script:scripts!script_versions_script_id_fkey(id, title, slug, kind, short_desc, current_version_id, author_id, game:games(slug, name), author:profiles(id, display_name, username, role))')
    .eq('id', id)
    .maybeSingle()
  if (!v) notFound()

  const s = v.script as unknown as {
    id: string; title: string; slug: string; kind: 'userscript' | 'extension'; short_desc: string; current_version_id: string | null; author_id: string
    game: { slug: string; name: string } | null
    author: { id: string; display_name: string | null; username: string | null; role: keyof typeof ROLE_LABEL } | null
  }

  let previous: { version: string; code: string | null } | null = null
  if (s.current_version_id && s.current_version_id !== v.id) {
    const { data } = await supabase.from('script_versions').select('version, code').eq('id', s.current_version_id).maybeSingle()
    previous = data
  }

  const check = readAutocheck(v.autocheck)
  const diff = v.code != null && previous?.code != null ? buildDiff(previous.code, v.code) : null
  const lines = diff ? diff.lines : v.code != null ? plainLines(v.code) : []

  return (
    <div className="container wide stack gap-20" style={{ paddingTop: 28, paddingBottom: 72 }}>
      <span className="muted small"><Link href="/mod" style={{ color: 'var(--muted)' }}>← Очередь</Link></span>

      <div className="panel stack gap-12">
        <div className="row gap-12">
          <span className={`badge ${previous ? 'badge-info' : 'badge-warn'}`}>{previous ? 'Обновление' : 'Новый скрипт'}</span>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>{s.title}</h1>
          <span className="mono muted">{previous ? `v${previous.version} → ` : ''}v{v.version}</span>
          <span className={`badge ${v.status === 'pending' ? 'badge-warn' : v.status === 'approved' ? 'badge-ok' : 'badge-bad'}`}>{VERSION_STATUS_LABEL[v.status]}</span>
        </div>
        <span className="muted">
          Автор @{authorName(s.author)} · {s.author ? ROLE_LABEL[s.author.role] : ''} · {s.game?.name} · загружено {timeAgo(v.created_at)} ·{' '}
          <Link href={`/s/${s.game?.slug}/${s.slug}`}>карточка скрипта</Link>
        </span>
        <div style={{ padding: '12px 14px', borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--border-soft)' }}>
          <span className="faint tiny">Что нового (от автора): </span>
          <span style={{ color: 'var(--text-2)' }}>{v.changelog || '—'}</span>
        </div>
      </div>

      {check && (
        <div className="panel stack gap-12">
          <span style={{ fontWeight: 600 }}>Автопроверка</span>
          <AutocheckList check={check} />
        </div>
      )}

      {s.kind === 'extension' ? (
        <div className="panel stack gap-12" style={{ alignItems: 'flex-start' }}>
          <span style={{ fontWeight: 600 }}>Архив расширения</span>
          <span className="muted small">Скачай архив, распакуй и проверь manifest.json (permissions, host_permissions) и скрипты.</span>
          {v.file_path && <ZipDownload path={v.file_path} />}
        </div>
      ) : (
        <div className="stack" style={{ border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
          <div className="row gap-16" style={{ padding: '12px 16px', background: 'var(--surface)' }}>
            <span style={{ fontWeight: 600 }}>{diff ? 'Изменения в коде' : 'Код скрипта'}</span>
            <span className="grow" />
            {diff && <span className="mono tiny" style={{ color: 'var(--ok)' }}>+{diff.added}</span>}
            {diff && <span className="mono tiny" style={{ color: 'var(--bad)' }}>−{diff.removed}</span>}
            {!diff && <span className="muted tiny">{lines.length} строк</span>}
          </div>
          <CodeLines lines={lines} />
        </div>
      )}

      {v.status === 'pending' ? (
        <VersionActions versionId={v.id} authorId={s.author_id} authorIsNew={s.author?.role === 'user'} isAdmin={isAdmin} />
      ) : (
        <div className="panel muted">Версия уже проверена{v.review_note ? `: ${v.review_note}` : ''}.</div>
      )}
    </div>
  )
}
