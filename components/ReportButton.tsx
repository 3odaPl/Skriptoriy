'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import LoginButton from './LoginButton'

export default function ReportButton({ scriptId, loggedIn }: { scriptId: string; loggedIn: boolean }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle')
  const [msg, setMsg] = useState('')

  async function send(e: React.FormEvent) {
    e.preventDefault()
    if (reason.trim().length < 3) return
    setState('busy')
    const { error } = await createClient().from('reports').insert({ script_id: scriptId, reason: reason.trim() })
    if (error) {
      setState('error')
      setMsg(error.code === '23505' ? 'Ты уже отправил жалобу, модератор её рассмотрит.' : 'Не удалось отправить: ' + error.message)
    } else {
      setState('done')
    }
  }

  if (!open) {
    return <button type="button" className="link-btn muted small" style={{ padding: 10 }} onClick={() => setOpen(true)}>⚑ Пожаловаться на скрипт</button>
  }
  if (!loggedIn) {
    return (
      <div className="panel stack gap-12">
        <span className="small">Чтобы пожаловаться, войди через Twitch.</span>
        <LoginButton />
      </div>
    )
  }
  if (state === 'done') return <div className="notice ok small">Спасибо! Модератор проверит скрипт.</div>

  return (
    <form onSubmit={send} className="panel stack gap-12">
      <label htmlFor="report" style={{ fontWeight: 600 }}>Что не так со скриптом?</label>
      <textarea id="report" className="textarea" rows={3} maxLength={1000} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Например: после установки пропадает кнопка, отправляет данные куда-то…" style={{ minHeight: 80 }} />
      {state === 'error' && <span className="error">{msg}</span>}
      <div className="row gap-12">
        <button type="submit" className="btn btn-bad btn-sm" disabled={state === 'busy'}>Отправить жалобу</button>
        <button type="button" className="link-btn muted small" onClick={() => setOpen(false)}>Отмена</button>
      </div>
    </form>
  )
}
