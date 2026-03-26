'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface PerfilFormData {
  tel_movil: string
  tel_fijo: string
  direccion: string
  codigo_postal: string
  localidad: string
  provincia: string
  iban: string
  titular_cuenta: string
}

export async function actualizarPerfil(data: PerfilFormData): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('socios')
    .update({
      tel_movil: data.tel_movil || null,
      tel_fijo: data.tel_fijo || null,
      direccion: data.direccion || null,
      codigo_postal: data.codigo_postal || null,
      localidad: data.localidad || null,
      provincia: data.provincia || null,
      iban: data.iban || null,
      titular_cuenta: data.titular_cuenta || null,
      updated_at: new Date().toISOString(),
    })
    .or(`email_uma.eq.${user.email},email_otros.eq.${user.email}`)

  if (error) return { error: error.message }

  revalidatePath('/socio/perfil')
  return {}
}
