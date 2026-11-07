import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { CARD_SELECT, cleanSearch, type CardScript } from '@/lib/queries'
import { ScriptRow } from '@/components/ScriptCard'
import { plural, screenshotUrl } from '@/lib/util'

export const dynamic = 'force-dynamic'

type Search = { q?: string; cat?: string; kind?: string; sort?: string }

const SORTS = {
  popular: { label: 'Популярные', col: 'installs_count' },
  rating: { label: 'Лучший рейтинг', col: 'rating_avg' },
  new: { label: 'Новые', col: 'published_at' },
  updated: { label: 'Недавно обновлены', col: 'updated_at' },
} as const

export async function generateMetadata({ params }: { params: Promise<{ game: string }> }): Promise<Metadata> {
  const { game } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('games').select('name').eq('slug', game).maybeSingle()
  return { title: data ? `Скрипты для ${data.name}` : 'Каталог' }
}

export default async function GamePage({ params, searchParams }: { params: Promise<{ game: string }>; searchParams: Promise<Search> }) {
  const { game: gameSlug } = await params
  const sp = await searchParams
  const supabase = await createClient()

  const { data: game } = await supabase.from('games').select('*').eq('slug', gameSlug).maybeSingle()
  if (!game) notFound()

  const sortKey = (sp.sort && sp.sort in SORTS ? sp.sort : 'popular') as keyof typeof SORTS
  const q = cleanSearch(sp.q ?? '')

  const { data: categories } = await supabase.from('categories').select('*').order('sort')
  const cat = categories?.find((c) => c.slug === sp.cat)

  let query = supabase.from('scripts').select(CARD_SELECT).eq('game_id', game.id).eq('status', 'published')
  if (cat) query = query.eq('category_id', cat.id)
  if (sp.kind === 'userscript' || sp.kind === 'extension') query = query.eq('kind', sp.kind)
  if (q) query = query.or(`title.ilike.*${q}*,short_desc.ilike.*${q}*`)
  const { data } = await query.order(SORTS[sortKey].col, { ascending: false, nullsFirst: false }).limit(100)
  const scripts = (data ?? []) as unknown as CardScript[]

  const link = (patch: Partial<Search>) => {
    const next = { q: sp.q, cat: sp.cat, kind: sp.kind, sort: sp.sort, ...patch }
    const usp = new URLSearchParams()
    Object.entries(next).forEach(([k, v]) => { if (v) usp.set(k, v) })
    const s = usp.toString()
    return `/g/${game.slug}${s ? `?${s}` : ''}`
  }

  return (
    <>
      <section className="container row gap-20" style={{ paddingTop: 32, paddingBottom: 24 }}>
        {game.cover_path ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={screenshotUrl(game.cover_path)} alt="" style={{ width: 96, height: 96, borderRadius: 18, objectFit: 'cover' }} />
        ) : (
          <div className="ph" style={{ width: 96, height: 96, borderRadius: 18, flex: 'none' }}>{game.name.slice(0, 2)}</div>
        )}
        <div className="stack gap-4 grow" style={{ flexBasis: 320 }}>
          <span className="muted small"><Link href="/" style={{ color: 'var(--muted)' }}>Главная</Link> / {game.platform}{game.channel ? ` / ${game.channel}` : ''}</span>
          <h1 className="display" style={{ fontSize: 36 }}>{game.name}</h1>
          {game.description && <span className="muted">{game.description}</span>}
        </div>
        {game.url && <a href={game.url} target="_blank" rel="noreferrer" className="btn btn-ghost">Открыть игру ↗</a>}
      </section>

      <section className="container section with-aside" style={{ gap: 24 }}>
        <aside className="panel stack gap-24" style={{ flex: '1 1 240px', maxWidth: '100%' }}>
          <div className="stack gap-12">
            <span className="tiny muted" style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.6 }}>Категория</span>
            <div className="row gap-8">
              <Link href={link({ cat: undefined })} className={`pill${!cat ? ' on' : ''}`}>Все</Link>
              {(categories ?? []).map((c) => (
                <Link key={c.id} href={link({ cat: c.slug })} className={`pill${cat?.id === c.id ? ' on' : ''}`}>{c.name}</Link>
              ))}
            </div>
          </div>
          <div className="stack gap-12">
            <span className="tiny muted" style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.6 }}>Тип</span>
            <div className="row gap-8">
              <Link href={link({ kind: undefined })} className={`pill${!sp.kind ? ' on' : ''}`}>Все</Link>
              <Link href={link({ kind: 'userscript' })} className={`pill${sp.kind === 'userscript' ? ' on' : ''}`}>Userscript</Link>
              <Link href={link({ kind: 'extension' })} className={`pill${sp.kind === 'extension' ? ' on' : ''}`}>Расширение</Link>
            </div>
          </div>
        </aside>

        <div className="main-col stack gap-16" style={{ flex: '999 1 560px' }}>
          <form method="get" className="row gap-8">
            {sp.cat && <input type="hidden" name="cat" value={sp.cat} />}
            {sp.kind && <input type="hidden" name="kind" value={sp.kind} />}
            <label htmlFor="cq" className="sr-only">Поиск в каталоге</label>
            <input id="cq" name="q" type="search" defaultValue={sp.q ?? ''} placeholder={`Поиск по скриптам: ${game.name}`} className="input" style={{ flex: '1 1 240px', width: 'auto' }} />
            <label htmlFor="sort" className="muted small">Сортировка</label>
            <select id="sort" name="sort" defaultValue={sortKey} className="select" style={{ width: 'auto' }}>
              {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <button type="submit" className="btn btn-ghost">Применить</button>
          </form>
          <span className="muted small">
            Найдено: {scripts.length} {plural(scripts.length, 'скрипт', 'скрипта', 'скриптов')}
          </span>
          {scripts.map((s) => <ScriptRow key={s.id} s={s} />)}
          {scripts.length === 0 && (
            <div className="panel stack gap-12" style={{ alignItems: 'flex-start' }}>
              <span>Ничего не найдено.</span>
              <Link href="/new" className="btn btn-primary">+ Добавить свой скрипт</Link>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
