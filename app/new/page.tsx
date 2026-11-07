import type { Metadata } from 'next'
import { getViewer } from '@/lib/supabase/server'
import ScriptForm from '@/components/ScriptForm'
import LoginRequired from '@/components/LoginRequired'

export const metadata: Metadata = { title: 'Добавить скрипт' }
export const dynamic = 'force-dynamic'

export default async function NewScriptPage() {
  const { supabase, user, profile } = await getViewer()
  if (!user || !profile) return <LoginRequired text="Чтобы опубликовать скрипт, войди через Twitch. Это нужно, чтобы игроки видели автора, а ты мог выпускать обновления." />

  const [{ data: games }, { data: categories }] = await Promise.all([
    supabase.from('games').select('id, slug, name').order('created_at'),
    supabase.from('categories').select('id, name').order('sort'),
  ])

  return (
    <div className="container stack gap-24" style={{ paddingTop: 32, paddingBottom: 72 }}>
      <div className="stack gap-4">
        <h1 className="page-title">Добавить скрипт</h1>
        <span className="muted">Заполни карточку — так её увидят игроки в каталоге.</span>
      </div>
      <ScriptForm userId={user.id} games={games ?? []} categories={categories ?? []} trusted={profile.role !== 'user'} />
    </div>
  )
}
