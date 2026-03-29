'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export interface EditarSocioData {
  // Identificación
  apellidos: string
  nombre: string
  dni: string
  fecha_nacimiento: string
  // Estado y tipo
  estado: string
  num_socio: string
  num_cooperante: string
  fecha_ingreso: string
  fecha_baja: string
  // Contacto
  email_uma: string
  email_otros: string
  tel_movil: string
  tel_fijo: string
  // Dirección
  direccion: string
  codigo_postal: string
  localidad: string
  provincia: string
  // Banco
  iban: string
  titular_cuenta: string
  // Notas
  notas: string
  // Académicos (profesores)
  centro: string
  departamento: string
  area_conocimiento: string
  fecha_jubilacion: string
  categoria: string
}

async function checkEmailDuplicado(admin: ReturnType<typeof createAdminClient>, email: string, excludeId: number) {
  if (!email) return null
  const { data } = await admin
    .from('socios')
    .select('id, nombre, apellidos')
    .or(`email_uma.eq.${email},email_otros.eq.${email}`)
    .neq('id', excludeId)
    .limit(1)
  return data?.[0] ?? null
}

export async function editarSocio(
  id: number,
  tipo: string,
  data: EditarSocioData
): Promise<{ error?: string }> {
  const admin = createAdminClient()

  // Verificar emails duplicados
  if (data.email_uma.trim()) {
    const dup = await checkEmailDuplicado(admin, data.email_uma.trim(), id)
    if (dup) return { error: `El email UMA ya pertenece a ${dup.apellidos}, ${dup.nombre}` }
  }
  if (data.email_otros.trim()) {
    const dup = await checkEmailDuplicado(admin, data.email_otros.trim(), id)
    if (dup) return { error: `El email ya pertenece a ${dup.apellidos}, ${dup.nombre}` }
  }

  const { error } = await admin.from('socios').update({
    apellidos: data.apellidos.trim() || null,
    nombre: data.nombre.trim() || null,
    dni: data.dni.trim().toUpperCase() || null,
    fecha_nacimiento: data.fecha_nacimiento || null,
    estado: data.estado,
    num_socio: data.num_socio ? parseInt(data.num_socio) : null,
    num_cooperante: data.num_cooperante ? parseInt(data.num_cooperante) : null,
    fecha_ingreso: data.fecha_ingreso || null,
    fecha_baja: data.fecha_baja || null,
    email_uma: data.email_uma.trim() || null,
    email_otros: data.email_otros.trim() || null,
    tel_movil: data.tel_movil.trim() || null,
    tel_fijo: data.tel_fijo.trim() || null,
    direccion: data.direccion.trim() || null,
    codigo_postal: data.codigo_postal.trim() || null,
    localidad: data.localidad.trim() || null,
    provincia: data.provincia.trim() || null,
    iban: data.iban.replace(/\s/g, '').toUpperCase() || null,
    titular_cuenta: data.titular_cuenta.trim() || null,
    notas: data.notas.trim() || null,
    updated_at: new Date().toISOString(),
  }).eq('id', id)

  if (error) return { error: error.message }

  if (tipo === 'profesor') {
    await admin.from('socios_profesores').upsert({
      socio_id: id,
      centro: data.centro.trim() || null,
      departamento: data.departamento.trim() || null,
      area_conocimiento: data.area_conocimiento.trim() || null,
      fecha_jubilacion: data.fecha_jubilacion || null,
      categoria: data.categoria.trim() || null,
    }, { onConflict: 'socio_id' })
  }

  revalidatePath(`/admin/socios/${id}`)
  revalidatePath('/admin/socios')
  return {}
}
