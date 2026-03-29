import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Socio, SocioProfesor } from '@/lib/types'
import EditarSocioForm from './EditarSocioForm'

export default async function EditarSocioPage({ params }: { params: { id: string } }) {
  const admin = createAdminClient()

  const { data: socio } = await admin
    .from('socios')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!socio) notFound()

  const { data: profesor } = socio.tipo === 'profesor'
    ? await admin.from('socios_profesores').select('*').eq('socio_id', socio.id).single()
    : { data: null }

  return (
    <div>
      <div className="mb-6">
        <Link href={`/admin/socios/${socio.id}`} className="text-sm text-blue-600 hover:text-blue-800">
          ← Volver a la ficha
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">
          Editar: {socio.apellidos}, {socio.nombre}
        </h1>
      </div>
      <EditarSocioForm socio={socio as Socio} profesor={profesor as SocioProfesor | null} />
    </div>
  )
}
