'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function VersionActions({ versionId, authorId, authorIsNew, isAdmin }: { versionId: string; authorId: string; authorIsNew: boolean; isAdmin: boolean }) {
  const router = useRouter()
  const [note, setNote] = useState('')
  const [trust, setTrust] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function decide(approve: boolean) {
    if (!approve && !note.trim()) return setError('Напиши автору, что исправить')
    setBusy(true)
    setError('')
    const supabase = createClient()
    const { error: e1 } = await supabase.rpc('moderate_version', { p_version_id: versionId, p_approve: approve, p_note: note.trim() || undefined })
    if (!e1 && approve && trust) {
      const { error: e2 } = await supabase.rpc('set_user_role', { p_user: authorId, p_role: 'trusted' })
      if (e2) setError('Версия одобрена, но статус автора не изменился: ' + e2.message)
    }
    setBusy(false)
    if (e1) return setError(e1.message)
    router.push('/mod')
    router.refresh()
  }

  return (
    <div className="panel stack gap-12">
      <label htmlFor="note" style={{ fontWeight: 600 }}>Комментарий автору</label>
      <textarea id="note" className="textarea" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Обязателен при отклонении: что исправить" style={{ minHeight: 70 }} />
      {error && <span className="error">{error}</span>}
      <div className="row gap-12">
        <button type="button" className="btn btn-ok" disabled={busy} onClick={() => decide(true)}>✓ Одобрить</button>
        <button type="button" className="btn btn-bad" disabled={busy} onClick={() => decide(false)}>Отклонить</button>
        <span className="grow" />
        {authorIsNew && (
          <label className="row gap-8 small" style={{ color: 'var(--text-2)' }}>
            <input type="checkbox" checked={trust} onChange={(e) => setTrust(e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--accent)' }} />
            Сделать автора проверенным
          </label>
        )}
      </div>
      {isAdmin && <RoleControl userId={authorId} />}
    </div>
  )
}

function RoleControl({ userId }: { userId: string }) {
  const [role, setRole] = useState<'user' | 'trusted' | 'moderator'>('user')
  const [msg, setMsg] = useState('')
  async function save() {
    const { error } = await createClient().rpc('set_user_role', { p_user: userId, p_role: role })
    setMsg(error ? error.message : 'Роль сохранена')
  }
  return (
    <div className="row gap-8 small" style={{ paddingTop: 12, borderTop: '1px solid var(--border-soft)' }}>
      <label htmlFor="role" className="muted">Роль автора (админ):</label>
      <select id="role" className="select" style={{ width: 'auto', minHeight: 36 }} value={role} onChange={(e) => setRole(e.target.value as typeof role)}>
        <option value="user">Автор</option>
        <option value="trusted">Проверенный автор</option>
        <option value="moderator">Модератор</option>
      </select>
      <button type="button" className="btn btn-ghost btn-sm" onClick={save}>Сохранить</button>
      {msg && <span className="muted">{msg}</span>}
    </div>
  )
}

export function ReportActions({ reportId, scriptId, scriptStatus }: { reportId: string; scriptId: string; scriptStatus: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function run(fn: () => PromiseLike<{ error: { message: string } | null }>) {
    setBusy(true)
    const { error: e } = await fn()
    setBusy(false)
    if (e) return setError(e.message)
    router.refresh()
  }
  const supabase = createClient()

  return (
    <div className="stack gap-8">
      <div className="row gap-8">
        <button type="button" className="btn btn-bad btn-sm" disabled={busy} onClick={() => run(async () => {
          const r = await supabase.rpc('set_script_status', { p_script: scriptId, p_status: 'hidden' })
          if (r.error) return r
          return supabase.rpc('resolve_report', { p_report: reportId, p_dismiss: false })
        })}>Обоснована — скрыть скрипт</button>
        <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => run(() => supabase.rpc('resolve_report', { p_report: reportId, p_dismiss: true }))}>
          Отклонить жалобу
        </button>
        {scriptStatus === 'hidden' && (
          <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => run(() => supabase.rpc('set_script_status', { p_script: scriptId, p_status: 'published' }))}>
            Вернуть в каталог
          </button>
        )}
      </div>
      {error && <span className="error">{error}</span>}
    </div>
  )
}

export function UnhideButton({ scriptId }: { scriptId: string }) {
  const router = useRouter()
  const [error, setError] = useState('')
  return (
    <>
      <button type="button" className="btn btn-ghost btn-sm" onClick={async () => {
        const { error: e } = await createClient().rpc('set_script_status', { p_script: scriptId, p_status: 'published' })
        if (e) setError(e.message); else router.refresh()
      }}>Вернуть в каталог</button>
      {error && <span className="error">{error}</span>}
    </>
  )
}

export function ZipDownload({ path }: { path: string }) {
  const [error, setError] = useState('')
  return (
    <>
      <button type="button" className="btn btn-ghost btn-sm" onClick={async () => {
        const { data, error: e } = await createClient().storage.from('script-files').createSignedUrl(path, 120, { download: true })
        if (e || !data) return setError(e?.message ?? 'Не удалось получить архив')
        window.location.href = data.signedUrl
      }}>Скачать архив для проверки</button>
      {error && <span className="error">{error}</span>}
    </>
  )
}
