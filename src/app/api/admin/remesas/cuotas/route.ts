import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { tienePermiso } from '@/lib/roles'
import { NextRequest, NextResponse } from 'next/server'

function compararSocio(a: { tipo: string; num_socio: number | null; num_cooperante: number | null }, b: typeof a) {
  if (a.tipo !== b.tipo) return a.tipo === 'profesor' ? -1 : 1
  const na = a.tipo === 'profesor' ? a.num_socio : a.num_cooperante
  const nb = b.tipo === 'profesor' ? b.num_socio : b.num_cooperante
  return (na ?? 0) - (nb ?? 0)
}

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

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const ordenado = (data ?? []).slice().sort((a, b) =>
    compararSocio(a.socios as unknown as { tipo: string; num_socio: number | null; num_cooperante: number | null }, b.socios as unknown as { tipo: string; num_socio: number | null; num_cooperante: number | null })
  )
  return NextResponse.json(ordenado)
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !await tienePermiso(user, 'remesas')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const ref = request.nextUrl.searchParams.get('ref')
  if (!ref) return NextResponse.json({ error: 'ref requerido' }, { status: 400 })

  const admin = createAdminClient()

  const { count, error: countError } = await admin
    .from('cuotas')
    .select('id', { count: 'exact', head: true })
    .eq('referencia_remesa', ref)
    .eq('estado', 'cobrado')

  if (countError) return NextResponse.json({ error: countError.message }, { status: 500 })
  if (count && count > 0) {
    return NextResponse.json({ error: 'No se puede eliminar: la remesa tiene cuotas ya cobradas' }, { status: 400 })
  }

  const { error } = await admin
    .from('cuotas')
    .delete()
    .eq('referencia_remesa', ref)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
