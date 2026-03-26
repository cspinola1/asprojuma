import { createClient } from '@supabase/supabase-js'

// Cliente con service_role — solo usar en Server Actions/API routes
// Nunca exponer al cliente
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY no configurada en .env.local')

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
