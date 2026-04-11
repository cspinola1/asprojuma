'use client'

import { useState } from 'react'
import Link from 'next/link'

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export interface ActividadCal {
  id: number
  titulo: string
  fecha_inicio: string
  hora_inicio: string | null
  precio: number
  lugar?: string | null
  descripcion?: string | null
  fecha_fin?: string | null
  hora_fin?: string | null
  estado?: string
}

interface Props {
  actividades: ActividadCal[]
  modo: 'admin' | 'socio'
  inscritasIds?: number[]
}

function toKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}


export function CalendarioActividades({ actividades, modo, inscritasIds = [] }: Props) {
  const hoy = new Date()
  const [mes, setMes] = useState(hoy.getMonth())
  const [anio, setAnio] = useState(hoy.getFullYear())
  const [popover, setPopover] = useState<{ fecha: string; acts: ActividadCal[] } | null>(null)

  function navMes(delta: number) {
    const d = new Date(anio, mes + delta, 1)
    setMes(d.getMonth())
    setAnio(d.getFullYear())
    setPopover(null)
  }

  // Build grid (Monday-first)
  const primerDia = new Date(anio, mes, 1)
  const ultimoDia = new Date(anio, mes + 1, 0)
  const offset = (primerDia.getDay() + 6) % 7

  const celdas: Date[] = []
  for (let i = offset; i > 0; i--) celdas.push(new Date(anio, mes, 1 - i))
  for (let i = 1; i <= ultimoDia.getDate(); i++) celdas.push(new Date(anio, mes, i))
  const restantes = (7 - (celdas.length % 7)) % 7
  for (let i = 1; i <= restantes; i++) celdas.push(new Date(anio, mes + 1, i))

  // Group by date
  const porDia = new Map<string, ActividadCal[]>()
  for (const a of actividades) {
    if (!porDia.has(a.fecha_inicio)) porDia.set(a.fecha_inicio, [])
    porDia.get(a.fecha_inicio)!.push(a)
  }

  const inscritasSet = new Set(inscritasIds)
  const hoyKey = toKey(hoy)
  const semanas: Date[][] = []
  for (let i = 0; i < celdas.length; i += 7) semanas.push(celdas.slice(i, i + 7))

  function colorActividad(a: ActividadCal, inscrita: boolean) {
    if (inscrita) return 'bg-blue-600 text-white'
    if (a.estado === 'borrador') return 'bg-gray-100 text-gray-500 border border-dashed border-gray-300'
    if (a.estado === 'cancelada') return 'bg-red-100 text-red-400 border border-red-200 line-through'
    if (a.precio > 0) return 'bg-orange-100 text-orange-800 border border-orange-200'
    return 'bg-green-100 text-green-800 border border-green-200'
  }

  return (
    <div className="relative">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header navigation */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <button
            onClick={() => navMes(-1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition text-gray-600 font-bold"
          >
            ‹
          </button>
          <div className="flex items-center gap-4">
            <h2 className="font-semibold text-gray-900 text-lg">
              {MESES[mes]} {anio}
            </h2>
            <button
              onClick={() => { setMes(hoy.getMonth()); setAnio(hoy.getFullYear()) }}
              className="text-xs text-blue-600 hover:text-blue-800 border border-blue-200 rounded px-2 py-0.5"
            >
              Hoy
            </button>
          </div>
          <button
            onClick={() => navMes(1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition text-gray-600 font-bold"
          >
            ›
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50">
          {DIAS.map(d => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div>
          {semanas.map((semana, si) => (
            <div key={si} className="grid grid-cols-7 border-b border-gray-50 last:border-0">
              {semana.map((dia, di) => {
                const key = toKey(dia)
                const esMesActual = dia.getMonth() === mes
                const esHoy = key === hoyKey
                const actsDelDia = porDia.get(key) ?? []

                return (
                  <div
                    key={di}
                    className={`min-h-[100px] p-1.5 border-r border-gray-50 last:border-r-0 transition
                      ${!esMesActual ? 'bg-gray-50/60' : ''}
                      ${modo === 'admin' && esMesActual ? 'cursor-pointer hover:bg-blue-50/40' : ''}
                    `}
                    onClick={() => {
                      if (!esMesActual) return
                      if (actsDelDia.length > 0) {
                        setPopover(popover?.fecha === key ? null : { fecha: key, acts: actsDelDia })
                      } else if (modo === 'admin') {
                        window.location.href = `/admin/actividades/nueva?fecha=${key}`
                      }
                    }}
                  >
                    {/* Day number */}
                    <div className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-1 select-none
                      ${esHoy ? 'bg-blue-700 text-white' : esMesActual ? 'text-gray-700' : 'text-gray-300'}
                    `}>
                      {dia.getDate()}
                    </div>

                    {/* Activities */}
                    <div className="space-y-0.5">
                      {actsDelDia.slice(0, 3).map(a => (
                        <div
                          key={a.id}
                          className={`truncate text-xs px-1.5 py-0.5 rounded font-medium cursor-pointer ${colorActividad(a, inscritasSet.has(a.id))}`}
                          onClick={e => {
                            e.stopPropagation()
                            setPopover(popover?.fecha === key ? null : { fecha: key, acts: actsDelDia })
                          }}
                        >
                          {a.hora_inicio && <span className="opacity-70">{a.hora_inicio.slice(0, 5)} </span>}
                          {a.titulo}
                        </div>
                      ))}
                      {actsDelDia.length > 3 && (
                        <p className="text-xs text-gray-400 pl-1.5">+{actsDelDia.length - 3} más</p>
                      )}
                      {actsDelDia.length === 0 && modo === 'admin' && esMesActual && (
                        <div className="text-xs text-gray-200 pl-1 opacity-0 group-hover:opacity-100">+ nueva</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 px-6 py-3 border-t border-gray-100 bg-gray-50/50">
          <span className="text-xs text-gray-400 font-medium">Leyenda:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-green-200 border border-green-300 inline-block" />
            <span className="text-xs text-gray-500">Gratuita</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-orange-200 border border-orange-300 inline-block" />
            <span className="text-xs text-gray-500">De pago</span>
          </div>
          {modo === 'socio' && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-blue-600 inline-block" />
              <span className="text-xs text-gray-500">Inscrito/a</span>
            </div>
          )}
          {modo === 'admin' && (
            <>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-gray-100 border border-dashed border-gray-300 inline-block" />
                <span className="text-xs text-gray-500">Borrador</span>
              </div>
              <span className="text-xs text-gray-400 ml-auto">Clic en día vacío para crear actividad</span>
            </>
          )}
        </div>
      </div>

      {/* Popover */}
      {popover && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-4 bg-black/20" onClick={() => setPopover(null)}>
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <p className="font-semibold text-gray-900 text-sm">
                {new Date(popover.fecha + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              <button onClick={() => setPopover(null)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
            </div>
            <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
              {popover.acts.map(a => (
                <div key={a.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">{a.titulo}</p>
                      <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-500">
                        {a.hora_inicio && <span>🕐 {a.hora_inicio.slice(0, 5)}</span>}
                        {a.lugar && <span>📍 {a.lugar}</span>}
                        <span className={a.precio === 0 ? 'text-green-700' : 'text-orange-700'}>
                          {a.precio === 0 ? 'Gratuita' : `${Number(a.precio).toFixed(2)} €`}
                        </span>
                        {inscritasSet.has(a.id) && <span className="text-blue-700 font-medium">✓ Inscrito/a</span>}
                        {modo === 'admin' && a.estado === 'borrador' && <span className="text-gray-400 italic">borrador</span>}
                        {modo === 'admin' && a.estado === 'cancelada' && <span className="text-red-500">cancelada</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <Link
                      href={modo === 'admin' ? `/admin/actividades/${a.id}` : `/socio/actividades/${a.id}`}
                      className="flex-1 text-center text-xs bg-blue-700 text-white py-1.5 rounded-lg font-medium hover:bg-blue-800 transition"
                      onClick={() => setPopover(null)}
                    >
                      {modo === 'admin' ? 'Editar' : 'Ver detalle'}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            {modo === 'admin' && (
              <div className="px-4 py-3 border-t border-gray-100">
                <Link
                  href={`/admin/actividades/nueva?fecha=${popover.fecha}`}
                  className="block text-center text-xs text-blue-600 hover:text-blue-800 font-medium"
                  onClick={() => setPopover(null)}
                >
                  + Crear otra actividad en esta fecha
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
