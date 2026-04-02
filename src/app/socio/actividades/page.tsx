import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'

function formatFecha(fecha: string) {
  return new Date(fecha + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default async function ActividadesSocioPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const admin = createAdminClient()

  const { data: actividades } = await admin
    .from('actividades')
    .select('*')
    .eq('estado', 'publicada')
    .gte('fecha_inicio', new Date().toISOString().slice(0, 10))
    .order('fecha_inicio')

  // Inscripciones del socio actual
  const { data: socio } = user
    ? await admin.from('socios').select('id').eq('user_id', user.id).single()
    : { data: null }

  const { data: misInscripciones } = socio
    ? await admin
        .from('actividades_inscripciones')
        .select('actividad_id, estado')
        .eq('socio_id', socio.id)
        .in('estado', ['inscrito', 'pagado'])
    : { data: [] }

  const inscritasIds = new Set((misInscripciones ?? []).map(i => i.actividad_id))

  const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

  // Agrupar por mes
  const porMes = new Map<string, typeof actividades>()
  for (const a of actividades ?? []) {
    const d = new Date(a.fecha_inicio + 'T00:00:00')
    const key = `${d.getFullYear()}-${d.getMonth()}`
    if (!porMes.has(key)) porMes.set(key, [])
    porMes.get(key)!.push(a)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Actividades</h1>

      {(actividades ?? []).length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <p className="text-gray-400">No hay actividades próximas programadas.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Array.from(porMes.entries()).map(([key, acts]) => {
            const [year, month] = key.split('-').map(Number)
            return (
              <div key={key}>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  {MESES[month]} {year}
                </h2>
                <div className="space-y-3">
                  {acts!.map(a => {
                    const inscrito = inscritasIds.has(a.id)
                    return (
                      <Link
                        key={a.id}
                        href={`/socio/actividades/${a.id}`}
                        className="block bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex gap-4">
                            <div className="text-center min-w-[48px]">
                              <p className="text-2xl font-bold text-blue-900 leading-none">
                                {new Date(a.fecha_inicio + 'T00:00:00').getDate()}
                              </p>
                              <p className="text-xs text-gray-400 uppercase">
                                {MESES[new Date(a.fecha_inicio + 'T00:00:00').getMonth()].slice(0,3)}
                              </p>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{a.titulo}</p>
                              <div className="flex gap-3 text-xs text-gray-500 mt-1 flex-wrap">
                                {a.hora_inicio && <span>🕐 {a.hora_inicio.slice(0,5)}</span>}
                                {a.lugar && <span>📍 {a.lugar}</span>}
                                <span>{a.precio === 0 ? '✓ Gratuita' : `${Number(a.precio).toFixed(2)} €`}</span>
                              </div>
                              {a.descripcion && (
                                <p className="text-sm text-gray-500 mt-2 line-clamp-2">{a.descripcion}</p>
                              )}
                            </div>
                          </div>
                          {inscrito && (
                            <span className="shrink-0 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
                              Inscrito/a
                            </span>
                          )}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
