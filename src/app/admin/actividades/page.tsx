'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CalendarioActividades, ActividadCal } from '@/components/CalendarioActividades'

interface Actividad extends ActividadCal {
  estado: 'borrador' | 'publicada' | 'cancelada'
  actividades_inscripciones: { count: number }[]
}

const ESTADO_BADGE: Record<string, string> = {
  publicada: 'bg-green-100 text-green-800',
  borrador:  'bg-gray-100 text-gray-600',
  cancelada: 'bg-red-100 text-red-700',
}

export default function ActividadesAdminPage() {
  const [actividades, setActividades] = useState<Actividad[]>([])
  const [cargando, setCargando] = useState(true)
  const [vista, setVista] = useState<'calendario' | 'lista'>('calendario')

  useEffect(() => {
    fetch('/api/admin/actividades')
      .then(r => r.json())
      .then(d => { setActividades(d); setCargando(false) })
  }, [])

  if (cargando) return <div className="text-sm text-gray-500 p-8">Cargando…</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Actividades</h1>
          <p className="text-sm text-gray-500 mt-1">{actividades.length} actividades</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Toggle vista */}
          <div className="flex border border-gray-200 rounded-lg overflow-hidden text-sm">
            <button
              onClick={() => setVista('calendario')}
              className={`px-3 py-1.5 font-medium transition ${vista === 'calendario' ? 'bg-blue-700 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              Calendario
            </button>
            <button
              onClick={() => setVista('lista')}
              className={`px-3 py-1.5 font-medium transition ${vista === 'lista' ? 'bg-blue-700 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              Lista
            </button>
          </div>
          <Link
            href="/admin/actividades/nueva"
            className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition"
          >
            + Nueva actividad
          </Link>
        </div>
      </div>

      {vista === 'calendario' ? (
        <CalendarioActividades actividades={actividades} modo="admin" />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {actividades.length === 0 ? (
            <p className="text-sm text-gray-400 p-8 text-center">No hay actividades. Crea la primera.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">Actividad</th>
                  <th className="px-4 py-3 text-left">Fecha</th>
                  <th className="px-4 py-3 text-left">Lugar</th>
                  <th className="px-4 py-3 text-right">Precio</th>
                  <th className="px-4 py-3 text-center">Inscritos</th>
                  <th className="px-4 py-3 text-left">Estado</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {actividades.map(a => {
                  const inscritos = a.actividades_inscripciones?.[0]?.count ?? 0
                  return (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{a.titulo}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {new Date(a.fecha_inicio + 'T00:00:00').toLocaleDateString('es-ES')}
                        {a.hora_inicio && <span className="text-gray-400"> · {a.hora_inicio.slice(0, 5)}</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{a.lugar ?? '—'}</td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {a.precio === 0 ? <span className="text-green-700">Gratis</span> : `${Number(a.precio).toFixed(2)} €`}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={inscritos > 0 ? 'font-medium text-blue-700' : 'text-gray-400'}>
                          {inscritos}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ESTADO_BADGE[a.estado]}`}>
                          {a.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/admin/actividades/${a.id}`} className="text-blue-600 hover:text-blue-800 text-xs font-medium">
                          Editar
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
