import { createAdminClient } from './supabase/admin'
import { User } from '@supabase/supabase-js'

export type Rol = 'tesorero' | 'secretario' | 'junta' | 'presidente' | 'admin'

export const ROLES: Rol[] = ['tesorero', 'secretario', 'junta', 'presidente', 'admin']

export const PERMISOS: Record<string, Rol[]> = {
  dashboard:    ['tesorero', 'secretario', 'junta', 'presidente', 'admin'],
  socios:       ['tesorero', 'secretario', 'junta', 'presidente', 'admin'],
  solicitudes:  ['tesorero', 'secretario', 'presidente', 'admin'],
  cuotas:       ['tesorero', 'presidente', 'admin'],
  remesas:      ['tesorero', 'presidente', 'admin'],
  carnets:      ['tesorero', 'secretario', 'presidente', 'admin'],
  editar_socio: ['secretario', 'presidente', 'admin'],
  actividades:  ['junta', 'presidente', 'admin'],
  roles:        ['admin'],
}

const ADMIN_EMAILS_ENV = (process.env.ADMIN_EMAILS ?? '')
  .split(',').map(e => e.trim().toLowerCase()).filter(Boolean)

export async function getRol(email: string): Promise<Rol | null> {
  const emailLower = email.toLowerCase()
  if (ADMIN_EMAILS_ENV.includes(emailLower)) return 'admin'

  const supabase = createAdminClient()
  const { data } = await supabase
    .from('admin_roles')
    .select('rol')
    .eq('email', emailLower)
    .single()
  return (data?.rol as Rol) ?? null
}

export async function esAdminUser(user: User | null): Promise<boolean> {
  if (!user?.email) return false
  return (await getRol(user.email)) !== null
}

export async function tienePermiso(user: User | null, permiso: string): Promise<boolean> {
  if (!user?.email) return false
  const rol = await getRol(user.email)
  if (!rol) return false
  return PERMISOS[permiso]?.includes(rol) ?? false
}
