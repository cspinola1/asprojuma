import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { tienePermiso } from '@/lib/roles'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !await tienePermiso(user, 'actividades')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const admin = createAdminClient()
  const [{ data, error }, { data: sociosCounts }, { data: invitadosCounts }] = await Promise.all([
    admin.from('actividades').select('*').order('fecha_inicio', { ascending: false }),
    admin.from('actividades_inscripciones').select('actividad_id').in('estado', ['inscrito', 'pagado']),
    admin.from('actividades_invitados').select('actividad_id').in('estado', ['inscrito', 'pagado']),
  ])
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const totales: Record<number, number> = {}
  for (const r of [...(sociosCounts ?? []), ...(invitadosCounts ?? [])]) {
    totales[r.actividad_id] = (totales[r.actividad_id] ?? 0) + 1
  }

  return NextResponse.json((data ?? []).map(a => ({ ...a, total_inscritos: totales[a.id] ?? 0 })))
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !await tienePermiso(user, 'actividades')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const body = await request.json()
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('actividades')
    .insert({
      titulo: body.titulo?.trim(),
      descripcion: body.descripcion?.trim() || null,
      fecha_inicio: body.fecha_inicio,
      hora_inicio: body.hora_inicio || null,
      fecha_fin: body.fecha_fin || null,
      hora_fin: body.hora_fin || null,
      lugar: body.lugar?.trim() || null,
      precio: Number(body.precio ?? 0),
      precio_invitado: body.precio_invitado != null ? Number(body.precio_invitado) : null,
      plazas: body.plazas ? Number(body.plazas) : null,
      estado: body.estado ?? 'publicada',
    })
    .select('id')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
