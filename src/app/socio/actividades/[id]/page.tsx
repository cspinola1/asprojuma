import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { InscripcionBoton } from './InscripcionBoton'
import { AddToCalendar } from './AddToCalendar'

const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']

export default async function ActividadDetallePage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const admin = createAdminClient()

  const { data: actividad } = await admin
    .from('actividades')
    .select('*')
    .eq('id', params.id)
    .eq('estado', 'publicada')
    .single()

  if (!actividad) notFound()

  const { data: socio } = user
    ? await admin.from('socios').select('id, estado').eq('user_id', user.id).single()
    : { data: null }

  const { data: inscripcion } = socio
    ? await admin
        .from('actividades_inscripciones')
        .select('estado')
        .eq('actividad_id', actividad.id)
        .eq('socio_id', socio.id)
        .single()
    : { data: null }

  const { data: misInvitados } = socio
    ? await admin
        .from('actividades_invitados')
        .select('id, nombre, email, estado')
        .eq('actividad_id', actividad.id)
        .eq('inscrito_por_socio_id', socio.id)
        .neq('estado', 'cancelado')
    : { data: [] }

  // Plazas disponibles contando socios + invitados activos
  let plazasDisponibles: number | null = null
  if (actividad.plazas) {
    const { count: sociosCount } = await admin
      .from('actividades_inscripciones')
      .select('*', { count: 'exact', head: true })
      .eq('actividad_id', actividad.id)
      .in('estado', ['inscrito', 'pagado'])
    const { count: invitadosCount } = await admin
      .from('actividades_invitados')
      .select('*', { count: 'exact', head: true })
      .eq('actividad_id', actividad.id)
      .in('estado', ['inscrito', 'pagado'])
    plazasDisponibles = actividad.plazas - (sociosCount ?? 0) - (invitadosCount ?? 0)
  }

  const fechaInicio = new Date(actividad.fecha_inicio + 'T00:00:00')
  const esSocioActivo = socio && ['activo', 'activo_exento', 'honorario'].includes(socio.estado)
  const inscritoActivo = inscripcion?.estado === 'inscrito' || inscripcion?.estado === 'pagado'

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/socio/actividades" className="text-sm text-blue-600 hover:text-blue-800">
        ← Actividades
      </Link>

      <div className="mt-4 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Cabecera */}
        <div className="bg-blue-900 text-white px-6 py-8">
          <div className="flex items-center gap-4">
            <div className="text-center bg-white/10 rounded-lg px-4 py-3 min-w-[72px]">
              <p className="text-3xl font-bold leading-none">{fechaInicio.getDate()}</p>
              <p className="text-sm text-blue-200 uppercase mt-1">{MESES[fechaInicio.getMonth()]}</p>
              <p className="text-xs text-blue-300">{fechaInicio.getFullYear()}</p>
            </div>
            <div>
              <h1 className="text-xl font-bold">{actividad.titulo}</h1>
              {actividad.hora_inicio && (
                <p className="text-blue-200 text-sm mt-1">{actividad.hora_inicio.slice(0,5)} h</p>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Info rápida */}
          <div className="grid grid-cols-2 gap-4">
            {actividad.lugar && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Lugar</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">{actividad.lugar}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Precio</p>
              <p className="text-sm font-medium text-gray-900 mt-0.5">
                {actividad.precio === 0 ? 'Gratuita' : `${Number(actividad.precio).toFixed(2)} €`}
              </p>
            </div>
            {actividad.plazas && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Plazas disponibles</p>
                <p className={`text-sm font-medium mt-0.5 ${(plazasDisponibles ?? 0) <= 0 ? 'text-red-600' : 'text-gray-900'}`}>
                  {plazasDisponibles !== null && plazasDisponibles <= 0 ? 'Completo' : `${plazasDisponibles} de ${actividad.plazas}`}
                </p>
              </div>
            )}
            {actividad.fecha_fin && actividad.fecha_fin !== actividad.fecha_inicio && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Fecha fin</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">
                  {new Date(actividad.fecha_fin + 'T00:00:00').toLocaleDateString('es-ES')}
                  {actividad.hora_fin && ` · ${actividad.hora_fin.slice(0,5)} h`}
                </p>
              </div>
            )}
          </div>

          {/* Descripción */}
          {actividad.descripcion && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Descripción</p>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{actividad.descripcion}</p>
            </div>
          )}

          {/* Pago por transferencia */}
          {actividad.precio > 0 && inscritoActivo && inscripcion?.estado === 'inscrito' && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-amber-900 mb-1">Pago pendiente</p>
              <p className="text-sm text-amber-800">
                Realiza una transferencia indicando tu nombre y la actividad a la cuenta de ASPROJUMA.
                Una vez confirmado el pago, recibirás la confirmación definitiva.
              </p>
            </div>
          )}

          {/* Añadir al calendario */}
          <AddToCalendar
            titulo={actividad.titulo}
            descripcion={actividad.descripcion}
            lugar={actividad.lugar}
            fecha_inicio={actividad.fecha_inicio}
            hora_inicio={actividad.hora_inicio}
            fecha_fin={actividad.fecha_fin}
            hora_fin={actividad.hora_fin}
          />

          {/* Botón inscripción */}
          {esSocioActivo ? (
            <InscripcionBoton
              actividadId={actividad.id}
              inscrito={inscritoActivo}
              pagado={inscripcion?.estado === 'pagado'}
              sinPlazas={(plazasDisponibles !== null && plazasDisponibles <= 0 && !inscritoActivo)}
              plazasDisponibles={plazasDisponibles}
              precio={actividad.precio ?? 0}
              precioInvitado={actividad.precio_invitado ?? null}
              invitadosActuales={misInvitados ?? []}
            />
          ) : (
            <p className="text-sm text-gray-500 text-center">
              Solo socios activos pueden inscribirse en actividades.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
