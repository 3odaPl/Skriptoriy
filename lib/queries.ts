export const CARD_SELECT =
  'id, slug, title, short_desc, kind, status, installs_count, rating_avg, rating_count, updated_at, published_at, ' +
  'game:games(slug, name), category:categories(name, slug), author:profiles(display_name, username), ' +
  'shots:screenshots(path, position), current:script_versions!scripts_current_version_fk(version, created_at)'

export type CardScript = {
  id: string
  slug: string
  title: string
  short_desc: string
  kind: 'userscript' | 'extension'
  status: 'draft' | 'pending' | 'published' | 'rejected' | 'hidden'
  installs_count: number
  rating_avg: number
  rating_count: number
  updated_at: string
  published_at: string | null
  game: { slug: string; name: string } | null
  category: { name: string; slug: string } | null
  author: { display_name: string | null; username: string | null } | null
  shots: { path: string; position: number }[]
  current: { version: string; created_at: string } | null
}

export function coverOf(s: Pick<CardScript, 'shots'>) {
  return [...(s.shots ?? [])].sort((a, b) => a.position - b.position)[0]?.path ?? null
}

export function authorName(a: { display_name: string | null; username: string | null } | null | undefined) {
  return a?.display_name || a?.username || 'автор'
}

/** Strips characters that would break a PostgREST or() filter. */
export function cleanSearch(q: string) {
  return q.replace(/[%,()*\\:."']/g, ' ').trim().slice(0, 60)
}
