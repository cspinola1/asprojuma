import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { BotonesAccion } from './SolicitudAcciones'

function Campo({ label, valor }: { label: string; valor?: string | null }) {
  return (
    <div>
      <dt className="text-xs text-gray-500 uppercase tracking-wide">{label}</dt>
      <dd className="mt-0.5 text-sm text-gray-900 font-medium">{valor || <span className="text-gray-400 font-normal">—</span>}</dd>
    </div>
  )
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">{titulo}</h2>
      <dl className="grid grid-cols-2 md:grid-cols-3 gap-4">{children}</dl>
    </section>
  )
}

export default async function SolicitudDetallePage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: socio } = await supabase
    .from('socios')
    .select('*')
    .eq('id', params.id)
    .eq('estado', 'pendiente')
    .single()

  if (!socio) notFound()

  // Datos específicos según tipo
  const { data: datosProfesor } = socio.tipo === 'profesor'
    ? await supabase.from('socios_profesores').select('*').eq('socio_id', socio.id).single()
    : { data: null }

  const { data: datosCooperante } = socio.tipo === 'cooperante'
    ? await supabase.from('socios_cooperantes').select('*').eq('socio_id', socio.id).single()
    : { data: null }

  // Extraer avalistas de notas (cooperante)
  const avalistasMatch = socio.notas?.match(/AVALISTAS: (.+)/)
  const [avalista1, avalista2] = avalistasMatch
    ? avalistasMatch[1].split(' | ')
    : [null, null]

  // Número que se asignará si se aprueba
  const { data: maxProf } = await supabase
    .from('socios').select('num_socio').eq('tipo', 'profesor')
    .not('num_socio', 'is', null).order('num_socio', { ascending: false }).limit(1).single()
  const { data: maxCoop } = await supabase
    .from('socios').select('num_cooperante').eq('tipo', 'cooperante')
    .not('num_cooperante', 'is', null).order('num_cooperante', { ascending: false }).limit(1).single()

  const numAsignar = socio.tipo === 'profesor'
    ? `Nº ${(maxProf?.num_socio ?? 146) + 1}`
    : `Cooperante Nº ${(maxCoop?.num_cooperante ?? 54) + 1}`

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/solicitudes" className="text-sm text-blue-600 hover:text-blue-800">
          ← Volver a solicitudes
        </Link>
        <div className="flex items-center gap-3 mt-2">
          <h1 className="text-2xl font-bold text-gray-900">{socio.apellidos}, {socio.nombre}</h1>
          <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-0.5 rounded-full capitalize">
            Pendiente · {socio.tipo}
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Solicitud recibida el {new Date(socio.created_at).toLocaleDateString('es-ES')}
          {' '}· Si se aprueba se asignará: <strong>{numAsignar}</strong>
        </p>
      </div>

      <div className="space-y-4 mb-8">
        <Seccion titulo="Datos personales">
          <Campo label="Nombre" valor={socio.nombre} />
          <Campo label="Apellidos" valor={socio.apellidos} />
          <Campo label="DNI / NIF" valor={socio.dni} />
          <Campo label="Fecha nacimiento" valor={socio.fecha_nacimiento} />
        </Seccion>

        {datosProfesor && (
          <Seccion titulo="Datos académicos">
            <Campo label="Centro / Facultad" valor={datosProfesor.centro} />
            <Campo label="Departamento" valor={datosProfesor.departamento} />
            <Campo label="Área de conocimiento" valor={datosProfesor.area_conocimiento} />
            <Campo label="Fecha jubilación" valor={datosProfesor.fecha_jubilacion} />
            <Campo label="Categoría" valor={datosProfesor.categoria} />
          </Seccion>
        )}

        {datosCooperante && (
          <Seccion titulo="Relación con la UMA">
            <div className="col-span-3">
              <Campo label="Relación" valor={datosCooperante.descripcion_relacion} />
            </div>
            <div className="col-span-3">
              <Campo label="Estudios" valor={datosCooperante.estudios} />
            </div>
            <div className="col-span-3">
              <Campo label="Aficiones" valor={datosCooperante.aficiones} />
            </div>
          </Seccion>
        )}

        <Seccion titulo="Contacto">
          <Campo label="Email principal" valor={socio.email_principal} />
          <Campo label="Email UMA" valor={socio.email_uma} />
          <Campo label="Teléfono móvil" valor={socio.tel_movil} />
          <Campo label="Teléfono fijo" valor={socio.tel_fijo} />
        </Seccion>

        <Seccion titulo="Dirección">
          <div className="col-span-2"><Campo label="Dirección" valor={socio.direccion} /></div>
          <Campo label="Código postal" valor={socio.codigo_postal} />
          <Campo label="Localidad" valor={socio.localidad} />
          <Campo label="Provincia" valor={socio.provincia} />
        </Seccion>

        <Seccion titulo="Domiciliación bancaria">
          <Campo label="IBAN" valor={socio.iban} />
          <Campo label="Titular" valor={socio.titular_cuenta} />
        </Seccion>

        {socio.tipo === 'cooperante' && (
          <section className="bg-blue-50 rounded-xl border border-blue-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-blue-900 uppercase tracking-wide mb-4">Avalistas</h2>
            <dl className="grid grid-cols-2 gap-4">
              <Campo label="Primer avalista" valor={avalista1} />
              <Campo label="Segundo avalista" valor={avalista2} />
            </dl>
          </section>
        )}
      </div>

      {/* Acciones */}
      <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Decisión</h2>
        <BotonesAccion id={socio.id} tipo={socio.tipo} />
      </section>
    </div>
  )
}
