import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Cuota, EstadoCuota } from '@/lib/types'
import { AccionEstado, AccionEliminar } from './CuotasAcciones'

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

interface Props {
  searchParams: { anio?: string; semestre?: string; estado?: string; q?: string }
}

type CuotaConSocio = Cuota & {
  socios: {
    nombre: string; apellidos: string
    num_socio: number | null; num_cooperante: number | null
    tipo: string; iban: string | null
  }
}

export default async function CuotasAdminPage({ searchParams }: Props) {
  const supabase = await createClient()
  const anioActual = new Date().getFullYear()

  const { data: ultimoAnio } = await supabase
    .from('cuotas')
    .select('anio')
    .order('anio', { ascending: false })
    .limit(1)
    .single()

  const anioDefault = ultimoAnio?.anio ?? anioActual
  const anioFiltro = searchParams.anio ? parseInt(searchParams.anio) : anioDefault

  let query = supabase
    .from('cuotas')
    .select(`*, socios (nombre, apellidos, num_socio, num_cooperante, tipo, iban)`)
    .eq('anio', anioFiltro)
    .order('anio', { ascending: false })
    .order('semestre', { ascending: false })

  if (searchParams.semestre) query = query.eq('semestre', parseInt(searchParams.semestre))
  if (searchParams.estado)   query = query.eq('estado', searchParams.estado as EstadoCuota)

  const { data: rawCuotas } = await query.limit(300)

  // Búsqueda por nombre/número en JS (dataset pequeño)
  const q = searchParams.q?.trim().toLowerCase() ?? ''
  const cuotas = q
    ? (rawCuotas as CuotaConSocio[])?.filter(c =>
        c.socios.apellidos?.toLowerCase().includes(q) ||
        c.socios.nombre?.toLowerCase().includes(q) ||
        String(c.socios.num_socio ?? '').includes(q) ||
        String(c.socios.num_cooperante ?? '').includes(q)
      )
    : rawCuotas as CuotaConSocio[]

  const { data: anios } = await supabase
    .from('cuotas').select('anio').order('anio', { ascending: false })
  const aniosUnicos = [...new Set((anios ?? []).map(r => r.anio))]

  const { data: statsData } = await supabase
    .from('cuotas').select('estado, importe').eq('anio', anioFiltro)

  const stats = {
    cobrado:      (statsData ?? []).filter(r => r.estado === 'cobrado').length,
    pendiente:    (statsData ?? []).filter(r => r.estado === 'pendiente').length,
    devuelto:     (statsData ?? []).filter(r => r.estado === 'devuelto').length,
    exento:       (statsData ?? []).filter(r => r.estado === 'exento').length,
    totalCobrado: (statsData ?? []).filter(r => r.estado === 'cobrado')
      .reduce((s, r) => s + Number(r.importe), 0),
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Cuotas</h1>
        <Link href="/admin/cuotas/nueva"
          className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition">
          + Nueva cuota
        </Link>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Cobradas',     valor: stats.cobrado,                       color: 'text-green-700',  bg: 'bg-green-50'  },
          { label: 'Pendientes',   valor: stats.pendiente,                     color: 'text-yellow-700', bg: 'bg-yellow-50' },
          { label: 'Devueltas',    valor: stats.devuelto,                      color: 'text-red-600',    bg: 'bg-red-50'    },
          { label: 'Exentas',      valor: stats.exento,                        color: 'text-gray-600',   bg: 'bg-gray-100'  },
          { label: 'Total cobrado',valor: `${stats.totalCobrado.toFixed(2)} €`,color: 'text-blue-700',   bg: 'bg-blue-50'   },
        ].map(t => (
          <div key={t.label} className={`${t.bg} rounded-xl p-3 text-center`}>
            <div className={`text-xl font-bold ${t.color}`}>{t.valor}</div>
            <div className="text-xs text-gray-500 mt-0.5">{t.label}</div>
          </div>
        ))}
      </div>

      {/* Filtros + búsqueda */}
      <form method="GET" className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          name="q"
          defaultValue={searchParams.q ?? ''}
          placeholder="Buscar por nombre o nº de socio…"
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-64 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select name="anio" defaultValue={searchParams.anio ?? anioDefault.toString()}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
          {aniosUnicos.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select name="semestre" defaultValue={searchParams.semestre ?? ''}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Ambos semestres</option>
          <option value="1">1º semestre</option>
          <option value="2">2º semestre</option>
        </select>
        <select name="estado" defaultValue={searchParams.estado ?? ''}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Todos los estados</option>
          <option value="cobrado">Cobrado</option>
          <option value="pendiente">Pendiente</option>
          <option value="devuelto">Devuelto</option>
          <option value="exento">Exento</option>
        </select>
        <button type="submit"
          className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-800 transition">
          Buscar
        </button>
        {(searchParams.q || searchParams.semestre || searchParams.estado) && (
          <Link href={`/admin/cuotas?anio=${anioFiltro}`}
            className="px-4 py-2 rounded-lg text-sm border border-gray-300 hover:bg-gray-50 transition">
            Limpiar
          </Link>
        )}
      </form>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
          <span className="text-sm text-gray-600">{cuotas?.length ?? 0} registros</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Nº</th>
                <th className="px-4 py-3 text-left">Socio</th>
                <th className="px-4 py-3 text-left">IBAN</th>
                <th className="px-4 py-3 text-left">Periodo</th>
                <th className="px-4 py-3 text-left">Importe</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3 text-left">Fecha cobro</th>
                <th className="px-4 py-3 text-left">Método</th>
                <th className="px-4 py-3 text-left">Acciones</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {!cuotas?.length && (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-gray-400">
                    No hay cuotas con los filtros seleccionados
                  </td>
                </tr>
              )}
              {cuotas?.map((c: CuotaConSocio) => {
                const num = c.socios.tipo === 'profesor'
                  ? c.socios.num_socio
                  : `C${c.socios.num_cooperante}`
                return (
                  <tr key={c.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-mono text-gray-500 text-xs whitespace-nowrap">{num}</td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/socios/${c.socio_id}`} className="font-medium text-gray-900 hover:text-blue-700">
                        {c.socios.apellidos}, {c.socios.nombre}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500 whitespace-nowrap">
                      {c.socios.iban ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{c.anio} · {c.semestre}º sem.</td>
                    <td className="px-4 py-3 font-mono text-gray-700 whitespace-nowrap">{Number(c.importe).toFixed(2)} €</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${BADGE[c.estado]}`}>
                        {ESTADO_LABEL[c.estado]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {c.fecha_cobro ? new Date(c.fecha_cobro).toLocaleDateString('es-ES') : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs capitalize whitespace-nowrap">
                      {c.metodo_pago?.replace('_', ' ')}
                    </td>
                    <td className="px-4 py-3">
                      <AccionEstado id={c.id} estadoActual={c.estado} />
                    </td>
                    <td className="px-4 py-3">
                      <AccionEliminar id={c.id} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
