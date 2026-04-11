import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { tienePermiso } from '@/lib/roles'
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !await tienePermiso(user, 'actividades')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const body = await request.json()
  const admin = createAdminClient()
  const { error } = await admin
    .from('actividades')
    .update({
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
      estado: body.estado,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  revalidatePath('/admin/actividades')
  revalidatePath(`/admin/actividades/${params.id}`)
  return NextResponse.json({ ok: true })
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !await tienePermiso(user, 'actividades')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const admin = createAdminClient()
  const { error } = await admin.from('actividades').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
