import type { Enums } from '@/lib/database.types'

const TRANSLIT: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm',
  н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch',
  ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya', є: 'ye', і: 'i', ї: 'yi', ґ: 'g',
}

/** "Помощник шахты" → "pomoschnik-shahty" (matches the DB check ^[a-z0-9-]{2,60}$). */
export function slugify(text: string): string {
  const s = text
    .toLowerCase()
    .split('')
    .map((ch) => TRANSLIT[ch] ?? ch)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '')
  return s.length >= 2 ? s : `script-${Math.random().toString(36).slice(2, 8)}`
}

export function screenshotUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/screenshots/${path}`
}

export function plural(n: number, one: string, few: string, many: string) {
  const m10 = n % 10
  const m100 = n % 100
  if (m10 === 1 && m100 !== 11) return one
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few
  return many
}

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return ''
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'только что'
  const min = Math.floor(diff / 60)
  if (min < 60) return `${min} ${plural(min, 'минуту', 'минуты', 'минут')} назад`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h} ${plural(h, 'час', 'часа', 'часов')} назад`
  const d = Math.floor(h / 24)
  if (d === 1) return 'вчера'
  if (d < 30) return `${d} ${plural(d, 'день', 'дня', 'дней')} назад`
  const mo = Math.floor(d / 30)
  if (mo < 12) return `${mo} ${plural(mo, 'месяц', 'месяца', 'месяцев')} назад`
  const y = Math.floor(mo / 12)
  return `${y} ${plural(y, 'год', 'года', 'лет')} назад`
}

export function formatCount(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '')}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace('.0', '')}k`
  return String(n)
}

export const KIND_LABEL: Record<Enums<'script_kind'>, string> = {
  userscript: 'Userscript',
  extension: 'Расширение',
}

export const STATUS_LABEL: Record<Enums<'script_status'>, string> = {
  draft: 'Черновик',
  pending: 'На проверке',
  published: 'Опубликован',
  rejected: 'Отклонён',
  hidden: 'Скрыт',
}

export const VERSION_STATUS_LABEL: Record<Enums<'version_status'>, string> = {
  pending: 'На проверке',
  approved: 'Одобрена',
  rejected: 'Отклонена',
}

export const ROLE_LABEL: Record<Enums<'user_role'>, string> = {
  user: 'Автор',
  trusted: 'Проверенный автор',
  moderator: 'Модератор',
  admin: 'Администратор',
}

export const VERSION_RE = /^\d+\.\d+\.\d+$/

/** -1 / 0 / 1 for "1.2.3"-style versions. */
export function compareVersions(a: string, b: string) {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) > (pb[i] ?? 0) ? 1 : -1
  }
  return 0
}

const HEADER_RE = /\/\/\s*==UserScript==[\s\S]*?\/\/\s*==\/UserScript==/

/** Reads @name / @version / @description from a userscript header. */
export function readUserscriptMeta(code: string) {
  const header = code.match(HEADER_RE)?.[0] ?? ''
  const get = (key: string) => header.match(new RegExp(`//\\s*@${key}\\s+(.+)`))?.[1]?.trim()
  const rawVersion = get('version')
  const version = rawVersion?.match(/^\d+(\.\d+){0,2}/)?.[0]
  const normalized = version ? [...version.split('.'), '0', '0'].slice(0, 3).join('.') : undefined
  return { hasHeader: Boolean(header), name: get('name'), description: get('description'), version: normalized }
}

/**
 * Rewrites the header so Tampermonkey updates from this site:
 * forces @version, @updateURL and @downloadURL, drops the author's own copies.
 */
export function patchUserscript(code: string, opts: { version: string; base: string }) {
  const lines = [
    `// @version      ${opts.version}`,
    `// @updateURL    ${opts.base}.meta.js`,
    `// @downloadURL  ${opts.base}.user.js`,
  ]
  const match = code.match(HEADER_RE)
  if (!match) {
    const header = ['// ==UserScript==', ...lines, '// ==/UserScript=='].join('\n')
    return { full: `${header}\n${code}`, header }
  }
  const kept = match[0]
    .split('\n')
    .filter((l) => !/\/\/\s*@(version|updateURL|downloadURL)\b/.test(l))
  const closeIdx = kept.findIndex((l) => /==\/UserScript==/.test(l))
  kept.splice(closeIdx, 0, ...lines)
  const header = kept.join('\n')
  return { full: code.replace(HEADER_RE, header), header }
}

export function isSafeNext(next: string | null | undefined) {
  return Boolean(next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\'))
}

export type AutocheckItem = { level: 'ok' | 'warn' | 'danger'; text: string }
export type Autocheck = { level: 'ok' | 'warn' | 'danger'; items: AutocheckItem[] }

export function readAutocheck(value: unknown): Autocheck | null {
  if (!value || typeof value !== 'object') return null
  const v = value as Partial<Autocheck>
  if (!Array.isArray(v.items)) return null
  return { level: v.level ?? 'ok', items: v.items as AutocheckItem[] }
}
