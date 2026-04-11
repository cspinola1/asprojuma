import { createAdminClient } from '@/lib/supabase/admin'

export default async function VerificarPage({ params }: { params: { id: string } }) {
  const admin = createAdminClient()

  const { data: socio } = await admin
    .from('socios')
    .select('nombre, apellidos, tipo, num_socio, num_cooperante, estado, fecha_ingreso')
    .eq('id', params.id)
    .single()

  if (!socio || socio.estado !== 'activo') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow p-8 max-w-sm w-full text-center">
          <div className="text-4xl mb-4">❌</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Socio no encontrado</h1>
          <p className="text-gray-500 text-sm">Este carnet no corresponde a un socio activo de ASPROJUMA.</p>
        </div>
      </div>
    )
  }

  const tipoLabel = socio.tipo === 'profesor' ? 'Socio Profesor Jubilado' : 'Socio Miembro Cooperante'
  const num = socio.tipo === 'profesor' ? socio.num_socio : socio.num_cooperante

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow p-8 max-w-sm w-full text-center">
        <div className="text-5xl mb-4">✅</div>
        <h1 className="text-xl font-bold text-gray-900 mb-1">Socio verificado</h1>
        <p className="text-gray-500 text-sm mb-6">Miembro activo de ASPROJUMA</p>

        <div className="bg-blue-50 rounded-lg p-4 text-left space-y-2">
          <div>
            <span className="text-xs text-gray-500 uppercase tracking-wide">Nombre</span>
            <p className="font-semibold text-gray-900">{socio.nombre} {socio.apellidos}</p>
          </div>
          <div>
            <span className="text-xs text-gray-500 uppercase tracking-wide">Categoría</span>
            <p className="font-semibold text-gray-900">{tipoLabel} Nº {num}</p>
          </div>
          {socio.fecha_ingreso && (
            <div>
              <span className="text-xs text-gray-500 uppercase tracking-wide">Miembro desde</span>
              <p className="font-semibold text-gray-900">
                {new Date(socio.fecha_ingreso).toLocaleDateString('es-ES', { year: 'numeric', month: 'long' })}
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            ASPROJUMA · Asociación de Profesores Jubilados<br />
            de la Universidad de Málaga
          </p>
        </div>
      </div>
    </div>
  )
}
