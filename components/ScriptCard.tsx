import Link from 'next/link'
import { authorName, coverOf, type CardScript } from '@/lib/queries'
import { formatCount, KIND_LABEL, screenshotUrl, timeAgo } from '@/lib/util'

function href(s: CardScript) {
  return `/s/${s.game?.slug ?? 'legion'}/${s.slug}`
}

export function ScriptCard({ s }: { s: CardScript }) {
  const cover = coverOf(s)
  return (
    <Link href={href(s)} className="card">
      {cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={screenshotUrl(cover)} alt="" className="card-cover" loading="lazy" />
      ) : (
        <div className="card-cover ph">Без скриншота</div>
      )}
      <div className="card-body">
        <div className="row gap-8">
          <span className="badge">{KIND_LABEL[s.kind]}</span>
          {s.category && <span className="badge">{s.category.name}</span>}
        </div>
        <span className="card-title">{s.title}</span>
        <span className="muted small grow">{s.short_desc}</span>
        <div className="card-meta">
          <span>@{authorName(s.author)}</span>
          <span className="grow" />
          {s.rating_count > 0 && <span title={`${s.rating_count} оценок`}>★ {Number(s.rating_avg).toFixed(1)}</span>}
          <span title="Установок">↓ {formatCount(s.installs_count)}</span>
        </div>
      </div>
    </Link>
  )
}

export function ScriptRow({ s }: { s: CardScript }) {
  const cover = coverOf(s)
  return (
    <Link href={href(s)} className="list-row">
      {cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={screenshotUrl(cover)} alt="" className="list-thumb" loading="lazy" />
      ) : (
        <div className="list-thumb ph">Без скриншота</div>
      )}
      <div className="stack gap-4 grow" style={{ flexBasis: 260, minWidth: 0 }}>
        <div className="row gap-8">
          <span style={{ fontWeight: 600, fontSize: 17 }}>{s.title}</span>
          {s.current && <span className="mono tiny muted">v{s.current.version}</span>}
        </div>
        <span className="muted small">{s.short_desc}</span>
        <div className="row gap-12 tiny muted" style={{ marginTop: 'auto', rowGap: 6 }}>
          <span className="badge">{KIND_LABEL[s.kind]}</span>
          {s.category && <span className="badge">{s.category.name}</span>}
          <span>@{authorName(s.author)}</span>
          {s.rating_count > 0 && <span>★ {Number(s.rating_avg).toFixed(1)}</span>}
          <span>↓ {formatCount(s.installs_count)}</span>
          <span>обновлён {timeAgo(s.updated_at)}</span>
        </div>
      </div>
    </Link>
  )
}
