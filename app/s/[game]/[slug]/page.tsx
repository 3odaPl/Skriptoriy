import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getViewer, createClient } from '@/lib/supabase/server'
import { authorName } from '@/lib/queries'
import { formatCount, KIND_LABEL, plural, readAutocheck, ROLE_LABEL, STATUS_LABEL, timeAgo, VERSION_STATUS_LABEL } from '@/lib/util'
import Gallery from '@/components/Gallery'
import Tabs from '@/components/Tabs'
import Markdown from '@/components/Markdown'
import ReviewForm from '@/components/ReviewForm'
import ReportButton from '@/components/ReportButton'
import LoginButton from '@/components/LoginButton'
import AutocheckList from '@/components/AutocheckList'
import { DownloadIcon } from '@/components/Icons'

export const dynamic = 'force-dynamic'

type Params = Promise<{ game: string; slug: string }>

async function load(gameSlug: string, slug: string) {
  const supabase = await createClient()
  const { data: game } = await supabase.from('games').select('*').eq('slug', gameSlug).maybeSingle()
  if (!game) return null
  const { data: script } = await supabase
    .from('scripts')
    .select('*, category:categories(name, slug), author:profiles(id, display_name, username, avatar_url, role)')
    .eq('game_id', game.id)
    .eq('slug', slug)
    .maybeSingle()
  if (!script) return null
  return { game, script }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { game, slug } = await params
  const data = await load(game, slug)
  if (!data) return { title: 'Скрипт не найден' }
  return { title: `${data.script.title} — ${data.game.name}`, description: data.script.short_desc }
}

export default async function ScriptPage({ params }: { params: Params }) {
  const { game: gameSlug, slug } = await params
  const data = await load(gameSlug, slug)
  if (!data) notFound()
  const { game, script } = data
  const { supabase, user, profile } = await getViewer()

  const [{ data: shots }, { data: versions }, { data: reviews }, { count: authorScripts }] = await Promise.all([
    supabase.from('screenshots').select('path, position').eq('script_id', script.id).order('position'),
    supabase.from('script_versions').select('id, version, changelog, status, created_at, review_note, autocheck').eq('script_id', script.id).order('created_at', { ascending: false }),
    supabase.from('reviews').select('id, rating, body, created_at, user_id, user:profiles(display_name, username, avatar_url)').eq('script_id', script.id).order('created_at', { ascending: false }),
    supabase.from('scripts').select('id', { count: 'exact', head: true }).eq('author_id', script.author_id).eq('status', 'published'),
  ])

  const author = script.author as unknown as { id: string; display_name: string | null; username: string | null; avatar_url: string | null; role: keyof typeof ROLE_LABEL } | null
  const category = script.category as unknown as { name: string; slug: string } | null
  const isOwner = user?.id === script.author_id
  const isMod = profile?.role === 'moderator' || profile?.role === 'admin'
  const current = versions?.find((v) => v.id === script.current_version_id) ?? null
  const approved = (versions ?? []).filter((v) => v.status === 'approved')
  const pending = (versions ?? []).filter((v) => v.status !== 'approved')
  const check = readAutocheck(current?.autocheck)
  const myReview = reviews?.find((r) => r.user_id === user?.id) ?? null
  const otherReviews = (reviews ?? []).filter((r) => r.user_id !== user?.id)
  const installBase = `/i/${game.slug}/${script.slug}`
  const published = script.status === 'published'
  const authorTrusted = author?.role && author.role !== 'user'

  return (
    <div className="container stack gap-24" style={{ paddingTop: 24, paddingBottom: 72 }}>
      <span className="muted small">
        <Link href="/" style={{ color: 'var(--muted)' }}>Главная</Link> / <Link href={`/g/${game.slug}`} style={{ color: 'var(--muted)' }}>{game.name}</Link>
        {category && <> / {category.name}</>}
      </span>

      {!published && (
        <div className={`notice${script.status === 'rejected' ? ' bad' : ''}`}>
          <span>
            Статус: <b>{STATUS_LABEL[script.status]}</b>.{' '}
            {script.status === 'pending' && 'Скрипт ждёт проверки модератором, игроки его пока не видят.'}
            {script.status === 'draft' && 'Скрипт ещё не отправлен на проверку.'}
            {script.status === 'rejected' && 'Модератор отклонил скрипт. Причина указана во вкладке «Версии». Исправь и загрузи новую версию.'}
            {script.status === 'hidden' && 'Скрипт скрыт из каталога (жалобы или решение модератора).'}
          </span>
        </div>
      )}

      {(isOwner || isMod) && (
        <div className="row gap-12">
          {isOwner && <Link href={`/s/${game.slug}/${script.slug}/version`} className="btn btn-primary btn-sm">Загрузить новую версию</Link>}
          {isOwner && <Link href={`/s/${game.slug}/${script.slug}/edit`} className="btn btn-ghost btn-sm">Редактировать описание и скриншоты</Link>}
          {isMod && <Link href="/mod" className="btn btn-ghost btn-sm">Открыть модерацию</Link>}
        </div>
      )}

      <div className="with-aside">
        <div className="main-col stack gap-24">
          <div className="stack gap-12">
            <div className="row gap-8">
              {published && (authorTrusted || current?.status === 'approved') && <span className="badge badge-ok">✓ Проверено</span>}
              <span className="badge">{KIND_LABEL[script.kind]}</span>
              {category && <span className="badge">{category.name}</span>}
            </div>
            <h1 className="page-title" style={{ fontSize: 'clamp(28px, 4vw, 40px)' }}>{script.title}</h1>
            {script.short_desc && <p className="muted" style={{ fontSize: 17 }}>{script.short_desc}</p>}
          </div>

          <Gallery paths={(shots ?? []).map((s) => s.path)} title={script.title} />

          <Tabs
            tabs={[
              {
                id: 'desc',
                label: 'Описание',
                content: script.description ? <Markdown>{script.description}</Markdown> : <p className="muted">Автор пока не добавил подробное описание.</p>,
              },
              {
                id: 'versions',
                label: `Версии · ${approved.length}`,
                content: (
                  <div className="stack gap-16">
                    {(isOwner || isMod) && pending.length > 0 && (
                      <div className="table">
                        {pending.map((v) => (
                          <div key={v.id} className="table-row" style={{ alignItems: 'flex-start' }}>
                            <span className="mono" style={{ minWidth: 70 }}>v{v.version}</span>
                            <span className={`badge ${v.status === 'rejected' ? 'badge-bad' : 'badge-warn'}`}>{VERSION_STATUS_LABEL[v.status]}</span>
                            <span className="small grow" style={{ flexBasis: 240, color: 'var(--text-2)' }}>
                              {v.changelog || 'Без описания изменений'}
                              {v.review_note && <span className="stack tiny" style={{ color: 'var(--bad)', marginTop: 4 }}>Модератор: {v.review_note}</span>}
                            </span>
                            <span className="faint tiny">{timeAgo(v.created_at)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {approved.length === 0 ? (
                      <p className="muted">Одобренных версий пока нет.</p>
                    ) : (
                      <div className="table">
                        {approved.map((v) => (
                          <div key={v.id} className="table-row">
                            <span className="mono" style={{ color: 'var(--accent)', minWidth: 70 }}>v{v.version}</span>
                            <span className="small grow" style={{ flexBasis: 240, color: 'var(--text-2)' }}>{v.changelog || 'Без описания изменений'}</span>
                            <span className="faint tiny">{timeAgo(v.created_at)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ),
              },
              {
                id: 'reviews',
                label: `Отзывы · ${reviews?.length ?? 0}`,
                content: (
                  <div className="stack gap-16">
                    {published && !isOwner && (user ? (
                      <ReviewForm scriptId={script.id} existing={myReview ? { id: myReview.id, rating: myReview.rating, body: myReview.body } : null} />
                    ) : (
                      <div className="panel row gap-12"><span className="grow">Войди, чтобы оставить отзыв.</span><LoginButton /></div>
                    ))}
                    {otherReviews.length === 0 && !myReview && <p className="muted">Отзывов пока нет.</p>}
                    {otherReviews.map((r) => {
                      const u = r.user as unknown as { display_name: string | null; username: string | null; avatar_url: string | null } | null
                      return (
                        <div key={r.id} className="row gap-12" style={{ alignItems: 'flex-start', flexWrap: 'nowrap' }}>
                          {u?.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={u.avatar_url} alt="" className="avatar" />
                          ) : <span className="avatar" />}
                          <div className="stack gap-4">
                            <div className="row gap-8">
                              <span style={{ fontWeight: 600 }}>@{authorName(u)}</span>
                              <span className="stars tiny" aria-label={`${r.rating} из 5`}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                              <span className="faint tiny">{timeAgo(r.created_at)}</span>
                            </div>
                            {r.body && <span style={{ color: 'var(--text-2)', whiteSpace: 'pre-line', overflowWrap: 'anywhere' }}>{r.body}</span>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ),
              },
            ]}
          />
        </div>

        <aside className="side-col stack gap-16">
          <div className="panel stack gap-12">
            {published && current ? (
              script.kind === 'userscript' ? (
                <>
                  <a href={`${installBase}.user.js`} className="btn btn-primary btn-lg"><DownloadIcon color="#1A1305" /> Установить</a>
                  <span className="muted tiny" style={{ textAlign: 'center' }}>Нужен Tampermonkey · <Link href="/#how">как поставить</Link></span>
                </>
              ) : (
                <>
                  {script.store_url && <a href={script.store_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-lg">Открыть в магазине ↗</a>}
                  <a href={`${installBase}.zip`} className={`btn ${script.store_url ? 'btn-ghost' : 'btn-primary btn-lg'}`}><DownloadIcon /> Скачать архив .zip</a>
                  <details className="small">
                    <summary style={{ cursor: 'pointer', color: 'var(--accent)' }}>Как установить архив</summary>
                    <ol className="muted" style={{ paddingLeft: 20, margin: '8px 0 0' }}>
                      <li>Распакуй архив в отдельную папку.</li>
                      <li>Открой <span className="mono">chrome://extensions</span>.</li>
                      <li>Включи «Режим разработчика» справа вверху.</li>
                      <li>Нажми «Загрузить распакованное» и выбери папку.</li>
                    </ol>
                  </details>
                </>
              )
            ) : (
              <span className="muted small">Установка станет доступна после проверки модератором.</span>
            )}
            <div className="grid-2" style={{ gap: 12, paddingTop: 12, borderTop: '1px solid var(--border-soft)', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
              <Fact label="Версия" value={current ? <span className="mono">v{current.version}</span> : '—'} />
              <Fact label="Обновлён" value={timeAgo(script.updated_at)} />
              <Fact label="Рейтинг" value={script.rating_count > 0 ? <>★ {Number(script.rating_avg).toFixed(1)} <span className="faint">({script.rating_count})</span></> : 'нет оценок'} />
              <Fact label="Установок" value={formatCount(script.installs_count)} />
            </div>
          </div>

          {check && (
            <div className="panel stack gap-12">
              <span style={{ fontWeight: 600 }}>Автопроверка кода</span>
              <AutocheckList check={check} />
              <span className="faint tiny">Проверка автоматическая и не заменяет здравый смысл: ставь скрипты только от тех, кому доверяешь.</span>
            </div>
          )}

          {author && (
            <div className="panel row gap-12" style={{ flexWrap: 'nowrap', padding: '16px 20px' }}>
              {author.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={author.avatar_url} alt="" className="avatar avatar-lg" />
              ) : <span className="avatar avatar-lg" />}
              <div className="stack grow" style={{ minWidth: 0 }}>
                <span style={{ fontWeight: 600 }}>@{authorName(author)}</span>
                <span className="tiny" style={{ color: author.role === 'user' ? 'var(--muted)' : 'var(--accent)' }}>{ROLE_LABEL[author.role]}</span>
                <span className="muted tiny">{authorScripts ?? 0} {plural(authorScripts ?? 0, 'скрипт', 'скрипта', 'скриптов')}</span>
              </div>
            </div>
          )}

          {published && !isOwner && <ReportButton scriptId={script.id} loggedIn={Boolean(user)} />}
        </aside>
      </div>
    </div>
  )
}

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="stack">
      <span className="faint tiny">{label}</span>
      <span>{value}</span>
    </div>
  )
}
