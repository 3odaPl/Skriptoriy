'use client'
import { useRef } from 'react'
import { readUserscriptMeta } from '@/lib/util'

export type Payload = { code: string; zip: File | null }
export type Meta = ReturnType<typeof readUserscriptMeta>

const MAX_CODE = 2_000_000
const MAX_ZIP = 10 * 1024 * 1024

/** Userscript code (file or paste) or an extension .zip. */
export default function PayloadInput({
  kind, value, onChange, onMeta, onError,
}: {
  kind: 'userscript' | 'extension'
  value: Payload
  onChange: (p: Payload) => void
  onMeta?: (m: Meta) => void
  onError: (msg: string) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)

  async function pickFile(file: File | undefined) {
    if (!file) return
    onError('')
    if (kind === 'userscript') {
      if (file.size > MAX_CODE) return onError('Файл слишком большой (максимум 2 МБ)')
      const code = await file.text()
      onChange({ ...value, code })
      onMeta?.(readUserscriptMeta(code))
    } else {
      if (!/\.zip$/i.test(file.name)) return onError('Нужен архив .zip')
      if (file.size > MAX_ZIP) return onError('Архив слишком большой (максимум 10 МБ)')
      onChange({ ...value, zip: file })
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    void pickFile(e.dataTransfer.files?.[0])
  }

  return (
    <div className="stack gap-12">
      <div
        className="dropzone"
        role="button"
        tabIndex={0}
        onClick={() => fileRef.current?.click()}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileRef.current?.click() } }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
      >
        {kind === 'userscript' ? (
          <>
            <span style={{ fontWeight: 600 }}>{value.code ? 'Код загружен — можно заменить файлом' : 'Перетащи файл .user.js сюда'}</span>
            <span className="muted small">или нажми, чтобы выбрать · можно вставить код ниже</span>
          </>
        ) : (
          <>
            <span style={{ fontWeight: 600 }}>{value.zip ? `Выбран: ${value.zip.name}` : 'Перетащи архив .zip с расширением'}</span>
            <span className="muted small">Внутри должен быть manifest.json · до 10 МБ</span>
          </>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        hidden
        accept={kind === 'userscript' ? '.js,text/javascript' : '.zip,application/zip'}
        onChange={(e) => { void pickFile(e.target.files?.[0]); e.target.value = '' }}
      />
      {kind === 'userscript' && (
        <div className="field">
          <label htmlFor="code">Код скрипта</label>
          <textarea
            id="code"
            className="textarea code-input"
            rows={10}
            spellCheck={false}
            value={value.code}
            onChange={(e) => onChange({ ...value, code: e.target.value })}
            onBlur={() => value.code && onMeta?.(readUserscriptMeta(value.code))}
            placeholder={'// ==UserScript==\n// @name   Помощник шахты\n// @match  https://play.multidonate.ru/*\n// ==/UserScript=='}
          />
          <span className="hint">Строки @updateURL и @downloadURL сайт подставит сам — обновления будут приходить игрокам автоматически.</span>
        </div>
      )}
    </div>
  )
}
