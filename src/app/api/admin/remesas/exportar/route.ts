import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { tienePermiso } from '@/lib/roles'
import { NextRequest, NextResponse } from 'next/server'
import { generarPain008, DeudorSEPA } from '@/lib/sepa'

function csvCell(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return ''
  const s = String(v)
  if (s.includes(';') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`
  return s
}

function csvRow(cols: (string | number | null | undefined)[]): string {
  return cols.map(csvCell).join(';')
}

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
  const formato = request.nextUrl.searchParams.get('formato') as 'xml' | 'csv' | null
  if (!ref || (formato !== 'xml' && formato !== 'csv')) {
    return NextResponse.json({ error: 'ref y formato (xml|csv) requeridos' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: cuotas, error } = await admin
    .from('cuotas')
    .select('anio, semestre, importe, fecha_cobro, socios(id, nombre, apellidos, iban, titular_cuenta, fecha_ingreso, num_socio, num_cooperante, tipo)')
    .eq('referencia_remesa', ref)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!cuotas?.length) return NextResponse.json({ error: 'Remesa no encontrada' }, { status: 404 })

  const { anio, semestre } = cuotas[0]
  const fechaCobro = cuotas[0].fecha_cobro
  if (!fechaCobro) {
    return NextResponse.json({
      error: 'Esta remesa no tiene fecha de cobro guardada (se generó con una versión anterior). Bórrala desde el historial y vuelve a generarla.',
    }, { status: 400 })
  }
  const concepto = `ASPROJUMA cuota ${anio} semestre ${semestre}`

  type SocioRef = { id: number; nombre: string | null; apellidos: string | null; iban: string | null; titular_cuenta: string | null; fecha_ingreso: string | null; num_socio: number | null; num_cooperante: number | null; tipo: string }

  const filas = cuotas
    .map(c => ({ ...c, s: c.socios as unknown as SocioRef }))
    .filter(c => c.s?.iban)
    .sort((a, b) => compararSocio(a.s, b.s))

  const deudores: DeudorSEPA[] = filas.map(c => {
    const s = c.s
    const num = s.tipo === 'profesor' ? s.num_socio : s.num_cooperante
    const nombreCompleto = `${s.nombre ?? ''} ${s.apellidos ?? ''}`.trim()
    const mandatoId = `ASPROJUMA-${String(s.id).padStart(5, '0')}`
    const fechaMandato = s.fecha_ingreso ?? '2004-01-01'
    return {
      socioId: s.id,
      nombre: s.titular_cuenta ?? nombreCompleto,
      iban: s.iban!.replace(/[^A-Za-z0-9]/g, '').toUpperCase(),
      mandatoId,
      fechaMandato,
      secuencia: 'RCUR',
      importe: Number(c.importe),
      endToEndId: `ASPROJUMA-${anio}-S${semestre}-${String(num ?? s.id).padStart(5, '0')}`,
    }
  })

  if (!deudores.length) return NextResponse.json({ error: 'La remesa no tiene deudores con IBAN' }, { status: 400 })

  if (formato === 'csv') {
    const headers = csvRow([
      'Nº Socio', 'Apellidos y nombre', 'Titular cuenta', 'IBAN',
      'Importe (€)', 'Fecha cobro', 'Referencia mandato', 'Fecha mandato',
      'Secuencia', 'End-to-End ID',
    ])
    const rows = filas.map((c, i) => {
      const s = c.s
      const num = s.tipo === 'profesor' ? s.num_socio : `C${String(s.num_cooperante).padStart(3, '0')}`
      const nombreCompleto = `${s.apellidos ?? ''} ${s.nombre ?? ''}`.trim()
      const d = deudores[i]
      return csvRow([
        num, nombreCompleto, d.nombre, d.iban,
        d.importe, fechaCobro, d.mandatoId, d.fechaMandato,
        d.secuencia, d.endToEndId,
      ])
    })
    const bom = '﻿'
    const csv = bom + [headers, ...rows].join('\r\n')
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="remesa-${anio}-S${semestre}.csv"`,
      },
    })
  }

  const creditorIAS = process.env.ASPROJUMA_IAS
  const creditorIBAN = process.env.ASPROJUMA_IBAN
  if (!creditorIAS || !creditorIBAN) {
    return NextResponse.json({
      error: 'Faltan variables de entorno ASPROJUMA_IAS y/o ASPROJUMA_IBAN. Configúralas en Vercel.',
    }, { status: 500 })
  }

  const xml = generarPain008(
    {
      msgId: ref,
      fechaCobro,
      creditorNombre: 'ASPROJUMA',
      creditorIBAN,
      creditorBIC: process.env.ASPROJUMA_BIC ?? '',
      creditorIAS,
      concepto,
    },
    deudores,
  )

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Content-Disposition': `attachment; filename="remesa-${anio}-S${semestre}.xml"`,
    },
  })
}
