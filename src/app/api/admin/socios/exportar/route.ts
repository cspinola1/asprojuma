import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdmin } from '@/lib/admin'
import { NextRequest, NextResponse } from 'next/server'

function csvCell(v: string | number | boolean | null | undefined): string {
  if (v === null || v === undefined) return ''
  const s = String(v)
  if (s.includes(';') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function csvRow(cols: (string | number | boolean | null | undefined)[]): string {
  return cols.map(csvCell).join(';')
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { searchParams } = request.nextUrl
  const q = searchParams.get('q')
  const tipo = searchParams.get('tipo')
  const estado = searchParams.get('estado')

  const admin = createAdminClient()
  let query = admin
    .from('socios')
    .select('*, socios_profesores(centro, departamento, area_conocimiento, fecha_jubilacion, categoria)')
    .order('apellidos', { ascending: true })

  if (tipo === 'profesor' || tipo === 'cooperante') query = query.eq('tipo', tipo)
  if (estado) query = query.eq('estado', estado)
  if (q) {
    const qs = q.trim()
    query = query.or(`apellidos.ilike.%${qs}%,nombre.ilike.%${qs}%,email_principal.ilike.%${qs}%,dni.ilike.%${qs}%`)
  }

  const { data: socios, error } = await query.limit(2000)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const headers = [
    'Nº Socio', 'Nº Cooperante', 'Tipo', 'Estado',
    'Apellidos', 'Nombre', 'DNI',
    'Fecha nacimiento', 'Fecha ingreso', 'Fecha baja',
    'Email UMA', 'Email personal', 'Email principal',
    'Tel. móvil', 'Tel. fijo',
    'Dirección', 'C.P.', 'Localidad', 'Provincia',
    'IBAN', 'Titular cuenta',
    'Centro', 'Departamento', 'Área conocimiento', 'Fecha jubilación', 'Categoría',
    'Notas',
  ]

  const rows = (socios ?? []).map(s => {
    const p = (s as { socios_profesores?: { centro?: string; departamento?: string; area_conocimiento?: string; fecha_jubilacion?: string; categoria?: string } }).socios_profesores
    return csvRow([
      s.num_socio, s.num_cooperante, s.tipo, s.estado,
      s.apellidos, s.nombre, s.dni,
      s.fecha_nacimiento, s.fecha_ingreso, s.fecha_baja,
      s.email_uma, s.email_otros, s.email_principal,
      s.tel_movil, s.tel_fijo,
      s.direccion, s.codigo_postal, s.localidad, s.provincia,
      s.iban, s.titular_cuenta,
      p?.centro, p?.departamento, p?.area_conocimiento, p?.fecha_jubilacion, p?.categoria,
      s.notas,
    ])
  })

  const bom = '\uFEFF' // BOM para que Excel abra con UTF-8 correctamente
  const csv = bom + [csvRow(headers), ...rows].join('\r\n')

  const fecha = new Date().toISOString().slice(0, 10)
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="socios-${fecha}.csv"`,
    },
  })
}
