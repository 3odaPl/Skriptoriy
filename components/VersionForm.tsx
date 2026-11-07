'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { compareVersions, VERSION_RE } from '@/lib/util'
import PayloadInput, { type Payload } from './PayloadInput'

export default function VersionForm({
  userId, scriptId, kind, href, latest, trusted, hasPending,
}: {
  userId: string
  scriptId: string
  kind: 'userscript' | 'extension'
  href: string
  latest: string | null
  trusted: boolean
  hasPending: boolean
}) {
  const router = useRouter()
  const suggested = latest ? latest.split('.').map((n, i) => (i === 2 ? Number(n) + 1 : n)).join('.') : '1.0.0'
  const [payload, setPayload] = useState<Payload>({ code: '', zip: null })
  const [version, setVersion] = useState(suggested)
  const [changelog, setChangelog] = useState('')
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (kind === 'userscript' && !payload.code.trim()) return setError('Загрузи файл или вставь код')
    if (kind === 'extension' && !payload.zip) return setError('Загрузи архив .zip')
    if (!VERSION_RE.test(version)) return setError('Версия должна быть в формате 1.2.3')
    if (latest && compareVersions(version, latest) <= 0) return setError(`Версия должна быть больше ${latest}`)
    if (!changelog.trim()) return setError('Коротко напиши, что изменилось — это увидят игроки и модератор')
    setError('')
    const supabase = createClient()
    try {
      let filePath: string | null = null
      if (kind === 'extension' && payload.zip) {
        setBusy('Загружаю архив…')
        filePath = `${userId}/${scriptId}/${version}.zip`
        const { error: zipErr } = await supabase.storage.from('script-files').upload(filePath, payload.zip, { contentType: 'application/zip' })
        if (zipErr) throw new Error('Архив не загрузился: ' + zipErr.message)
      }
      setBusy('Отправляю…')
      const ver = await supabase.from('script_versions').insert({
        script_id: scriptId,
        version,
        changelog: changelog.trim(),
        code: kind === 'userscript' ? payload.code : null,
        file_path: filePath,
      }).select('id').single()
      if (ver.error || !ver.data) {
        throw new Error(ver.error?.code === '23505' ? `Версия ${version} уже загружена` : ver.error?.message ?? 'ошибка')
      }
      const { error: subErr } = await supabase.rpc('submit_version', { p_version_id: ver.data.id })
      if (subErr) throw new Error(subErr.message)
      router.push(href)
      router.refresh()
    } catch (err) {
      setBusy('')
      setError('Ошибка: ' + (err instanceof Error ? err.message : String(err)))
    }
  }

  return (
    <form onSubmit={submit} className="stack gap-24" noValidate>
      {hasPending && (
        <div className="notice small">Предыдущая версия ещё ждёт проверки. Можно загрузить новую — модератор увидит обе.</div>
      )}
      <fieldset className="panel">
        <legend>Новая версия</legend>
        <PayloadInput
          kind={kind}
          value={payload}
          onChange={setPayload}
          onMeta={(m) => { if (m.version && (!latest || compareVersions(m.version, latest) > 0)) setVersion(m.version) }}
          onError={setError}
        />
        <div className="grid-2">
          <div className="field">
            <label htmlFor="ver">Версия</label>
            <input id="ver" className="input mono" value={version} onChange={(e) => setVersion(e.target.value.trim())} />
            {latest && <span className="hint">Текущая: {latest}</span>}
          </div>
          <div className="field">
            <label htmlFor="news">Что нового</label>
            <input id="news" className="input" maxLength={2000} value={changelog} onChange={(e) => setChangelog(e.target.value)} placeholder="Исправил подсветку после обновления игры" />
          </div>
        </div>
      </fieldset>
      {error && <div className="notice bad" role="alert">{error}</div>}
      <div className="row gap-12">
        <button type="submit" className="btn btn-primary btn-lg" disabled={Boolean(busy)}>
          {busy || (trusted ? 'Опубликовать версию' : 'Отправить на проверку')}
        </button>
      </div>
    </form>
  )
}
