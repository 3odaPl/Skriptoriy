'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TwitchIcon } from './Icons'

export default function LoginButton({ label = 'Войти через Twitch', className = 'btn btn-twitch' }: { label?: string; className?: string }) {
  const [busy, setBusy] = useState(false)

  async function login() {
    setBusy(true)
    const next = window.location.pathname + window.location.search
    const { error } = await createClient().auth.signInWithOAuth({
      provider: 'twitch',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    })
    if (error) {
      setBusy(false)
      alert('Не получилось начать вход: ' + error.message)
    }
  }

  return (
    <button type="button" className={className} onClick={login} disabled={busy}>
      <TwitchIcon />
      {busy ? 'Переходим на Twitch…' : label}
    </button>
  )
}
