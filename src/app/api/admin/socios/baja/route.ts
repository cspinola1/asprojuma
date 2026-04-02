import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { tienePermiso } from '@/lib/roles'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !await tienePermiso(user, 'editar_socio')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { socioId, motivo } = await request.json() as { socioId: number; motivo?: string }
  if (!socioId) return NextResponse.json({ error: 'socioId requerido' }, { status: 400 })

  const admin = createAdminClient()

  const { data: socio } = await admin.from('socios').select('notas').eq('id', socioId).single()
  const notasActuales = socio?.notas ?? ''
  const notasNuevas = [`BAJA: ${motivo ?? 'Devolución de cuota no resuelta'}`, notasActuales].filter(Boolean).join('\n')

  const { error } = await admin.from('socios').update({
    estado: 'baja',
    fecha_baja: new Date().toISOString().slice(0, 10),
    notas: notasNuevas,
    updated_at: new Date().toISOString(),
  }).eq('id', socioId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
