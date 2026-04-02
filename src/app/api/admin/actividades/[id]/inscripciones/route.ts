import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { tienePermiso } from '@/lib/roles'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !await tienePermiso(user, 'actividades')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('actividades_inscripciones')
    .select('*, socios(num_socio, num_cooperante, tipo, nombre, apellidos, email_uma, email_otros)')
    .eq('actividad_id', params.id)
    .order('fecha_inscripcion')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest, _ctx: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !await tienePermiso(user, 'actividades')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { inscripcionId, estado, fecha_pago, notas } = await request.json()
  const admin = createAdminClient()
  const { error } = await admin
    .from('actividades_inscripciones')
    .update({ estado, fecha_pago: fecha_pago || null, notas: notas || null })
    .eq('id', inscripcionId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
