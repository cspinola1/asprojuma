import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { tienePermiso } from '@/lib/roles'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !await tienePermiso(user, 'remesas')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const creditorIAS = process.env.ASPROJUMA_IAS
  const creditorIBAN = process.env.ASPROJUMA_IBAN
  if (!creditorIAS || !creditorIBAN) {
    return NextResponse.json({
      error: 'Faltan variables de entorno ASPROJUMA_IAS y/o ASPROJUMA_IBAN. Configúralas en Vercel.',
    }, { status: 500 })
  }

  const { anio, semestre, fechaCobro, importe } = await request.json() as {
    anio: number
    semestre: 1 | 2
    fechaCobro: string
    importe: number
  }

  if (!anio || !semestre || !fechaCobro || !importe) {
    return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: existente } = await admin
    .from('cuotas')
    .select('referencia_remesa, fecha_cobro')
    .eq('anio', anio)
    .eq('semestre', semestre)
    .not('referencia_remesa', 'is', null)
    .limit(1)
    .maybeSingle()

  if (existente) {
    const fechaExistente = existente.fecha_cobro
      ? new Date(existente.fecha_cobro + 'T00:00:00').toLocaleDateString('es-ES')
      : 'sin fecha guardada'
    return NextResponse.json({
      error: `Ya existe una remesa para ${anio} semestre ${semestre} (ref: ${existente.referencia_remesa}, fecha de cobro: ${fechaExistente}). Elimínala desde el historial si quieres generar una nueva.`,
    }, { status: 400 })
  }

  const { data: socios, error } = await admin
    .from('socios')
    .select('id, iban')
    .eq('estado', 'activo')
    .not('iban', 'is', null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!socios?.length) return NextResponse.json({ error: 'No hay socios activos con IBAN' }, { status: 400 })

  const msgId = `ASPROJUMA-${anio}-S${semestre}-${Date.now()}`

  const cuotasInsert = socios.map(s => ({
    socio_id: s.id,
    anio,
    semestre,
    importe,
    estado: 'pendiente',
    metodo_pago: 'domiciliacion',
    referencia_remesa: msgId,
    fecha_cobro: fechaCobro,
  }))
  const { error: upsertError } = await admin
    .from('cuotas')
    .upsert(cuotasInsert, { onConflict: 'socio_id,anio,semestre' })

  if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 500 })

  return NextResponse.json({ referencia: msgId, total: socios.length, importe_total: socios.length * importe })
}
