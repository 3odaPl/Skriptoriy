'use client'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { compressImage } from '@/lib/image'
import { screenshotUrl, slugify, VERSION_RE } from '@/lib/util'
import PayloadInput, { type Meta, type Payload } from './PayloadInput'
import { InfoIcon } from './Icons'

type Game = { id: string; slug: string; name: string }
type Category = { id: number; name: string }
type Shot = { key: string; path?: string; id?: string; file?: File; preview: string }

export type ScriptFormInitial = {
  id: string
  slug: string
  gameSlug: string
  game_id: string
  kind: 'userscript' | 'extension'
  title: string
  short_desc: string
  description: string
  category_id: number | null
  store_url: string | null
  shots: { id: string; path: string }[]
}

const MAX_SHOTS = 8

export default function ScriptForm({
  userId, games, categories, trusted, initial,
}: {
  userId: string
  games: Game[]
  categories: Category[]
  trusted: boolean
  initial?: ScriptFormInitial
}) {
  const router = useRouter()
  const editing = Boolean(initial)
  const [gameId, setGameId] = useState(initial?.game_id ?? games[0]?.id ?? '')
  const [categoryId, setCategoryId] = useState<number | ''>(initial?.category_id ?? categories[0]?.id ?? '')
  const [kind, setKind] = useState<'userscript' | 'extension'>(initial?.kind ?? 'userscript')
  const [title, setTitle] = useState(initial?.title ?? '')
  const [shortDesc, setShortDesc] = useState(initial?.short_desc ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [storeUrl, setStoreUrl] = useState(initial?.store_url ?? '')
  const [payload, setPayload] = useState<Payload>({ code: '', zip: null })
  const [version, setVersion] = useState('1.0.0')
  const [changelog, setChangelog] = useState('Первая версия')
  const [shots, setShots] = useState<Shot[]>(
    (initial?.shots ?? []).map((s) => ({ key: s.id, id: s.id, path: s.path, preview: screenshotUrl(s.path) })),
  )
  const [removed, setRemoved] = useState<Shot[]>([])
  const [agree, setAgree] = useState(editing)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')

  const game = useMemo(() => games.find((g) => g.id === gameId), [games, gameId])

  function applyMeta(m: Meta) {
    if (!title && m.name) setTitle(m.name.slice(0, 80))
    if (!shortDesc && m.description) setShortDesc(m.description.slice(0, 120))
    if (m.version) setVersion(m.version)
  }

  function addShots(files: FileList | null) {
    if (!files) return
    const room = MAX_SHOTS - shots.length
    const next = Array.from(files)
      .filter((f) => /^image\/(png|jpe?g|webp|gif)$/.test(f.type))
      .slice(0, room)
      .map((f) => ({ key: crypto.randomUUID(), file: f, preview: URL.createObjectURL(f) }))
    setShots((s) => [...s, ...next])
  }

  function removeShot(key: string) {
    setShots((s) => {
      const target = s.find((x) => x.key === key)
      if (target?.id) setRemoved((r) => [...r, target])
      return s.filter((x) => x.key !== key)
    })
  }

  function makeCover(key: string) {
    setShots((s) => {
      const t = s.find((x) => x.key === key)
      return t ? [t, ...s.filter((x) => x.key !== key)] : s
    })
  }

  function validate(): string | null {
    if (!gameId) return 'Выбери игру'
    if (title.trim().length < 2) return 'Название слишком короткое'
    if (!editing) {
      if (kind === 'userscript' && !payload.code.trim()) return 'Загрузи файл или вставь код скрипта'
      if (kind === 'extension' && !payload.zip) return 'Загрузи архив .zip с расширением'
      if (!VERSION_RE.test(version)) return 'Версия должна быть в формате 1.0.0'
    }
    if (storeUrl && !/^https:\/\//.test(storeUrl)) return 'Ссылка на магазин должна начинаться с https://'
    if (!agree) return 'Подтверди, что ты автор скрипта и он соответствует правилам'
    return null
  }

  async function uploadShots(supabase: ReturnType<typeof createClient>, scriptId: string) {
    const ordered: { id?: string; path: string }[] = []
    for (const s of shots) {
      if (s.path) { ordered.push({ id: s.id, path: s.path }); continue }
      setBusy('Загружаю скриншоты…')
      const blob = await compressImage(s.file!)
      const ext = blob.type === 'image/gif' ? 'gif' : blob.type === 'image/webp' ? 'webp' : (s.file!.type.split('/')[1] ?? 'png')
      const path = `${userId}/${scriptId}/${crypto.randomUUID()}.${ext}`
      const { error } = await supabase.storage.from('screenshots').upload(path, blob, { contentType: blob.type || s.file!.type, upsert: false })
      if (error) throw new Error('Скриншот не загрузился: ' + error.message)
      ordered.push({ path })
    }
    for (let i = 0; i < ordered.length; i++) {
      const o = ordered[i]
      const res = o.id
        ? await supabase.from('screenshots').update({ position: i }).eq('id', o.id)
        : await supabase.from('screenshots').insert({ script_id: scriptId, path: o.path, position: i })
      if (res.error) throw new Error('Скриншот не сохранился: ' + res.error.message)
    }
    if (removed.length) {
      await supabase.from('screenshots').delete().in('id', removed.map((r) => r.id!))
      await supabase.storage.from('screenshots').remove(removed.map((r) => r.path!))
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const problem = validate()
    if (problem) return setError(problem)
    setError('')
    const supabase = createClient()

    try {
      if (editing && initial) {
        setBusy('Сохраняю…')
        const { error: upErr } = await supabase.from('scripts').update({
          title: title.trim(),
          short_desc: shortDesc.trim(),
          description: description.trim(),
          category_id: categoryId === '' ? null : categoryId,
          store_url: storeUrl.trim() || null,
        }).eq('id', initial.id)
        if (upErr) throw new Error(upErr.message)
        await uploadShots(supabase, initial.id)
        router.push(`/s/${initial.gameSlug}/${initial.slug}`)
        router.refresh()
        return
      }

      setBusy('Создаю карточку…')
      let slug = slugify(title)
      const base = {
        game_id: gameId,
        category_id: categoryId === '' ? null : categoryId,
        title: title.trim(),
        short_desc: shortDesc.trim(),
        description: description.trim(),
        kind,
        store_url: storeUrl.trim() || null,
      }
      let ins = await supabase.from('scripts').insert({ ...base, slug }).select('id').single()
      if (ins.error?.code === '23505') {
        slug = `${slug.slice(0, 53)}-${Math.random().toString(36).slice(2, 7)}`
        ins = await supabase.from('scripts').insert({ ...base, slug }).select('id').single()
      }
      if (ins.error || !ins.data) throw new Error(ins.error?.message ?? 'не удалось создать скрипт')
      const scriptId = ins.data.id

      await uploadShots(supabase, scriptId)

      let filePath: string | null = null
      if (kind === 'extension' && payload.zip) {
        setBusy('Загружаю архив…')
        filePath = `${userId}/${scriptId}/${version}.zip`
        const { error: zipErr } = await supabase.storage.from('script-files').upload(filePath, payload.zip, { contentType: 'application/zip' })
        if (zipErr) throw new Error('Архив не загрузился: ' + zipErr.message)
      }

      setBusy('Отправляю на проверку…')
      const ver = await supabase.from('script_versions').insert({
        script_id: scriptId,
        version,
        changelog: changelog.trim(),
        code: kind === 'userscript' ? payload.code : null,
        file_path: filePath,
      }).select('id').single()
      if (ver.error || !ver.data) throw new Error(ver.error?.message ?? 'не удалось сохранить версию')

      const { error: subErr } = await supabase.rpc('submit_version', { p_version_id: ver.data.id })
      if (subErr) throw new Error(subErr.message)

      router.push(`/s/${game?.slug}/${slug}`)
      router.refresh()
    } catch (err) {
      setBusy('')
      setError('Ошибка: ' + (err instanceof Error ? err.message : String(err)))
    }
  }

  return (
    <div className="with-aside">
      <form onSubmit={submit} className="main-col stack gap-24" noValidate>
        <fieldset className="panel">
          <legend>1. Основное</legend>
          <div className="grid-2">
            <div className="field">
              <label htmlFor="game">Игра</label>
              <select id="game" className="select" value={gameId} onChange={(e) => setGameId(e.target.value)} disabled={editing}>
                {games.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
              {!editing && <span className="hint">Нет нужной игры? Напиши модератору — добавим.</span>}
            </div>
            <div className="field">
              <label htmlFor="cat">Категория</label>
              <select id="cat" className="select" value={categoryId} onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="field">
            <label htmlFor="title">Название</label>
            <input id="title" className="input" maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Например: Помощник шахты" />
          </div>
          <div className="field">
            <label htmlFor="short">Коротко, что делает</label>
            <input id="short" className="input" maxLength={120} value={shortDesc} onChange={(e) => setShortDesc(e.target.value)} placeholder="Одна строка для списка в каталоге" />
            <span className="hint">{shortDesc.length}/120</span>
          </div>
          <div className="field">
            <label htmlFor="desc">Полное описание</label>
            <textarea id="desc" className="textarea" rows={7} maxLength={20000} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Что умеет, как пользоваться, горячие клавиши. Поддерживается Markdown." />
          </div>
        </fieldset>

        {!editing && (
          <fieldset className="panel">
            <legend>2. Файл</legend>
            <div role="radiogroup" aria-label="Тип" className="row gap-12">
              {(['userscript', 'extension'] as const).map((k) => (
                <button key={k} type="button" role="radio" aria-checked={kind === k} className={`choice${kind === k ? ' on' : ''}`} onClick={() => setKind(k)}>
                  <span style={{ fontWeight: 600 }}>{k === 'userscript' ? 'Userscript' : 'Расширение браузера'}</span>
                  <span className="muted tiny">{k === 'userscript' ? 'Файл .user.js для Tampermonkey' : 'Архив .zip или ссылка на магазин'}</span>
                </button>
              ))}
            </div>
            <PayloadInput kind={kind} value={payload} onChange={setPayload} onMeta={applyMeta} onError={setError} />
            <div className="grid-2">
              <div className="field">
                <label htmlFor="ver">Версия</label>
                <input id="ver" className="input mono" value={version} onChange={(e) => setVersion(e.target.value.trim())} placeholder="1.0.0" />
              </div>
              <div className="field">
                <label htmlFor="news">Что нового</label>
                <input id="news" className="input" maxLength={2000} value={changelog} onChange={(e) => setChangelog(e.target.value)} />
              </div>
            </div>
          </fieldset>
        )}

        {kind === 'extension' && (
          <fieldset className="panel">
            <legend>{editing ? 'Магазин' : '3. Магазин (необязательно)'}</legend>
            <div className="field">
              <label htmlFor="store">Ссылка на Chrome Web Store или Firefox Add-ons</label>
              <input id="store" type="url" className="input" value={storeUrl} onChange={(e) => setStoreUrl(e.target.value)} placeholder="https://" />
            </div>
          </fieldset>
        )}

        <fieldset className="panel">
          <legend>Скриншоты</legend>
          <div className="thumbs">
            {shots.map((s, i) => (
              <div key={s.key} className="thumb" style={i === 0 ? { border: '2px solid var(--accent)' } : undefined}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.preview} alt={`Скриншот ${i + 1}`} />
                <button type="button" className="remove" aria-label="Убрать скриншот" onClick={() => removeShot(s.key)}>✕</button>
                {i === 0 ? (
                  <span className="badge badge-warn cover-tag">Обложка</span>
                ) : (
                  <button type="button" className="badge cover-tag" style={{ border: 0, cursor: 'pointer' }} onClick={() => makeCover(s.key)}>Сделать обложкой</button>
                )}
              </div>
            ))}
            {shots.length < MAX_SHOTS && (
              <label className="thumb dropzone" style={{ padding: 0 }}>
                <span className="muted small">+ Добавить</span>
                <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple hidden onChange={(e) => { addShots(e.target.files); e.target.value = '' }} />
              </label>
            )}
          </div>
          <span className="hint">До {MAX_SHOTS} картинок или GIF, первая станет обложкой. Сжимаются автоматически.</span>
        </fieldset>

        {!editing && (
          <label className="row gap-12" style={{ alignItems: 'flex-start', flexWrap: 'nowrap' }}>
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} style={{ width: 18, height: 18, marginTop: 3, accentColor: 'var(--accent)' }} />
            <span>Я автор этого скрипта или у меня есть разрешение автора. Скрипт не крадёт данные и соответствует <a href="/rules" target="_blank">правилам публикации</a>.</span>
          </label>
        )}

        {error && <div className="notice bad" role="alert">{error}</div>}

        <div className="row gap-12">
          <button type="submit" className="btn btn-primary btn-lg" disabled={Boolean(busy)}>
            {busy || (editing ? 'Сохранить' : trusted ? 'Опубликовать' : 'Отправить на проверку')}
          </button>
        </div>
      </form>

      <aside className="side-col stack gap-12">
        {!editing && (
          <div className="notice">
            <InfoIcon color="#F2B544" />
            <span className="small">
              {trusted
                ? 'Ты проверенный автор: скрипт опубликуется сразу, если автопроверка не найдёт ничего опасного.'
                : 'Скрипт и его обновления сначала проверит модератор. После нескольких одобренных скриптов можно получить статус проверенного автора и публиковать сразу.'}
            </span>
          </div>
        )}
        <div className="panel stack gap-8">
          <span style={{ fontWeight: 600 }}>Что проверяется</span>
          <span className="small" style={{ color: 'var(--text-2)' }}>• нет отправки данных на чужие сайты</span>
          <span className="small" style={{ color: 'var(--text-2)' }}>• нет чтения cookies и токенов</span>
          <span className="small" style={{ color: 'var(--text-2)' }}>• нет eval и скрытого кода</span>
          <span className="small" style={{ color: 'var(--text-2)' }}>• скрипт работает только на сайте игры</span>
          <span className="small" style={{ color: 'var(--text-2)' }}>• описание совпадает с тем, что делает код</span>
        </div>
      </aside>
    </div>
  )
}
