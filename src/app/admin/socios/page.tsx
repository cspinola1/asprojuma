import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { TipoSocio, EstadoSocio } from '@/lib/types'

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
  activo_exento: 'Exento',
  baja: 'Baja',
  fallecido: 'Fallecido',
  honorario: 'Honorario',
  pendiente: 'Pendiente',
  suspendido: 'Suspendido',
}

type SortCol = 'num' | 'apellidos' | 'tipo' | 'estado' | 'centro'
type SortDir = 'asc' | 'desc'

const SORT_DB_COL: Record<SortCol, string> = {
  num: 'num_socio',
  apellidos: 'apellidos',
  tipo: 'tipo',
  estado: 'estado',
  centro: 'centro',
}

interface Props {
  searchParams: { q?: string; tipo?: string; estado?: string; sort?: string; dir?: string }
}

function SortLink({
  col, label, current, dir, searchParams,
}: {
  col: SortCol; label: string; current: SortCol; dir: SortDir
  searchParams: Props['searchParams']
}) {
  const isActive = current === col
  const nextDir: SortDir = isActive && dir === 'asc' ? 'desc' : 'asc'
  const p = new URLSearchParams(searchParams as Record<string, string>)
  p.set('sort', col)
  p.set('dir', nextDir)
  return (
    <Link href={`/admin/socios?${p.toString()}`} className="flex items-center gap-1 hover:text-blue-700 transition select-none">
      {label}
      <span className="text-gray-400">
        {isActive ? (dir === 'asc' ? ' ▲' : ' ▼') : ' ⇅'}
      </span>
    </Link>
  )
}

export default async function SociosAdminPage({ searchParams }: Props) {
  const supabase = createAdminClient()

  const sortCol = (searchParams.sort as SortCol) ?? 'apellidos'
  const sortDir: SortDir = searchParams.dir === 'desc' ? 'desc' : 'asc'
  // Para "num" con tipos mixtos se reordena en JS; para tipo único se usa la columna correcta
  const dbCol = sortCol === 'num'
    ? (searchParams.tipo === 'cooperante' ? 'num_cooperante' : 'num_socio')
    : SORT_DB_COL[sortCol] ?? 'apellidos'

  let query = supabase
    .from('socios')
    .select('id, tipo, estado, num_socio, num_cooperante, apellidos, nombre, email_principal, fecha_ingreso, socios_profesores(centro)')
    .order(dbCol, { ascending: sortDir === 'asc' })

  // Ordenación secundaria por apellidos cuando no es la columna principal
  if (dbCol !== 'apellidos') {
    query = query.order('apellidos', { ascending: true })
  }

  if (searchParams.tipo === 'profesor' || searchParams.tipo === 'cooperante') {
    query = query.eq('tipo', searchParams.tipo as TipoSocio)
  }
  if (searchParams.estado) {
    query = query.eq('estado', searchParams.estado as EstadoSocio)
  }
  if (searchParams.q) {
    const q = searchParams.q.trim().slice(0, 100).replace(/[%_\\]/g, '\\$&')
    query = query.or(`apellidos.ilike.%${q}%,nombre.ilike.%${q}%,email_principal.ilike.%${q}%,dni.ilike.%${q}%`)
  }

  let { data: socios } = await query.limit(200)

  // Cuando se muestran tipos mixtos y se ordena por Nº, reordenar en JS
  if (sortCol === 'num' && !searchParams.tipo && socios) {
    socios = [...socios].sort((a, b) => {
      const na = (a.num_socio ?? a.num_cooperante ?? 9999) as number
      const nb = (b.num_socio ?? b.num_cooperante ?? 9999) as number
      return sortDir === 'asc' ? na - nb : nb - na
    })
  }

  const sortProps = { current: sortCol, dir: sortDir, searchParams }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Socios</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{socios?.length ?? 0} registros</span>
          <a
            href={`/api/admin/socios/exportar?q=${encodeURIComponent(searchParams.q ?? '')}&tipo=${encodeURIComponent(searchParams.tipo ?? '')}&estado=${encodeURIComponent(searchParams.estado ?? '')}`}
            className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-200 transition"
          >
            ↓ Exportar CSV
          </a>
        </div>
      </div>

      {/* Filtros */}
      <form method="GET" className="flex flex-wrap gap-3 mb-6">
        {/* Preservar ordenación al buscar */}
        {searchParams.sort && <input type="hidden" name="sort" value={searchParams.sort} />}
        {searchParams.dir && <input type="hidden" name="dir" value={searchParams.dir} />}
        <input
          type="text"
          name="q"
          defaultValue={searchParams.q ?? ''}
          placeholder="Buscar por nombre, email, DNI…"
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-64 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          name="tipo"
          defaultValue={searchParams.tipo ?? ''}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos los tipos</option>
          <option value="profesor">Profesores</option>
          <option value="cooperante">Cooperantes</option>
        </select>
        <select
          name="estado"
          defaultValue={searchParams.estado ?? ''}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos los estados</option>
          <option value="activo">Activo</option>
          <option value="activo_exento">Exento (&gt;85 años)</option>
          <option value="baja">Baja</option>
          <option value="fallecido">Fallecido</option>
          <option value="pendiente">Pendiente</option>
          <option value="honorario">Honorario</option>
        </select>
        <button
          type="submit"
          className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-800 transition"
        >
          Buscar
        </button>
        {(searchParams.q || searchParams.tipo || searchParams.estado) && (
          <Link href="/admin/socios" className="px-4 py-2 rounded-lg text-sm border border-gray-300 hover:bg-gray-50 transition">
            Limpiar
          </Link>
        )}
      </form>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 text-left">
                <SortLink col="num" label="Nº" {...sortProps} />
              </th>
              <th className="px-4 py-3 text-left">
                <SortLink col="apellidos" label="Apellidos, nombre" {...sortProps} />
              </th>
              <th className="px-4 py-3 text-left">
                <SortLink col="tipo" label="Tipo" {...sortProps} />
              </th>
              <th className="px-4 py-3 text-left">
                <SortLink col="estado" label="Estado" {...sortProps} />
              </th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">
                <SortLink col="centro" label="Centro" {...sortProps} />
              </th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {!socios?.length && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                  No se encontraron socios
                </td>
              </tr>
            )}
            {socios?.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3 font-mono text-gray-500">
                  {s.tipo === 'profesor' ? s.num_socio : `C${s.num_cooperante}`}
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">
                  {s.apellidos}, {s.nombre}
                </td>
                <td className="px-4 py-3 text-gray-500 capitalize">{s.tipo}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${BADGE[s.estado as EstadoSocio]}`}>
                    {ESTADO_LABEL[s.estado as EstadoSocio]}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{s.email_principal ?? '—'}</td>
                <td className="px-4 py-3 text-gray-500 truncate max-w-[160px]">{(s as { socios_profesores?: { centro?: string } }).socios_profesores?.centro ?? '—'}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/socios/${s.id}`}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Ver →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
