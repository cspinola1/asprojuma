'use client'

import { useState } from 'react'
import { cambiarEstadoCuota, eliminarCuota } from './actions'
import { EstadoCuota } from '@/lib/types'

export function AccionEstado({ id, estadoActual }: { id: number; estadoActual: EstadoCuota }) {
  const [loading, setLoading] = useState(false)

  async function cambiar(estado: EstadoCuota) {
    setLoading(true)
    await cambiarEstadoCuota(id, estado)
    setLoading(false)
  }

  if (loading) return <span className="text-xs text-gray-400">...</span>

  return (
    <div className="flex gap-1">
      {estadoActual === 'pendiente' && (
        <button
          onClick={() => cambiar('cobrado')}
          className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded hover:bg-green-200 transition"
        >
          Cobrar
        </button>
      )}
      {estadoActual === 'cobrado' && (
        <button
          onClick={() => cambiar('devuelto')}
          className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded hover:bg-red-200 transition"
        >
          Devolver
        </button>
      )}
      {(estadoActual === 'devuelto' || estadoActual === 'pendiente') && (
        <button
          onClick={() => cambiar('exento')}
          className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded hover:bg-gray-200 transition"
        >
          Exento
        </button>
      )}
      {estadoActual !== 'pendiente' && (
        <button
          onClick={() => cambiar('pendiente')}
          className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded hover:bg-yellow-200 transition"
        >
          Pendiente
        </button>
      )}
    </div>
  )
}

export function AccionEliminar({ id }: { id: number }) {
  const [loading, setLoading] = useState(false)

  async function handleEliminar() {
    if (!confirm('¿Eliminar esta cuota?')) return
    setLoading(true)
    await eliminarCuota(id)
    setLoading(false)
  }

  return (
    <button
      onClick={handleEliminar}
      disabled={loading}
      className="text-xs text-red-400 hover:text-red-700 transition disabled:opacity-50"
    >
      {loading ? '...' : 'Eliminar'}
    </button>
  )
}
