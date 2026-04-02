import { createClient } from '@/lib/supabase/server'
import { esAdminUser } from '@/lib/roles'
import { redirect } from 'next/navigation'

// Página de redirección post-login: comprueba si el usuario es admin y redirige al área correcta.
export default async function AuthRedirectPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')
  if (await esAdminUser(user)) redirect('/admin')
  redirect('/socio')
}
