import Link from 'next/link'
import type { Metadata } from 'next'
import { requireModerator } from '@/lib/mod'
import { authorName } from '@/lib/queries'
import { readAutocheck, ROLE_LABEL, timeAgo } from '@/lib/util'
import { ReportActions, UnhideButton } from '@/components/ModActions'

export const metadata: Metadata = { title: 'Модерация' }
export const dynamic = 'force-dynamic'

type QScript = { id: string; title: string; slug: string; kind: string; status: string; current_version_id: string | null; game: { slug: string } | null; author: { display_name: string | null; username: string | null; role: keyof typeof ROLE_LABEL } | null }

const LEVEL_BADGE = { ok: ['badge-ok', 'чисто'], warn: ['badge-warn', 'есть предупреждения'], danger: ['badge-bad', 'опасно'] } as const

export default async function ModPage() {
  const { supabase } = await requireModerator()

  const [{ data: versions }, { data: reports }, { data: hidden }] = await Promise.all([
    supabase
      .from('script_versions')
      .select('id, version, changelog, created_at, autocheck, script:scripts!script_versions_script_id_fkey(id, title, slug, kind, status, current_version_id, game:games(slug), author:profiles(display_name, username, role))')
      .eq('status', 'pending')
      .order('created_at'),
    supabase
      .from('reports')
      .select('id, reason, created_at, script:scripts(id, title, slug, status, open_reports, game:games(slug)), user:profiles!reports_user_id_fkey(display_name, username)')
      .eq('status', 'open')
      .order('created_at'),
    supabase.from('scripts').select('id, title, slug, open_reports, game:games(slug)').eq('status', 'hidden'),
  ])

  return (
    <div className="container wide stack gap-32" style={{ paddingTop: 28, paddingBottom: 72 }}>
      <section className="stack gap-16">
        <div className="row gap-12" style={{ alignItems: 'baseline' }}>
          <h1 className="page-title">Очередь на проверку</h1>
          <span className="muted">{versions?.length ?? 0} в очереди</span>
        </div>
        {(versions ?? []).length === 0 && <div className="panel muted">Очередь пуста — всё проверено.</div>}
        <div className="stack gap-8">
          {(versions ?? []).map((v) => {
            const s = v.script as unknown as QScript
            const check = readAutocheck(v.autocheck)
            const level = check?.level ?? 'ok'
            const isUpdate = Boolean(s.current_version_id)
            return (
              <Link key={v.id} href={`/mod/v/${v.id}`} className="list-row" style={{ alignItems: 'center' }}>
                <span className={`badge ${isUpdate ? 'badge-info' : 'badge-warn'}`}>{isUpdate ? 'Обновление' : 'Новый скрипт'}</span>
                <div className="stack grow" style={{ flexBasis: 260, minWidth: 0 }}>
                  <span style={{ fontWeight: 600 }}>{s.title} <span className="mono tiny muted">v{v.version}</span></span>
                  <span className="muted tiny">@{authorName(s.author)} · {s.author ? ROLE_LABEL[s.author.role] : ''} · {v.changelog || 'без описания'}</span>
                </div>
                <span className={`badge ${LEVEL_BADGE[level][0]}`}>{LEVEL_BADGE[level][1]}</span>
                <span className="faint tiny">{timeAgo(v.created_at)}</span>
              </Link>
            )
          })}
        </div>
      </section>

      <section className="stack gap-16">
        <h2 className="section-title">Жалобы</h2>
        {(reports ?? []).length === 0 && <div className="panel muted">Открытых жалоб нет.</div>}
        {(reports ?? []).map((r) => {
          const s = r.script as unknown as { id: string; title: string; slug: string; status: string; open_reports: number; game: { slug: string } | null }
          const u = r.user as unknown as { display_name: string | null; username: string | null } | null
          return (
            <div key={r.id} className="panel stack gap-12">
              <div className="row gap-12">
                <span className="badge badge-bad">Жалоба</span>
                <Link href={`/s/${s.game?.slug}/${s.slug}`} style={{ fontWeight: 600 }}>{s.title}</Link>
                {s.status === 'hidden' && <span className="badge badge-bad">скрыт</span>}
                <span className="muted tiny">всего открытых: {s.open_reports}</span>
                <span className="grow" />
                <span className="faint tiny">@{authorName(u)} · {timeAgo(r.created_at)}</span>
              </div>
              <p style={{ color: 'var(--text-2)', whiteSpace: 'pre-line', overflowWrap: 'anywhere' }}>{r.reason}</p>
              <ReportActions reportId={r.id} scriptId={s.id} scriptStatus={s.status} />
            </div>
          )
        })}
      </section>

      {(hidden ?? []).length > 0 && (
        <section className="stack gap-16">
          <h2 className="section-title">Скрытые скрипты</h2>
          <div className="table">
            {(hidden ?? []).map((s) => {
              const g = s.game as unknown as { slug: string } | null
              return (
                <div key={s.id} className="table-row">
                  <Link href={`/s/${g?.slug}/${s.slug}`} className="grow" style={{ fontWeight: 600 }}>{s.title}</Link>
                  <span className="muted tiny">открытых жалоб: {s.open_reports}</span>
                  <UnhideButton scriptId={s.id} />
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
