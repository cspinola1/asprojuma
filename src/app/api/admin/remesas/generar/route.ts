import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdmin } from '@/lib/admin'
import { NextRequest, NextResponse } from 'next/server'
import { generarPain008, DeudorSEPA } from '@/lib/sepa'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdmin(user)) {
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

  // Obtener socios activos con IBAN
  const { data: socios, error } = await admin
    .from('socios')
    .select('id, nombre, apellidos, iban, titular_cuenta, fecha_ingreso, num_socio, num_cooperante, tipo')
    .eq('estado', 'activo')
    .not('iban', 'is', null)
    .order('num_socio', { ascending: true, nullsFirst: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!socios?.length) return NextResponse.json({ error: 'No hay socios activos con IBAN' }, { status: 400 })

  // Determinar qué socios ya tienen cuotas cobradas (RCUR) vs primera vez (FRST)
  const { data: cuotasPrevias } = await admin
    .from('cuotas')
    .select('socio_id')
    .eq('estado', 'cobrado')
    .limit(10000)

  const sociosConHistorial = new Set((cuotasPrevias ?? []).map(c => c.socio_id))

  const msgId = `ASPROJUMA-${anio}-S${semestre}-${Date.now()}`
  const concepto = `ASPROJUMA cuota ${anio} semestre ${semestre}`

  const deudores: DeudorSEPA[] = socios
    .filter(s => s.iban)
    .map(s => {
      const num = s.tipo === 'profesor' ? s.num_socio : s.num_cooperante
      const nombre = `${s.apellidos ?? ''} ${s.nombre ?? ''}`.trim()
      const mandatoId = `ASPROJUMA-${String(s.id).padStart(5, '0')}`
      const fechaMandato = s.fecha_ingreso ?? '2004-01-01'

      return {
        socioId: s.id,
        nombre: s.titular_cuenta ?? nombre,
        iban: s.iban!,
        mandatoId,
        fechaMandato,
        secuencia: sociosConHistorial.has(s.id) ? 'RCUR' : 'FRST',
        importe,
        endToEndId: `ASPROJUMA-${anio}-S${semestre}-${String(num ?? s.id).padStart(5, '0')}`,
      }
    })

  const xml = generarPain008(
    {
      msgId,
      fechaCobro,
      creditorNombre: 'ASPROJUMA',
      creditorIBAN,
      creditorBIC: process.env.ASPROJUMA_BIC ?? '',
      creditorIAS,
      concepto,
    },
    deudores,
  )

  // Crear registros de cuota (estado pendiente)
  const cuotasInsert = deudores.map(d => ({
    socio_id: d.socioId,
    anio,
    semestre,
    importe,
    estado: 'pendiente',
    metodo_pago: 'domiciliacion',
    referencia_remesa: msgId,
  }))

  await admin.from('cuotas').upsert(cuotasInsert, { onConflict: 'socio_id,anio,semestre' })

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Content-Disposition': `attachment; filename="remesa-${anio}-S${semestre}.xml"`,
    },
  })
}
