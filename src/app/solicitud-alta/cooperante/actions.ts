'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export interface SolicitudCoopenanteData {
  // Personales
  nombre: string
  apellidos: string
  dni: string
  fecha_nacimiento: string
  // Relación con la UMA
  estudios: string
  aficiones: string
  descripcion_relacion: string
  // Contacto
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
  // Avalistas
  avalista1_email: string
  avalista2_email: string
}

export async function enviarSolicitudCooperante(
  data: SolicitudCoopenanteData
): Promise<{ error?: string; ok?: boolean }> {
  const supabase = createAdminClient()

  // Verificar DNI duplicado
  const { data: existenteDni } = await supabase
    .from('socios')
    .select('id')
    .eq('dni', data.dni.toUpperCase().trim())
    .single()
  if (existenteDni) {
    return { error: 'Ya existe un socio con ese DNI. Contacta con asprojuma@uma.es si crees que es un error.' }
  }

  // Verificar email duplicado
  if (data.email_otros.trim()) {
    const { data: existenteEmail } = await supabase
      .from('socios')
      .select('id')
      .or(`email_uma.eq.${data.email_otros.trim()},email_otros.eq.${data.email_otros.trim()}`)
      .single()
    if (existenteEmail) {
      return { error: 'Ya existe un socio con ese email. Contacta con asprojuma@uma.es si crees que es un error.' }
    }
  }

  // Verificar que los avalistas son socios profesores activos
  for (const email of [data.avalista1_email, data.avalista2_email]) {
    const { data: avalista } = await supabase
      .from('socios')
      .select('id, tipo, estado')
      .or(`email_uma.eq.${email},email_otros.eq.${email}`)
      .single()

    if (!avalista || avalista.tipo !== 'profesor' || !['activo', 'activo_exento'].includes(avalista.estado)) {
      return { error: `El email ${email} no corresponde a ningún socio profesor activo de ASPROJUMA.` }
    }
  }

  // Insertar en socios
  const { data: socio, error: errorSocio } = await supabase
    .from('socios')
    .insert({
      tipo: 'cooperante',
      estado: 'pendiente',
      nombre: data.nombre.trim(),
      apellidos: data.apellidos.trim(),
      dni: data.dni.toUpperCase().trim(),
      fecha_nacimiento: data.fecha_nacimiento || null,
      email_otros: data.email_otros.trim() || null,
      tel_movil: data.tel_movil.trim() || null,
      tel_fijo: data.tel_fijo.trim() || null,
      direccion: data.direccion.trim() || null,
      codigo_postal: data.codigo_postal.trim() || null,
      localidad: data.localidad.trim() || null,
      provincia: data.provincia.trim() || null,
      iban: data.iban.replace(/\s/g, '').toUpperCase() || null,
      titular_cuenta: data.titular_cuenta.trim() || null,
      notas: `AVALISTAS: ${data.avalista1_email} | ${data.avalista2_email}`,
      migrado_excel: false,
    })
    .select('id')
    .single()

  if (errorSocio || !socio) {
    return { error: errorSocio?.message ?? 'Error al guardar la solicitud' }
  }

  // Insertar datos de cooperante
  const { error: errorCoop } = await supabase
    .from('socios_cooperantes')
    .insert({
      socio_id: socio.id,
      estudios: data.estudios.trim() || null,
      aficiones: data.aficiones.trim() || null,
      descripcion_relacion: data.descripcion_relacion.trim() || null,
    })

  if (errorCoop) {
    await supabase.from('socios').delete().eq('id', socio.id)
    return { error: errorCoop.message }
  }

  return { ok: true }
}
