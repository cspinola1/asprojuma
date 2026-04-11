import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { ActividadForm } from '../ActividadForm'
import { InscripcionesAdmin } from './InscripcionesAdmin'

export default async function EditarActividadPage({ params }: { params: { id: string } }) {
  const admin = createAdminClient()

  const { data: actividad } = await admin
    .from('actividades')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!actividad) notFound()

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/actividades" className="text-sm text-blue-600 hover:text-blue-800">← Actividades</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">{actividad.titulo}</h1>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div>
          <ActividadForm
            modo="editar"
            inicial={{
              id: actividad.id,
              titulo: actividad.titulo,
              descripcion: actividad.descripcion ?? '',
              fecha_inicio: actividad.fecha_inicio,
              hora_inicio: actividad.hora_inicio ?? '',
              fecha_fin: actividad.fecha_fin ?? '',
              hora_fin: actividad.hora_fin ?? '',
              lugar: actividad.lugar ?? '',
              precio: String(actividad.precio ?? 0),
              precio_invitado: actividad.precio_invitado != null ? String(actividad.precio_invitado) : '',
              plazas: actividad.plazas ? String(actividad.plazas) : '',
              estado: actividad.estado,
            }}
          />
        </div>
        <div>
          <InscripcionesAdmin actividadId={actividad.id} precio={actividad.precio ?? 0} precioInvitado={actividad.precio_invitado ?? null} />
        </div>
      </div>
    </div>
  )
}
