'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Resultado {
  generados: number
  errores: { id: number; nombre: string; motivo: string }[]
}

export default function CarnetesAdminPage() {
  const [estado, setEstado] = useState<'idle' | 'generando' | 'ok' | 'error'>('idle')
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [msgError, setMsgError] = useState('')
  const anio = new Date().getFullYear()

  async function handleGenerar() {
    if (!confirm(`¿Generar carnets ${anio} para todos los socios activos? Esta operación puede tardar varios minutos.`)) return
    setEstado('generando')
    setResultado(null)
    setMsgError('')

    try {
      const res = await fetch('/api/admin/carnets/generar-anual', { method: 'POST' })
      const data = await res.json()
      if (data.error) {
        setMsgError(data.error)
        setEstado('error')
      } else {
        setResultado(data)
        setEstado('ok')
      }
    } catch {
      setMsgError('Error de red. Inténtalo de nuevo.')
      setEstado('error')
    }
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin" className="text-sm text-blue-600 hover:text-blue-800">
          ← Panel admin
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Carnets {anio}</h1>
        <p className="text-sm text-gray-500 mt-1">
          Genera los carnets digitales del año en curso para todos los socios activos.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 max-w-xl">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
          Generación en lote
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Se generarán los carnets en formato JPG para todos los socios con estado <strong>Activo</strong>,{' '}
          <strong>Exento</strong> u <strong>Honorario</strong> y se guardarán en el almacenamiento.
          Los socios podrán descargarlos desde su área privada.
        </p>
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
          Esta operación puede tardar 2-4 minutos dependiendo del número de socios. No cierres la página.
        </p>

        <button
          onClick={handleGenerar}
          disabled={estado === 'generando'}
          className="bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-800 transition disabled:opacity-50"
        >
          {estado === 'generando'
            ? 'Generando carnets… por favor espera'
            : `Generar carnets ${anio}`}
        </button>

        {estado === 'generando' && (
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
            <svg className="animate-spin h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Procesando socios…
          </div>
        )}

        {estado === 'error' && (
          <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {msgError}
          </p>
        )}

        {estado === 'ok' && resultado && (
          <div className="mt-4 space-y-3">
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-800">
              ✓ {resultado.generados} carnet{resultado.generados !== 1 ? 's' : ''} generado{resultado.generados !== 1 ? 's' : ''} correctamente.
            </div>

            {resultado.errores.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <p className="text-sm font-medium text-red-700 mb-2">
                  {resultado.errores.length} error{resultado.errores.length !== 1 ? 'es' : ''}:
                </p>
                <ul className="text-xs text-red-600 space-y-1">
                  {resultado.errores.map(e => (
                    <li key={e.id}>
                      <span className="font-medium">{e.nombre}</span> — {e.motivo}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
