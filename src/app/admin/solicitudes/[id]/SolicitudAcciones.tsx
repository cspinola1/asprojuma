'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { aprobarSolicitud, rechazarSolicitud } from '../actions'

export function BotonesAccion({ id, tipo }: { id: number; tipo: string }) {
  const router = useRouter()
  const [cargando, setCargando] = useState<'aprobar' | 'rechazar' | null>(null)
  const [mostrarRechazo, setMostrarRechazo] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState('')

  async function handleAprobar() {
    if (!confirm(`¿Aprobar esta solicitud y asignar número de ${tipo === 'profesor' ? 'socio' : 'cooperante'}?`)) return
    setCargando('aprobar')
    const result = await aprobarSolicitud(id)
    if (result.error) { setError(result.error); setCargando(null); return }
    router.push('/admin/solicitudes')
  }

  async function handleRechazar() {
    if (!motivo.trim()) { setError('Indica el motivo del rechazo'); return }
    setCargando('rechazar')
    const result = await rechazarSolicitud(id, motivo)
    if (result.error) { setError(result.error); setCargando(null); return }
    router.push('/admin/solicitudes')
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleAprobar}
          disabled={!!cargando}
          className="bg-green-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 transition disabled:opacity-50"
        >
          {cargando === 'aprobar' ? 'Aprobando...' : '✓ Aprobar solicitud'}
        </button>
        <button
          onClick={() => setMostrarRechazo(!mostrarRechazo)}
          disabled={!!cargando}
          className="bg-red-50 text-red-700 border border-red-200 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-red-100 transition disabled:opacity-50"
        >
          ✗ Rechazar solicitud
        </button>
      </div>

      {mostrarRechazo && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
          <label className="block text-sm font-medium text-red-800">Motivo del rechazo</label>
          <textarea
            value={motivo}
            onChange={e => setMotivo(e.target.value)}
            rows={3}
            placeholder="Indica el motivo para informar al solicitante…"
            className="w-full border border-red-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400"
          />
          <button
            onClick={handleRechazar}
            disabled={!!cargando}
            className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition disabled:opacity-50"
          >
            {cargando === 'rechazar' ? 'Rechazando...' : 'Confirmar rechazo'}
          </button>
        </div>
      )}
    </div>
  )
}
