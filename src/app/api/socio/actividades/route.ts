import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

// Inscribirse o cancelar inscripción
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { actividadId, accion } = await request.json() as { actividadId: number; accion: 'inscribir' | 'cancelar' }

  const admin = createAdminClient()

  // Obtener socio_id del usuario actual
  const { data: socio } = await admin
    .from('socios')
    .select('id, estado')
    .eq('user_id', user.id)
    .single()

  if (!socio || !['activo', 'activo_exento', 'honorario'].includes(socio.estado)) {
    return NextResponse.json({ error: 'Solo socios activos pueden inscribirse' }, { status: 403 })
  }

  if (accion === 'cancelar') {
    const { error } = await admin
      .from('actividades_inscripciones')
      .update({ estado: 'cancelado' })
      .eq('actividad_id', actividadId)
      .eq('socio_id', socio.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  // Verificar plazas disponibles
  const { data: actividad } = await admin
    .from('actividades')
    .select('plazas, estado')
    .eq('id', actividadId)
    .single()

  if (!actividad || actividad.estado !== 'publicada') {
    return NextResponse.json({ error: 'Actividad no disponible' }, { status: 400 })
  }

  if (actividad.plazas !== null) {
    const { count } = await admin
      .from('actividades_inscripciones')
      .select('*', { count: 'exact', head: true })
      .eq('actividad_id', actividadId)
      .in('estado', ['inscrito', 'pagado'])
    if ((count ?? 0) >= actividad.plazas) {
      return NextResponse.json({ error: 'No quedan plazas disponibles' }, { status: 400 })
    }
  }

  const { error } = await admin
    .from('actividades_inscripciones')
    .upsert({ actividad_id: actividadId, socio_id: socio.id, estado: 'inscrito' }, { onConflict: 'actividad_id,socio_id' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
