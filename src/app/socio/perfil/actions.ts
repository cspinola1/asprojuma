'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export interface PerfilFormData {
  tel_movil: string
  tel_fijo: string
  direccion: string
  codigo_postal: string
  localidad: string
  provincia: string
  email_uma: string
  email_otros: string
  // Académicos (solo profesores)
  centro: string
  departamento: string
  area_conocimiento: string
  fecha_jubilacion: string
  categoria: string
}

export async function actualizarPerfil(data: PerfilFormData): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return { error: 'No autenticado' }

  const admin = createAdminClient()

  // Buscar socio por email
  const { data: socios } = await admin
    .from('socios')
    .select('id, tipo')
    .or(`email_uma.ilike.${user.email},email_otros.ilike.${user.email}`)
    .limit(1)
  const socio = socios?.[0]
  if (!socio) return { error: 'Socio no encontrado' }

  // Actualizar datos del socio
  const { error } = await admin
    .from('socios')
    .update({
      tel_movil: data.tel_movil || null,
      tel_fijo: data.tel_fijo || null,
      direccion: data.direccion || null,
      codigo_postal: data.codigo_postal || null,
      localidad: data.localidad || null,
      provincia: data.provincia || null,
      email_uma: data.email_uma || null,
      email_otros: data.email_otros || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', socio.id)

  if (error) return { error: error.message }

  // Actualizar datos académicos si es profesor
  if (socio.tipo === 'profesor') {
    const { error: errorProf } = await admin
      .from('socios_profesores')
      .update({
        centro: data.centro || null,
        departamento: data.departamento || null,
        area_conocimiento: data.area_conocimiento || null,
        fecha_jubilacion: data.fecha_jubilacion || null,
        categoria: data.categoria || null,
      })
      .eq('socio_id', socio.id)

    if (errorProf) return { error: errorProf.message }
  }

  revalidatePath('/socio/perfil')
  return {}
}
