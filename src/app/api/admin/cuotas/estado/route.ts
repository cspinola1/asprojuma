import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdmin } from '@/lib/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { cuotaId, estado, motivo } = await request.json() as {
    cuotaId: number
    estado: 'cobrado' | 'devuelto'
    motivo?: string
  }

  if (!cuotaId || !estado) return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })

  const admin = createAdminClient()
  const update: Record<string, unknown> = { estado }

  if (estado === 'cobrado') {
    update.fecha_cobro = new Date().toISOString().slice(0, 10)
    update.motivo_devolucion = null
  } else if (estado === 'devuelto') {
    update.motivo_devolucion = motivo ?? null
    update.fecha_cobro = null
  }

  const { error } = await admin.from('cuotas').update(update).eq('id', cuotaId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
