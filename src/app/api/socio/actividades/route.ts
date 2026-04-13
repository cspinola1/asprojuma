import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { enviarConfirmacionInvitadoActividad } from '@/lib/email'

interface InvitadoInput {
  nombre: string
  email?: string
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { actividadId, accion, invitados = [] } = await request.json() as {
    actividadId: number
    accion: 'inscribir' | 'cancelar' | 'añadir_invitados'
    invitados?: InvitadoInput[]
  }

  const admin = createAdminClient()

  const { data: socios } = await admin
    .from('socios')
    .select('id, estado')
    .or(`email_uma.ilike.${user.email},email_otros.ilike.${user.email}`)
    .order('id', { ascending: true })
    .limit(1)
  const socio = socios?.[0] ?? null

  if (!socio || !['activo', 'activo_exento', 'honorario'].includes(socio.estado)) {
    return NextResponse.json({ error: 'Solo socios activos pueden inscribirse' }, { status: 403 })
  }

  if (accion === 'cancelar') {
    // Cancelar inscripción propia
    const { error } = await admin
      .from('actividades_inscripciones')
      .update({ estado: 'cancelado' })
      .eq('actividad_id', actividadId)
      .eq('socio_id', socio.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Cancelar invitados pendientes de pago que registró este socio
    await admin
      .from('actividades_invitados')
      .update({ estado: 'cancelado' })
      .eq('actividad_id', actividadId)
      .eq('inscrito_por_socio_id', socio.id)
      .eq('estado', 'inscrito')

    return NextResponse.json({ ok: true })
  }

  // Añadir invitados a una inscripción existente
  if (accion === 'añadir_invitados') {
    if (invitados.length === 0) return NextResponse.json({ error: 'No se han indicado invitados' }, { status: 400 })

    const { data: actividad } = await admin
      .from('actividades')
      .select('plazas, precio, precio_invitado, titulo, fecha_inicio, lugar')
      .eq('id', actividadId)
      .single()

    if (!actividad) return NextResponse.json({ error: 'Actividad no encontrada' }, { status: 404 })

    // Verificar plazas disponibles
    if (actividad.plazas !== null) {
      const { count: sociosCount } = await admin
        .from('actividades_inscripciones').select('*', { count: 'exact', head: true })
        .eq('actividad_id', actividadId).in('estado', ['inscrito', 'pagado'])
      const { count: invitadosCount } = await admin
        .from('actividades_invitados').select('*', { count: 'exact', head: true })
        .eq('actividad_id', actividadId).in('estado', ['inscrito', 'pagado'])
      const totalOcupadas = (sociosCount ?? 0) + (invitadosCount ?? 0)
      if (totalOcupadas + invitados.length > actividad.plazas) {
        return NextResponse.json({ error: 'No quedan plazas suficientes para tus invitados' }, { status: 400 })
      }
    }

    const precioInv = actividad.precio_invitado ?? actividad.precio
    const registros = invitados.map(inv => ({
      actividad_id: actividadId,
      nombre: inv.nombre,
      email: inv.email || null,
      precio: precioInv,
      estado: 'inscrito',
      inscrito_por_socio_id: socio.id,
    }))
    const { error: errInv } = await admin.from('actividades_invitados').insert(registros)
    if (errInv) return NextResponse.json({ error: errInv.message }, { status: 500 })

    if (precioInv === 0) {
      const fecha = new Date(actividad.fecha_inicio + 'T00:00:00').toLocaleDateString('es-ES', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      })
      for (const inv of invitados) {
        if (inv.email) {
          try { await enviarConfirmacionInvitadoActividad(inv.email, inv.nombre, actividad.titulo, fecha, actividad.lugar, false) }
          catch { /* no bloquear */ }
        }
      }
    }
    return NextResponse.json({ ok: true })
  }

  // Obtener actividad
  const { data: actividad } = await admin
    .from('actividades')
    .select('plazas, estado, precio, precio_invitado, titulo, fecha_inicio, lugar')
    .eq('id', actividadId)
    .single()

  if (!actividad || actividad.estado !== 'publicada') {
    return NextResponse.json({ error: 'Actividad no disponible' }, { status: 400 })
  }

  // Verificar plazas contando socios + invitados activos
  if (actividad.plazas !== null) {
    const { count: sociosCount } = await admin
      .from('actividades_inscripciones')
      .select('*', { count: 'exact', head: true })
      .eq('actividad_id', actividadId)
      .in('estado', ['inscrito', 'pagado'])

    const { count: invitadosCount } = await admin
      .from('actividades_invitados')
      .select('*', { count: 'exact', head: true })
      .eq('actividad_id', actividadId)
      .in('estado', ['inscrito', 'pagado'])

    const totalOcupadas = (sociosCount ?? 0) + (invitadosCount ?? 0)
    const nuevas = 1 + invitados.length
    if (totalOcupadas + nuevas > actividad.plazas) {
      return NextResponse.json({ error: 'No quedan plazas suficientes para ti y tus invitados' }, { status: 400 })
    }
  }

  // Inscribir socio
  const { error: errIns } = await admin
    .from('actividades_inscripciones')
    .upsert(
      { actividad_id: actividadId, socio_id: socio.id, estado: 'inscrito' },
      { onConflict: 'actividad_id,socio_id' }
    )
  if (errIns) return NextResponse.json({ error: errIns.message }, { status: 500 })

  // Crear invitados
  if (invitados.length > 0) {
    const precioInv = actividad.precio_invitado ?? actividad.precio
    const registros = invitados.map(inv => ({
      actividad_id: actividadId,
      nombre: inv.nombre,
      email: inv.email || null,
      precio: precioInv,
      estado: 'inscrito',
      inscrito_por_socio_id: socio.id,
    }))
    const { error: errInv } = await admin.from('actividades_invitados').insert(registros)
    if (errInv) return NextResponse.json({ error: errInv.message }, { status: 500 })

    // Si la actividad es gratuita, enviar confirmación inmediata a invitados con email
    if ((actividad.precio_invitado ?? actividad.precio) === 0) {
      const fecha = new Date(actividad.fecha_inicio + 'T00:00:00').toLocaleDateString('es-ES', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      })
      for (const inv of invitados) {
        if (inv.email) {
          try {
            await enviarConfirmacionInvitadoActividad(
              inv.email, inv.nombre, actividad.titulo, fecha, actividad.lugar, false
            )
          } catch { /* no bloquear si falla el email */ }
        }
      }
    }
  }

  return NextResponse.json({ ok: true })
}
