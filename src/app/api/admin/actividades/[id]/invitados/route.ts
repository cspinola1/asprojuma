import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { tienePermiso } from '@/lib/roles'
import { NextRequest, NextResponse } from 'next/server'
import { enviarConfirmacionInvitadoActividad } from '@/lib/email'

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !await tienePermiso(user, 'actividades')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('actividades_invitados')
    .select('*, socios:inscrito_por_socio_id(nombre, apellidos)')
    .eq('actividad_id', params.id)
    .order('fecha_inscripcion')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !await tienePermiso(user, 'actividades')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { nombre, email, precio, notas } = await request.json()
  if (!nombre?.trim()) return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('actividades_invitados')
    .insert({ actividad_id: Number(params.id), nombre, email: email || null, precio: precio ?? null, notas: notas || null })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !await tienePermiso(user, 'actividades')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { invitadoId, estado, fecha_pago, notas } = await request.json()
  const admin = createAdminClient()

  const { data: invitado } = await admin
    .from('actividades_invitados')
    .select('nombre, email, actividades(titulo, fecha_inicio, lugar)')
    .eq('id', invitadoId)
    .single()

  const { error } = await admin
    .from('actividades_invitados')
    .update({ estado, fecha_pago: fecha_pago || null, notas: notas !== undefined ? notas : undefined })
    .eq('id', invitadoId)
    .eq('actividad_id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Enviar confirmación si se marca como pagado y tiene email
  if (estado === 'pagado' && invitado?.email) {
    try {
      const act = invitado.actividades as unknown as { titulo: string; fecha_inicio: string; lugar: string | null } | null
      if (act) {
        const fecha = new Date(act.fecha_inicio + 'T00:00:00').toLocaleDateString('es-ES', {
          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        })
        await enviarConfirmacionInvitadoActividad(
          invitado.email, invitado.nombre, act.titulo, fecha, act.lugar, true
        )
      }
    } catch { /* no bloquear */ }
  }

  return NextResponse.json({ ok: true })
}
