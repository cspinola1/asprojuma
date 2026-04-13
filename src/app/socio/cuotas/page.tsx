import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Cuota, EstadoCuota } from '@/lib/types'

const BADGE: Record<EstadoCuota, string> = {
  cobrado: 'bg-green-100 text-green-800',
  pendiente: 'bg-yellow-100 text-yellow-800',
  devuelto: 'bg-red-100 text-red-800',
  exento: 'bg-gray-100 text-gray-600',
}

const ESTADO_LABEL: Record<EstadoCuota, string> = {
  cobrado: 'Cobrado',
  pendiente: 'Pendiente',
  devuelto: 'Devuelto',
  exento: 'Exento',
}

const METODO_LABEL: Record<string, string> = {
  domiciliacion: 'Domiciliación bancaria',
  transferencia: 'Transferencia',
  efectivo: 'Efectivo',
}

export default async function CuotasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: socios } = await admin
    .from('socios')
    .select('id, nombre, apellidos, tipo, estado')
    .or(`email_uma.ilike.${user.email},email_otros.ilike.${user.email}`)
    .order('id', { ascending: true })
    .limit(1)
  const socio = socios?.[0] ?? null

  if (!socio) redirect('/socio')

  const { data: cuotas } = await admin
    .from('cuotas')
    .select('*')
    .eq('socio_id', socio.id)
    .order('anio', { ascending: false })
    .order('semestre', { ascending: false })

  const anioActual = new Date().getFullYear()
  const cuotasActual = (cuotas ?? []).filter((c: Cuota) => c.anio === anioActual)
  const cuotasAnteriores = (cuotas ?? []).filter((c: Cuota) => c.anio < anioActual)

  const totalCobrado = (cuotas ?? [])
    .filter((c: Cuota) => c.estado === 'cobrado')
    .reduce((sum: number, c: Cuota) => sum + Number(c.importe), 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/socio" className="text-sm text-blue-600 hover:text-blue-800">
            ← Área del socio
          </Link>
          <form action="/api/auth/logout" method="POST">
            <button className="text-sm text-gray-500 hover:text-red-600">Cerrar sesión</button>
          </form>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Mis cuotas</h1>

        {!cuotas?.length ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center text-gray-500">
            <p>No hay cuotas registradas para tu cuenta.</p>
            <p className="text-xs mt-1">Contacta con <a href="mailto:asprojuma@uma.es" className="underline text-blue-600">asprojuma@uma.es</a> si crees que es un error.</p>
          </div>
        ) : (
          <div className="space-y-6">

            {/* Resumen */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
                <div className="text-2xl font-bold text-blue-700">{cuotas?.length ?? 0}</div>
                <div className="text-xs text-gray-500 mt-1">Recibos totales</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
                <div className="text-2xl font-bold text-green-700">{totalCobrado.toFixed(2)} €</div>
                <div className="text-xs text-gray-500 mt-1">Total pagado</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center col-span-2 sm:col-span-1">
                <div className="text-2xl font-bold text-gray-700">
                  {(cuotas ?? []).filter((c: Cuota) => c.estado === 'pendiente').length > 0
                    ? <span className="text-yellow-600">{(cuotas ?? []).filter((c: Cuota) => c.estado === 'pendiente').length} pendiente(s)</span>
                    : <span className="text-green-600">Al corriente</span>
                  }
                </div>
                <div className="text-xs text-gray-500 mt-1">Estado actual</div>
              </div>
            </div>

            {/* Año actual */}
            {cuotasActual.length > 0 && (
              <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-3 bg-blue-50 border-b border-blue-100">
                  <h2 className="text-sm font-semibold text-blue-900">Año {anioActual}</h2>
                </div>
                <CuotasTabla cuotas={cuotasActual} />
              </section>
            )}

            {/* Años anteriores */}
            {cuotasAnteriores.length > 0 && (
              <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                  <h2 className="text-sm font-semibold text-gray-700">Historial anterior</h2>
                </div>
                <CuotasTabla cuotas={cuotasAnteriores} />
              </section>
            )}

          </div>
        )}
      </main>
    </div>
  )
}

function CuotasTabla({ cuotas }: { cuotas: Cuota[] }) {
  return (
    <table className="w-full text-sm">
      <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
        <tr>
          <th className="px-5 py-3 text-left">Periodo</th>
          <th className="px-5 py-3 text-left">Importe</th>
          <th className="px-5 py-3 text-left">Estado</th>
          <th className="px-5 py-3 text-left">Fecha cobro</th>
          <th className="px-5 py-3 text-left">Método</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {cuotas.map((c) => (
          <tr key={c.id} className="hover:bg-gray-50 transition">
            <td className="px-5 py-3 font-medium text-gray-900">
              {c.anio} · {c.semestre}º semestre
            </td>
            <td className="px-5 py-3 font-mono text-gray-700">
              {Number(c.importe).toFixed(2)} €
            </td>
            <td className="px-5 py-3">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${BADGE[c.estado]}`}>
                {ESTADO_LABEL[c.estado]}
              </span>
            </td>
            <td className="px-5 py-3 text-gray-500">
              {c.fecha_cobro
                ? new Date(c.fecha_cobro).toLocaleDateString('es-ES')
                : '—'}
            </td>
            <td className="px-5 py-3 text-gray-500">
              {METODO_LABEL[c.metodo_pago] ?? c.metodo_pago}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
