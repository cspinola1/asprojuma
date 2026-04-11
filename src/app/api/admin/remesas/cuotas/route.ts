import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { tienePermiso } from '@/lib/roles'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !await tienePermiso(user, 'remesas')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const ref = request.nextUrl.searchParams.get('ref')
  if (!ref) return NextResponse.json({ error: 'ref requerido' }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('cuotas')
    .select('id, socio_id, anio, semestre, importe, estado, fecha_cobro, motivo_devolucion, socios(num_socio, num_cooperante, tipo, nombre, apellidos, iban)')
    .eq('referencia_remesa', ref)
    .order('socio_id')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
