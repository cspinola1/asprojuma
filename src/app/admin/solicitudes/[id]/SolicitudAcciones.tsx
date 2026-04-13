'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { aprobarSolicitud, rechazarSolicitud, confirmarAval, reenviarEmailAvalista } from '../actions'

interface Props {
  id: number
  tipo: string
  avalista1?: string | null
  avalista2?: string | null
  aval1Confirmado: boolean
  aval2Confirmado: boolean
  nombreCooperante?: string
  apellidosCooperante?: string
}

function FilaAvalista({
  numero, email, confirmado, idSolicitud, nombre, apellidos,
}: {
  numero: 1 | 2
  email: string | null | undefined
  confirmado: boolean
  idSolicitud: number
  nombre?: string
  apellidos?: string
}) {
  const [cargando, setCargando] = useState(false)
  const [msg, setMsg] = useState('')

  async function handleConfirmar() {
    setCargando(true)
    const res = await confirmarAval(idSolicitud, numero)
    setCargando(false)
    if (res.error) setMsg(res.error)
  }

  async function handleReenviar() {
    if (!email) return
    setCargando(true)
    const res = await reenviarEmailAvalista(idSolicitud, email, nombre ?? '', apellidos ?? '')
    setCargando(false)
    setMsg(res.error ?? '✓ Email reenviado correctamente')
  }

  return (
    <div className={`flex items-center justify-between rounded-lg px-4 py-3 ${confirmado ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
      <div>
        <span className={`text-xs font-semibold uppercase tracking-wide ${confirmado ? 'text-green-700' : 'text-yellow-700'}`}>
          {confirmado ? '✓ Aval confirmado' : '⏳ Pendiente de confirmación'}
        </span>
        <p className="text-sm text-gray-800 mt-0.5">{email ?? '—'}</p>
        {msg && <p className={`text-xs mt-1 ${msg.startsWith('✓') ? 'text-green-600' : 'text-red-600'}`}>{msg}</p>}
      </div>
      {!confirmado && (
        <div className="flex gap-2 ml-4 shrink-0">
          <button
            onClick={handleReenviar}
            disabled={cargando || !email}
            className="text-xs px-3 py-1.5 rounded border border-blue-300 text-blue-700 hover:bg-blue-50 transition disabled:opacity-40"
          >
            Reenviar email
          </button>
          <button
            onClick={handleConfirmar}
            disabled={cargando}
            className="text-xs px-3 py-1.5 rounded bg-green-600 text-white hover:bg-green-700 transition disabled:opacity-40"
          >
            {cargando ? '...' : 'Marcar confirmado'}
          </button>
        </div>
      )}
    </div>
  )
}

export function BotonesAccion({
  id, tipo,
  avalista1, avalista2,
  aval1Confirmado, aval2Confirmado,
  nombreCooperante, apellidosCooperante,
}: Props) {
  const router = useRouter()
  const [cargando, setCargando] = useState<'aprobar' | 'rechazar' | null>(null)
  const [mostrarRechazo, setMostrarRechazo] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState('')

  const avalesPendientes = tipo === 'cooperante' && (!aval1Confirmado || !aval2Confirmado)

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

      {/* Estado de avales (solo cooperante) */}
      {tipo === 'cooperante' && (
        <div className="space-y-2 mb-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Estado de avales</p>
          <FilaAvalista
            numero={1} email={avalista1} confirmado={aval1Confirmado}
            idSolicitud={id} nombre={nombreCooperante} apellidos={apellidosCooperante}
          />
          <FilaAvalista
            numero={2} email={avalista2} confirmado={aval2Confirmado}
            idSolicitud={id} nombre={nombreCooperante} apellidos={apellidosCooperante}
          />
        </div>
      )}

      {error && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
      )}

      {avalesPendientes && (
        <p className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded px-3 py-2">
          ⚠ Confirma los dos avales antes de aprobar la solicitud.
        </p>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleAprobar}
          disabled={!!cargando || avalesPendientes}
          className="bg-green-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
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
