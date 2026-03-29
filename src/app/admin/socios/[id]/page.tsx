import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Socio, SocioProfesor, EstadoSocio } from '@/lib/types'
import { InvitarSocio } from './InvitarSocio'
import { EnviarCarnet } from './EnviarCarnet'
import { EliminarSocio } from './EliminarSocio'

const BADGE: Record<EstadoSocio, string> = {
  activo: 'bg-green-100 text-green-800',
  activo_exento: 'bg-teal-100 text-teal-800',
  baja: 'bg-orange-100 text-orange-800',
  fallecido: 'bg-gray-200 text-gray-600',
  honorario: 'bg-purple-100 text-purple-800',
  pendiente: 'bg-yellow-100 text-yellow-800',
  suspendido: 'bg-red-100 text-red-800',
}

const ESTADO_LABEL: Record<EstadoSocio, string> = {
  activo: 'Activo',
  activo_exento: 'Exento (>85 años)',
  baja: 'Baja',
  fallecido: 'Fallecido',
  honorario: 'Honorario',
  pendiente: 'Pendiente',
  suspendido: 'Suspendido',
}

function Campo({ label, valor }: { label: string; valor?: string | number | null }) {
  return (
    <div>
      <dt className="text-xs text-gray-500 uppercase tracking-wide">{label}</dt>
      <dd className="mt-0.5 text-sm text-gray-900 font-medium">{valor ?? <span className="text-gray-400 font-normal">—</span>}</dd>
    </div>
  )
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">{titulo}</h2>
      <dl className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {children}
      </dl>
    </section>
  )
}

export default async function SocioDetallePage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: socio } = await supabase
    .from('socios')
    .select('*, socios_profesores(centro, departamento, area_conocimiento, fecha_jubilacion, categoria)')
    .eq('id', params.id)
    .single()

  if (!socio) notFound()

  const s = socio as Socio

  const numIdentificador = s.tipo === 'profesor'
    ? `Nº ${s.num_socio}`
    : `Cooperante Nº ${s.num_cooperante}`

  return (
    <div>
      {/* Cabecera */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link href="/admin/socios" className="text-sm text-blue-600 hover:text-blue-800 mb-2 inline-block">
            ← Volver al listado
          </Link>
          <Link
            href={`/admin/socios/${s.id}/editar`}
            className="ml-4 text-sm text-blue-600 hover:text-blue-800 mb-2 inline-block"
          >
            ✏ Editar
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {s.apellidos}, {s.nombre}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm text-gray-500">{numIdentificador}</span>
            <span className="text-gray-300">·</span>
            <span className="text-sm text-gray-500 capitalize">{s.tipo}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${BADGE[s.estado]}`}>
              {ESTADO_LABEL[s.estado]}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Datos personales */}
        <Seccion titulo="Datos personales">
          <Campo label="DNI / NIF" valor={s.dni} />
          <Campo label="Fecha de nacimiento" valor={s.fecha_nacimiento} />
          <Campo label="Fecha de ingreso" valor={s.fecha_ingreso} />
          {s.fecha_baja && <Campo label="Fecha de baja" valor={s.fecha_baja} />}
        </Seccion>

        {/* Contacto */}
        <Seccion titulo="Contacto">
          <Campo label="Email principal" valor={s.email_principal} />
          <Campo label="Email UMA" valor={s.email_uma} />
          <Campo label="Otros emails" valor={s.email_otros} />
          <Campo label="Teléfono móvil" valor={s.tel_movil} />
          <Campo label="Teléfono fijo" valor={s.tel_fijo} />
        </Seccion>

        {/* Dirección */}
        <Seccion titulo="Dirección">
          <Campo label="Dirección" valor={s.direccion} />
          <Campo label="Código postal" valor={s.codigo_postal} />
          <Campo label="Localidad" valor={s.localidad} />
          <Campo label="Provincia" valor={s.provincia} />
        </Seccion>

        {/* Datos académicos (solo profesores) */}
        {s.tipo === 'profesor' && (socio as unknown as { socios_profesores: SocioProfesor }).socios_profesores && (
          <Seccion titulo="Datos académicos">
            {(() => {
              const p = (socio as unknown as { socios_profesores: SocioProfesor }).socios_profesores
              return <>
                <Campo label="Centro / Facultad" valor={p.centro} />
                <Campo label="Departamento" valor={p.departamento} />
                <Campo label="Área de conocimiento" valor={p.area_conocimiento} />
                <Campo label="Fecha jubilación" valor={p.fecha_jubilacion} />
                <Campo label="Categoría" valor={p.categoria} />
              </>
            })()}
          </Seccion>
        )}

        {/* Bancarios */}
        <Seccion titulo="Domiciliación bancaria">
          <Campo label="IBAN" valor={s.iban} />
          <Campo label="Titular cuenta" valor={s.titular_cuenta} />
        </Seccion>

        {/* Notas */}
        {s.notas && (
          <section className="bg-yellow-50 rounded-xl border border-yellow-200 p-6">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Notas</h2>
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{s.notas}</p>
          </section>
        )}

        {/* Enviar acceso */}
        {['activo', 'activo_exento'].includes(s.estado) && s.email_principal && (
          <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-1">Acceso al portal</h2>
            <p className="text-xs text-gray-500 mb-2">
              Envía un email de invitación para que el socio establezca su contraseña y acceda al área privada.
            </p>
            <InvitarSocio socioId={s.id} email={s.email_principal} />
            <EnviarCarnet socioId={s.id} email={s.email_principal} />
          </section>
        )}

        {/* Metadatos + Eliminar */}
        <section className="text-xs text-gray-400 flex gap-4 items-start justify-between">
          <div className="flex gap-4">
            <span>Creado: {new Date(s.created_at).toLocaleDateString('es-ES')}</span>
            <span>Actualizado: {new Date(s.updated_at).toLocaleDateString('es-ES')}</span>
            {s.migrado_excel && <span className="text-orange-400">Migrado desde Excel</span>}
          </div>
          <EliminarSocio socioId={s.id} nombre={`${s.apellidos}, ${s.nombre}`} />
        </section>
      </div>
    </div>
  )
}
