'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { enviarEmailRecepcionSolicitud } from '@/lib/email'

export interface SolicitudProfesorData {
  // Personales
  nombre: string
  apellidos: string
  dni: string
  fecha_nacimiento: string
  // Académicos
  centro: string
  departamento: string
  area_conocimiento: string
  fecha_jubilacion: string
  categoria: string
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
}

export async function enviarSolicitudProfesor(
  data: SolicitudProfesorData
): Promise<{ error?: string; ok?: boolean }> {
  const supabase = createAdminClient()

  // Verificar DNI duplicado
  const { data: existenteDni } = await supabase
    .from('socios')
    .select('id')
    .eq('dni', data.dni.toUpperCase())
    .single()
  if (existenteDni) {
    return { error: 'Ya existe un socio con ese DNI. Contacta con asprojuma@uma.es si crees que es un error.' }
  }

  // Verificar email UMA duplicado (los profesores tienen email institucional único)
  if (data.email_uma.trim()) {
    const { data: existenteEmail } = await supabase
      .from('socios')
      .select('id')
      .eq('email_uma', data.email_uma.trim())
      .single()
    if (existenteEmail) {
      return { error: 'Ya existe un socio con ese email UMA. Contacta con asprojuma@uma.es si crees que es un error.' }
    }
  }

  // Insertar en socios
  const { data: socio, error: errorSocio } = await supabase
    .from('socios')
    .insert({
      tipo: 'profesor',
      estado: 'pendiente',
      nombre: data.nombre.trim(),
      apellidos: data.apellidos.trim(),
      dni: data.dni.toUpperCase().trim(),
      fecha_nacimiento: data.fecha_nacimiento || null,
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
      migrado_excel: false,
    })
    .select('id')
    .single()

  if (errorSocio || !socio) {
    return { error: errorSocio?.message ?? 'Error al guardar la solicitud' }
  }

  // Insertar datos académicos
  const { error: errorProf } = await supabase
    .from('socios_profesores')
    .insert({
      socio_id: socio.id,
      centro: data.centro.trim() || null,
      departamento: data.departamento.trim() || null,
      area_conocimiento: data.area_conocimiento.trim() || null,
      fecha_jubilacion: data.fecha_jubilacion || null,
      categoria: data.categoria.trim() || null,
    })

  if (errorProf) {
    // Revertir si falla el detalle
    await supabase.from('socios').delete().eq('id', socio.id)
    return { error: errorProf.message }
  }

  // Enviar email de confirmación de recepción
  const emailDestino = data.email_uma.trim() || data.email_otros.trim()
  if (emailDestino) {
    try {
      await enviarEmailRecepcionSolicitud(emailDestino, data.nombre.trim(), data.apellidos.trim())
    } catch { /* No bloquear si falla el email */ }
  }

  return { ok: true }
}
