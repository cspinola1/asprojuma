'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { enviarEmailRechazoSolicitud, enviarEmailAvalistaCooperante } from '@/lib/email'

export async function aprobarSolicitud(id: number): Promise<{ error?: string }> {
  const db = createAdminClient()

  // Obtener el socio pendiente
  const { data: socio } = await db
    .from('socios')
    .select('tipo, email_uma, email_otros, notas')
    .eq('id', id)
    .single()

  if (!socio) return { error: 'Solicitud no encontrada' }

  // Bloquear aprobación de cooperante si no tienen los dos avales confirmados manualmente
  if (socio.tipo === 'cooperante') {
    const notas = socio.notas ?? ''
    const tieneAvalistas = notas.includes('AVALISTAS:')
    if (!tieneAvalistas) {
      return { error: 'Este cooperante no tiene avalistas registrados en su solicitud.' }
    }
    const aval1ok = notas.includes('AVAL1_CONFIRMADO')
    const aval2ok = notas.includes('AVAL2_CONFIRMADO')
    if (!aval1ok || !aval2ok) {
      return { error: 'Faltan avales por confirmar. Marca ambos avales como confirmados antes de aprobar.' }
    }
  }

  const updateData: Record<string, unknown> = {
    estado: 'activo',
    fecha_ingreso: new Date().toISOString().split('T')[0],
    updated_at: new Date().toISOString(),
  }

  if (socio.tipo === 'profesor') {
    // Siguiente número de socio profesor
    const { data: maxRow } = await db
      .from('socios')
      .select('num_socio')
      .eq('tipo', 'profesor')
      .not('num_socio', 'is', null)
      .order('num_socio', { ascending: false })
      .limit(1)
      .single()

    updateData.num_socio = (maxRow?.num_socio ?? 146) + 1
  } else {
    // Siguiente número de cooperante
    const { data: maxRow } = await db
      .from('socios')
      .select('num_cooperante')
      .eq('tipo', 'cooperante')
      .not('num_cooperante', 'is', null)
      .order('num_cooperante', { ascending: false })
      .limit(1)
      .single()

    updateData.num_cooperante = (maxRow?.num_cooperante ?? 54) + 1
  }

  const { error } = await db
    .from('socios')
    .update(updateData)
    .eq('id', id)
    .eq('estado', 'pendiente')

  if (error) return { error: error.message }

  // Enviar email de bienvenida / acceso al portal
  const emailInvite = socio.email_uma || socio.email_otros
  if (emailInvite) {
    try {
      const admin = createAdminClient()
      await admin.auth.admin.inviteUserByEmail(emailInvite, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm`,
      })
    } catch {
      // No bloquear si falla el email
    }
  }

  revalidatePath('/admin/solicitudes')
  revalidatePath(`/admin/solicitudes/${id}`)
  revalidatePath('/admin/socios')
  return {}
}

export async function rechazarSolicitud(
  id: number,
  motivo: string
): Promise<{ error?: string }> {
  const db = createAdminClient()

  const { data: socio } = await db
    .from('socios')
    .select('notas, nombre, apellidos, email_uma, email_otros')
    .eq('id', id)
    .single()

  const notasActuales = socio?.notas ?? ''
  const notasNuevas = `RECHAZADA: ${motivo}\n${notasActuales}`.trim()

  const { error } = await db
    .from('socios')
    .update({
      estado: 'baja',
      notas: notasNuevas,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('estado', 'pendiente')

  if (error) return { error: error.message }

  // Enviar email de rechazo con observaciones
  const emailRechazo = socio?.email_uma || socio?.email_otros
  if (emailRechazo) {
    try {
      await enviarEmailRechazoSolicitud(
        emailRechazo,
        socio?.nombre ?? '',
        socio?.apellidos ?? '',
        motivo,
      )
    } catch { /* No bloquear si falla el email */ }
  }

  revalidatePath('/admin/solicitudes')
  revalidatePath(`/admin/solicitudes/${id}`)
  return {}
}

// Marca un aval como confirmado (aval: 1 o 2) y refresca la ficha
export async function confirmarAval(id: number, aval: 1 | 2): Promise<{ error?: string }> {
  const db = createAdminClient()

  const { data: socio } = await db
    .from('socios')
    .select('notas')
    .eq('id', id)
    .single()

  if (!socio) return { error: 'Solicitud no encontrada' }

  const marca = `AVAL${aval}_CONFIRMADO`
  if ((socio.notas ?? '').includes(marca)) return {} // ya estaba marcado

  const notasNuevas = `${(socio.notas ?? '').trim()}\n${marca}`.trim()

  const { error } = await db
    .from('socios')
    .update({ notas: notasNuevas, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath(`/admin/solicitudes/${id}`)
  return {}
}

// Reenvía el email de aval a un avalista y devuelve error visible si falla
export async function reenviarEmailAvalista(
  id: number,
  emailAvalista: string,
  nombreCooperante: string,
  apellidosCooperante: string,
): Promise<{ error?: string; ok?: boolean }> {
  try {
    await enviarEmailAvalistaCooperante(emailAvalista, nombreCooperante, apellidosCooperante)
    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('Error enviando email a avalista', emailAvalista, msg)
    return { error: `No se pudo enviar el email a ${emailAvalista}: ${msg}` }
  }
}
