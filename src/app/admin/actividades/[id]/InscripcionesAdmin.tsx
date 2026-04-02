'use client'

import { useEffect, useState, useCallback } from 'react'

interface Inscripcion {
  id: number
  estado: 'inscrito' | 'pagado' | 'cancelado'
  fecha_inscripcion: string
  fecha_pago: string | null
  notas: string | null
  socios: {
    num_socio: number | null
    num_cooperante: number | null
    tipo: string
    nombre: string | null
    apellidos: string | null
  }
}

const ESTADO_BADGE: Record<string, string> = {
  inscrito: 'bg-yellow-100 text-yellow-800',
  pagado:   'bg-green-100 text-green-800',
  cancelado:'bg-gray-100 text-gray-500',
}

export function InscripcionesAdmin({ actividadId, precio }: { actividadId: number; precio: number }) {
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([])
  const [cargando, setCargando] = useState(true)
  const [actualizando, setActualizando] = useState<number | null>(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    const res = await fetch(`/api/admin/actividades/${actividadId}/inscripciones`)
    setInscripciones(await res.json())
    setCargando(false)
  }, [actividadId])

  useEffect(() => { cargar() }, [cargar])

  async function marcarPagado(ins: Inscripcion) {
    setActualizando(ins.id)
    await fetch(`/api/admin/actividades/${actividadId}/inscripciones`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inscripcionId: ins.id,
        estado: 'pagado',
        fecha_pago: new Date().toISOString().slice(0, 10),
      }),
    })
    await cargar()
    setActualizando(null)
  }

  async function marcarCancelado(ins: Inscripcion) {
    if (!confirm(`¿Cancelar la inscripción de ${ins.socios.apellidos}, ${ins.socios.nombre}?`)) return
    setActualizando(ins.id)
    await fetch(`/api/admin/actividades/${actividadId}/inscripciones`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inscripcionId: ins.id, estado: 'cancelado' }),
    })
    await cargar()
    setActualizando(null)
  }

  const activas = inscripciones.filter(i => i.estado !== 'cancelado')
  const pendientesPago = activas.filter(i => i.estado === 'inscrito' && precio > 0).length

  function numSocio(i: Inscripcion) {
    return i.socios.tipo === 'profesor' ? String(i.socios.num_socio ?? '—') : `C${i.socios.num_cooperante ?? '—'}`
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Inscritos</h2>
        <div className="flex gap-3 text-xs text-gray-500">
          <span>{activas.length} inscritos</span>
          {pendientesPago > 0 && <span className="text-yellow-700">{pendientesPago} pendiente{pendientesPago !== 1 ? 's' : ''} de pago</span>}
        </div>
      </div>

      {cargando ? (
        <p className="text-sm text-gray-400">Cargando…</p>
      ) : inscripciones.length === 0 ? (
        <p className="text-sm text-gray-400">Nadie inscrito aún.</p>
      ) : (
        <div className="space-y-2">
          {inscripciones.map(i => (
            <div key={i.id} className={`flex items-center justify-between border rounded-lg px-3 py-2 ${i.estado === 'cancelado' ? 'border-gray-100 opacity-50' : 'border-gray-200'}`}>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  <span className="text-gray-400 text-xs mr-2">{numSocio(i)}</span>
                  {i.socios.apellidos}, {i.socios.nombre}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(i.fecha_inscripcion).toLocaleDateString('es-ES')}
                  {i.fecha_pago && ` · Pagado ${new Date(i.fecha_pago).toLocaleDateString('es-ES')}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ESTADO_BADGE[i.estado]}`}>
                  {i.estado}
                </span>
                {i.estado === 'inscrito' && precio > 0 && (
                  <button
                    onClick={() => marcarPagado(i)}
                    disabled={actualizando === i.id}
                    className="text-xs text-green-700 hover:text-green-900 font-medium"
                  >
                    Marcar pagado
                  </button>
                )}
                {i.estado !== 'cancelado' && (
                  <button
                    onClick={() => marcarCancelado(i)}
                    disabled={actualizando === i.id}
                    className="text-xs text-gray-400 hover:text-red-600"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
