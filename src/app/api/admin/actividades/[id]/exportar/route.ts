import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { tienePermiso } from '@/lib/roles'
import { NextRequest, NextResponse } from 'next/server'

function csvCell(v: string | number | boolean | null | undefined): string {
  if (v === null || v === undefined) return ''
  const s = String(v)
  if (s.includes(';') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`
  return s
}

function csvRow(cols: (string | number | boolean | null | undefined)[]): string {
  return cols.map(csvCell).join(';')
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !await tienePermiso(user, 'actividades')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const actividadId = Number(params.id)
  const admin = createAdminClient()

  const [{ data: actividad }, { data: inscripciones }, { data: invitados }] = await Promise.all([
    admin.from('actividades').select('titulo, fecha_inicio').eq('id', actividadId).single(),
    admin.from('actividades_inscripciones')
      .select('estado, fecha_inscripcion, fecha_pago, notas, socios(num_socio, num_cooperante, tipo, nombre, apellidos, email_principal, dni)')
      .eq('actividad_id', actividadId)
      .order('fecha_inscripcion'),
    admin.from('actividades_invitados')
      .select('nombre, email, estado, fecha_inscripcion, fecha_pago, precio, notas, socios(nombre, apellidos)')
      .eq('actividad_id', actividadId)
      .order('fecha_inscripcion'),
  ])

  const headers = ['Tipo', 'Nº', 'Apellidos', 'Nombre', 'DNI', 'Email', 'Estado', 'Fecha inscripción', 'Fecha pago', 'Precio', 'Añadido por', 'Notas']

  const rows: string[] = []

  for (const ins of (inscripciones ?? [])) {
    const s = ins.socios as unknown as { num_socio: number | null; num_cooperante: number | null; tipo: string; nombre: string | null; apellidos: string | null; email_principal: string | null; dni: string | null }
    const num = s.tipo === 'profesor' ? s.num_socio : `C${s.num_cooperante}`
    rows.push(csvRow(['Socio', num, s.apellidos, s.nombre, s.dni, s.email_principal, ins.estado, ins.fecha_inscripcion?.slice(0, 10), ins.fecha_pago?.slice(0, 10), null, null, ins.notas]))
  }

  for (const inv of (invitados ?? [])) {
    const autor = inv.socios as unknown as { nombre: string | null; apellidos: string | null } | null
    const añadidoPor = autor ? `${autor.apellidos}, ${autor.nombre}` : null
    rows.push(csvRow(['Invitado', null, null, inv.nombre, null, inv.email, inv.estado, inv.fecha_inscripcion?.slice(0, 10), inv.fecha_pago?.slice(0, 10), inv.precio, añadidoPor, inv.notas]))
  }

  const bom = '\uFEFF'
  const csv = bom + [csvRow(headers), ...rows].join('\r\n')
  const titulo = actividad?.titulo?.replace(/[^a-zA-Z0-9-]/g, '-') ?? 'actividad'
  const fecha = actividad?.fecha_inicio ?? new Date().toISOString().slice(0, 10)

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="inscritos-${titulo}-${fecha}.csv"`,
    },
  })
}
