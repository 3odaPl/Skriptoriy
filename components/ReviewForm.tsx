'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ReviewForm({ scriptId, existing }: { scriptId: string; existing: { id: string; rating: number; body: string } | null }) {
  const router = useRouter()
  const [rating, setRating] = useState(existing?.rating ?? 0)
  const [body, setBody] = useState(existing?.body ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!rating) return setError('Поставь оценку от 1 до 5')
    setBusy(true)
    setError('')
    const supabase = createClient()
    const res = existing
      ? await supabase.from('reviews').update({ rating, body: body.trim() }).eq('id', existing.id)
      : await supabase.from('reviews').insert({ script_id: scriptId, rating, body: body.trim() })
    setBusy(false)
    if (res.error) return setError('Не удалось сохранить: ' + res.error.message)
    router.refresh()
  }

  async function remove() {
    if (!existing || !confirm('Удалить отзыв?')) return
    await createClient().from('reviews').delete().eq('id', existing.id)
    setRating(0)
    setBody('')
    router.refresh()
  }

  return (
    <form onSubmit={save} className="panel stack gap-12">
      <label htmlFor="review" style={{ fontWeight: 600 }}>{existing ? 'Твой отзыв' : 'Оставить отзыв'}</label>
      <div className="row gap-4" role="radiogroup" aria-label="Оценка">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} из 5`} className={`star-btn${n <= rating ? ' on' : ''}`} onClick={() => setRating(n)}>★</button>
        ))}
      </div>
      <textarea id="review" className="textarea" rows={3} maxLength={2000} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Что понравилось, что сломалось после обновления игры…" style={{ minHeight: 90 }} />
      {error && <span className="error">{error}</span>}
      <div className="row gap-12">
        <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Сохраняю…' : existing ? 'Обновить' : 'Отправить'}</button>
        {existing && <button type="button" className="link-btn muted small" onClick={remove}>Удалить отзыв</button>}
      </div>
    </form>
  )
}
