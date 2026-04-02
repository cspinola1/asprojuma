'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  actividadId: number
  inscrito: boolean
  pagado: boolean
  sinPlazas: boolean
}

export function InscripcionBoton({ actividadId, inscrito, pagado, sinPlazas }: Props) {
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleClick() {
    setCargando(true)
    setError('')
    const accion = inscrito ? 'cancelar' : 'inscribir'
    const res = await fetch('/api/socio/actividades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actividadId, accion }),
    })
    const data = await res.json()
    if (data.error) { setError(data.error); setCargando(false); return }
    router.refresh()
    setCargando(false)
  }

  if (pagado) {
    return (
      <div className="w-full bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-center">
        <p className="text-sm font-medium text-green-800">✓ Inscripción confirmada y pagada</p>
      </div>
    )
  }

  if (sinPlazas && !inscrito) {
    return (
      <div className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-center">
        <p className="text-sm text-gray-500">No quedan plazas disponibles</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}
      <button
        onClick={handleClick}
        disabled={cargando}
        className={`w-full py-3 rounded-lg text-sm font-medium transition disabled:opacity-50 ${
          inscrito
            ? 'border border-gray-300 text-gray-700 hover:bg-gray-50'
            : 'bg-blue-700 text-white hover:bg-blue-800'
        }`}
      >
        {cargando ? 'Procesando…' : inscrito ? 'Cancelar inscripción' : 'Inscribirse'}
      </button>
      {inscrito && (
        <p className="text-xs text-center text-gray-400">Estás inscrito/a. Puedes cancelar si no puedes asistir.</p>
      )}
    </div>
  )
}
