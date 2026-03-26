import { User } from '@supabase/supabase-js'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean)

export function isAdmin(user: User | null): boolean {
  if (!user?.email) return false
  return ADMIN_EMAILS.includes(user.email.toLowerCase())
}
