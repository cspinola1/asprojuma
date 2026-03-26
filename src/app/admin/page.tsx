import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

async function getStats(supabase: Awaited<ReturnType<typeof createClient>>) {
  const [profesores, cooperantes] = await Promise.all([
    supabase.from('socios').select('estado').eq('tipo', 'profesor'),
    supabase.from('socios').select('estado').eq('tipo', 'cooperante'),
  ])

  const contar = (rows: { estado: string }[] | null, estado: string) =>
    (rows ?? []).filter(r => r.estado === estado).length

  const profActivos = contar(profesores.data, 'activo') + contar(profesores.data, 'activo_exento')
  const profBajas = contar(profesores.data, 'baja')
  const profFallecidos = contar(profesores.data, 'fallecido')

  const coopActivos = contar(cooperantes.data, 'activo')
  const coopBajas = contar(cooperantes.data, 'baja')
  const coopFallecidos = contar(cooperantes.data, 'fallecido')

  const pendientes = contar(profesores.data, 'pendiente') + contar(cooperantes.data, 'pendiente')

  return { profActivos, profBajas, profFallecidos, coopActivos, coopBajas, coopFallecidos, pendientes }
}

export default async function AdminPage() {
  const supabase = await createClient()
  const stats = await getStats(supabase)

  const tarjetas = [
    { label: 'Socios profesores activos', valor: stats.profActivos, color: 'text-blue-700', bg: 'bg-blue-50', href: '/admin/socios?tipo=profesor&estado=activo' },
    { label: 'Miembros cooperantes activos', valor: stats.coopActivos, color: 'text-green-700', bg: 'bg-green-50', href: '/admin/socios?tipo=cooperante&estado=activo' },
    { label: 'Bajas (profesores)', valor: stats.profBajas, color: 'text-orange-600', bg: 'bg-orange-50', href: '/admin/socios?tipo=profesor&estado=baja' },
    { label: 'Bajas (cooperantes)', valor: stats.coopBajas, color: 'text-orange-600', bg: 'bg-orange-50', href: '/admin/socios?tipo=cooperante&estado=baja' },
    { label: 'Fallecidos', valor: stats.profFallecidos + stats.coopFallecidos, color: 'text-gray-500', bg: 'bg-gray-100', href: '/admin/socios?estado=fallecido' },
    { label: 'Solicitudes pendientes', valor: stats.pendientes, color: 'text-red-600', bg: 'bg-red-50', href: '/admin/socios?estado=pendiente' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Panel de administración</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
        {tarjetas.map((t) => (
          <Link key={t.label} href={t.href} className={`${t.bg} rounded-xl p-5 hover:shadow-md transition`}>
            <div className={`text-4xl font-bold ${t.color} mb-1`}>{t.valor}</div>
            <div className="text-sm text-gray-600">{t.label}</div>
          </Link>
        ))}
      </div>

      <div className="flex gap-4">
        <Link
          href="/admin/socios"
          className="bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-800 transition"
        >
          Ver todos los socios →
        </Link>
      </div>
    </div>
  )
}
