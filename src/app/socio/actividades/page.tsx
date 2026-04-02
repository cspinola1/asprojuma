import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { CalendarioActividades } from '@/components/CalendarioActividades'

export default async function ActividadesSocioPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const admin = createAdminClient()

  const { data: actividades } = await admin
    .from('actividades')
    .select('id, titulo, fecha_inicio, hora_inicio, fecha_fin, hora_fin, lugar, descripcion, precio')
    .eq('estado', 'publicada')
    .order('fecha_inicio')

  const { data: socio } = user
    ? await admin.from('socios').select('id').eq('user_id', user.id).single()
    : { data: null }

  const { data: misInscripciones } = socio
    ? await admin
        .from('actividades_inscripciones')
        .select('actividad_id')
        .eq('socio_id', socio.id)
        .in('estado', ['inscrito', 'pagado'])
    : { data: [] }

  const inscritasIds = (misInscripciones ?? []).map(i => i.actividad_id)

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Actividades</h1>
        <p className="text-sm text-gray-500 mt-1">
          Haz clic en una actividad para ver los detalles e inscribirte.
        </p>
      </div>

      {(actividades ?? []).length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <p className="text-gray-400">No hay actividades programadas.</p>
        </div>
      ) : (
        <CalendarioActividades
          actividades={actividades ?? []}
          modo="socio"
          inscritasIds={inscritasIds}
        />
      )}
    </div>
  )
}
