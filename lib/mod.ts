import { notFound } from 'next/navigation'
import { getViewer } from '@/lib/supabase/server'

export async function requireModerator() {
  const viewer = await getViewer()
  const role = viewer.profile?.role
  if (role !== 'moderator' && role !== 'admin') notFound()
  return { ...viewer, isAdmin: role === 'admin' }
}
