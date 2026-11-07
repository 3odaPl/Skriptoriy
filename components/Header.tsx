import Link from 'next/link'
import { getViewer } from '@/lib/supabase/server'
import { LogoIcon } from './Icons'
import LoginButton from './LoginButton'

export default async function Header() {
  const { supabase, profile } = await getViewer()
  const isMod = profile?.role === 'moderator' || profile?.role === 'admin'

  let pending = 0
  if (isMod) {
    const { count } = await supabase.from('script_versions').select('id', { count: 'exact', head: true }).eq('status', 'pending')
    const { count: reports } = await supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'open')
    pending = (count ?? 0) + (reports ?? 0)
  }

  return (
    <header className="site-header">
      <div className="container inner">
        <Link href="/" className="logo">
          <span className="logo-mark"><LogoIcon /></span>
          <span className="logo-text">Скрипторий</span>
        </Link>
        <nav className="nav" aria-label="Основное меню">
          <Link href="/#games">Каталог</Link>
          <Link href="/#how">Как установить</Link>
          {profile && <Link href="/me">Мои скрипты</Link>}
          {isMod && (
            <Link href="/mod">
              Модерация{pending > 0 && <span className="badge badge-warn" style={{ marginLeft: 6 }}>{pending}</span>}
            </Link>
          )}
        </nav>
        <div className="grow" />
        <Link href="/new" className="btn btn-ghost">+ Добавить скрипт</Link>
        {profile ? (
          <div className="row gap-12">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt="" className="avatar" />
            ) : (
              <span className="avatar" />
            )}
            <span style={{ fontWeight: 500 }}>{profile.display_name ?? profile.username}</span>
            <form action="/auth/signout" method="post">
              <button type="submit" className="link-btn muted small">Выйти</button>
            </form>
          </div>
        ) : (
          <LoginButton />
        )}
      </div>
    </header>
  )
}
