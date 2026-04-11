import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'

export default async function SolicitudesAdminPage() {
  const admin = createAdminClient()

  const { data: solicitudes } = await admin
    .from('socios')
    .select('id, tipo, nombre, apellidos, email_principal, created_at, notas')
    .eq('estado', 'pendiente')
    .order('created_at', { ascending: true })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Solicitudes de alta</h1>
        <span className="bg-yellow-100 text-yellow-800 text-sm font-medium px-3 py-1 rounded-full">
          {solicitudes?.length ?? 0} pendientes
        </span>
      </div>

      {!solicitudes?.length ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center text-gray-400">
          No hay solicitudes pendientes
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Solicitante</th>
                <th className="px-4 py-3 text-left">Tipo</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Fecha solicitud</th>
                <th className="px-4 py-3 text-left">Avalistas</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {solicitudes.map(s => {
                const avalistas = s.notas?.match(/AVALISTAS: (.+)/)
                const avalistasTexto = avalistas ? avalistas[1] : null
                return (
                  <tr key={s.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {s.apellidos}, {s.nombre}
                    </td>
                    <td className="px-4 py-3 text-gray-500 capitalize">{s.tipo}</td>
                    <td className="px-4 py-3 text-gray-500">{s.email_principal ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(s.created_at).toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {avalistasTexto ?? (s.tipo === 'cooperante' ? '⚠ Sin avalistas' : '—')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/solicitudes/${s.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Revisar →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
