import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CARD_SELECT, type CardScript } from '@/lib/queries'
import { ScriptCard } from '@/components/ScriptCard'
import { SearchIcon } from '@/components/Icons'
import { plural, screenshotUrl, timeAgo } from '@/lib/util'

export const dynamic = 'force-dynamic'

export default async function Home({ searchParams }: { searchParams: Promise<{ login?: string }> }) {
  const { login } = await searchParams
  const supabase = await createClient()

  const [{ data: games }, { data: popular }, { data: updated }, { count: total }, { data: authors }] = await Promise.all([
    supabase.from('games').select('id, slug, name, platform, channel, cover_path, scripts(count)').eq('scripts.status', 'published').order('created_at'),
    supabase.from('scripts').select(CARD_SELECT).eq('status', 'published').order('installs_count', { ascending: false }).limit(6),
    supabase.from('scripts').select(CARD_SELECT).eq('status', 'published').order('updated_at', { ascending: false }).limit(6),
    supabase.from('scripts').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('scripts').select('author_id').eq('status', 'published'),
  ])

  const authorCount = new Set((authors ?? []).map((a) => a.author_id)).size
  const popularList = (popular ?? []) as unknown as CardScript[]
  const updatedList = (updated ?? []) as unknown as CardScript[]
  const firstGame = games?.[0]?.slug ?? 'legion'

  return (
    <>
      {login === 'failed' && (
        <div className="container" style={{ paddingTop: 20 }}>
          <div className="notice bad">Вход через Twitch не удался. Попробуй ещё раз.</div>
        </div>
      )}

      <section className="container stack gap-24" style={{ paddingTop: 64, paddingBottom: 56 }}>
        <span className="badge badge-warn" style={{ alignSelf: 'flex-start', padding: '6px 12px', borderRadius: 999, fontSize: 13 }}>
          Скрипты больше не теряются в десятке Discord-серверов
        </span>
        <h1 className="display" style={{ fontSize: 'clamp(32px, 5vw, 56px)', lineHeight: 1.1, maxWidth: 860 }}>
          Все скрипты и расширения для игр со стримов — в одном месте
        </h1>
        <p className="muted" style={{ fontSize: 18, maxWidth: 640 }}>
          Устанавливай в один клик через Tampermonkey, получай обновления автоматически. Каждый скрипт проверен модератором
          или опубликован проверенным автором.
        </p>
        <form action={`/g/${firstGame}`} method="get" role="search" className="row gap-8" style={{ maxWidth: 720 }}>
          <label htmlFor="q" className="sr-only">Поиск скриптов</label>
          <div className="row gap-8 grow" style={{ flexBasis: 320, padding: '0 16px', minHeight: 52, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, flexWrap: 'nowrap' }}>
            <SearchIcon color="#A0A3B5" />
            <input id="q" name="q" type="search" placeholder="Найти скрипт: шахта, таймер, интерфейс…" style={{ flex: 1, background: 'transparent', border: 0, outline: 'none', color: 'var(--text)', font: 'inherit', fontSize: 16, minWidth: 0 }} />
          </div>
          <button type="submit" className="btn btn-primary" style={{ minHeight: 52, padding: '0 24px', fontSize: 16 }}>Искать</button>
        </form>
        <div className="row gap-32" style={{ marginTop: 8 }}>
          <Stat n={total ?? 0} label={plural(total ?? 0, 'скрипт', 'скрипта', 'скриптов')} />
          <Stat n={authorCount} label={plural(authorCount, 'автор', 'автора', 'авторов')} />
          <Stat n={games?.length ?? 0} label={plural(games?.length ?? 0, 'игра', 'игры', 'игр')} />
        </div>
      </section>

      <section id="games" className="container section stack gap-20">
        <h2 className="section-title">Игры</h2>
        <div className="grid-cards">
          {(games ?? []).map((g) => {
            const n = (g.scripts as unknown as { count: number }[])?.[0]?.count ?? 0
            return (
              <Link key={g.id} href={`/g/${g.slug}`} className="card">
                {g.cover_path ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={screenshotUrl(g.cover_path)} alt="" className="card-cover" style={{ height: 140 }} />
                ) : (
                  <div className="card-cover ph" style={{ height: 140 }}>{g.name}</div>
                )}
                <div className="card-body" style={{ gap: 4 }}>
                  <span className="display" style={{ fontSize: 18 }}>{g.name}</span>
                  <span className="muted small">{g.platform}{g.channel ? ` · ${g.channel}` : ''}</span>
                  <span style={{ marginTop: 8, color: 'var(--accent)', fontWeight: 600, fontSize: 14 }}>
                    {n} {plural(n, 'скрипт', 'скрипта', 'скриптов')} →
                  </span>
                </div>
              </Link>
            )
          })}
          <div className="stack gap-8" style={{ alignItems: 'center', justifyContent: 'center', minHeight: 240, border: '1px dashed var(--border)', borderRadius: 16, textAlign: 'center', padding: 24 }}>
            <span className="display" style={{ fontSize: 16 }}>Другие игры</span>
            <span className="muted small" style={{ maxWidth: 240 }}>Появятся, когда авторы добавят для них первые скрипты. При добавлении скрипта можно предложить новую игру.</span>
          </div>
        </div>
      </section>

      {popularList.length > 0 && (
        <section className="container section stack gap-20">
          <div className="row gap-12" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h2 className="section-title">Популярное</h2>
            <Link href={`/g/${firstGame}`}>Весь каталог →</Link>
          </div>
          <div className="grid-cards">
            {popularList.map((s) => <ScriptCard key={s.id} s={s} />)}
          </div>
        </section>
      )}

      {popularList.length === 0 && (
        <section className="container section">
          <div className="panel stack gap-12" style={{ alignItems: 'flex-start' }}>
            <h2 className="section-title">Каталог пока пуст</h2>
            <p className="muted">Будь первым: опубликуй свой скрипт, и он появится здесь после проверки.</p>
            <Link href="/new" className="btn btn-primary">+ Добавить скрипт</Link>
          </div>
        </section>
      )}

      <section id="how" className="container section">
        <div className="panel stack gap-24" style={{ padding: 32 }}>
          <h2 className="section-title">Как установить скрипт</h2>
          <div className="grid-2">
            <Step n="01" title="Поставь Tampermonkey">
              Бесплатное расширение для <a href="https://www.tampermonkey.net/" target="_blank" rel="noreferrer">Chrome, Firefox, Edge и Opera</a>.
            </Step>
            <Step n="02" title="Нажми «Установить»">Tampermonkey сам откроет окно установки скрипта.</Step>
            <Step n="03" title="Обновления приходят сами">Новые версии подтягиваются автоматически после проверки.</Step>
          </div>
        </div>
      </section>

      {updatedList.length > 0 && (
        <section className="container section stack gap-16">
          <h2 className="section-title">Недавно обновлены</h2>
          <div className="table">
            {updatedList.map((s) => (
              <Link key={s.id} href={`/s/${s.game?.slug}/${s.slug}`} className="table-row">
                <span style={{ fontWeight: 600, flex: '1 1 220px' }}>{s.title}</span>
                {s.current && <span className="mono tiny" style={{ color: 'var(--accent)' }}>v{s.current.version}</span>}
                <span className="muted small" style={{ flex: '2 1 260px' }}>{s.short_desc}</span>
                <span className="faint tiny">{timeAgo(s.updated_at)}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  )
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="stack">
      <span className="display" style={{ fontSize: 28 }}>{n}</span>
      <span className="muted small">{label}</span>
    </div>
  )
}

function Step({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div className="stack gap-8">
      <span className="mono" style={{ color: 'var(--accent)' }}>{n}</span>
      <span style={{ fontWeight: 600 }}>{title}</span>
      <span className="muted small">{children}</span>
    </div>
  )
}
