import { notFound } from 'next/navigation'
import { getViewer } from '@/lib/supabase/server'

/** Loads a script for its author's pages; returns null user when not logged in. */
export async function loadOwnScript(gameSlug: string, slug: string) {
  const viewer = await getViewer()
  const { supabase, user } = viewer
  const { data: game } = await supabase.from('games').select('id, slug, name').eq('slug', gameSlug).maybeSingle()
  if (!game) notFound()
  const { data: script } = await supabase.from('scripts').select('*').eq('game_id', game.id).eq('slug', slug).maybeSingle()
  if (!script) notFound()
  if (user && script.author_id !== user.id) notFound()
  return { ...viewer, game, script }
}
