'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface InvitadoForm {
  nombre: string
  email: string
}

interface InvitadoActual {
  id: number
  nombre: string
  email: string | null
  estado: string
}

interface Props {
  actividadId: number
  inscrito: boolean
  pagado: boolean
  sinPlazas: boolean
  plazasDisponibles: number | null
  precio: number
  precioInvitado: number | null
  invitadosActuales: InvitadoActual[]
}

export function InscripcionBoton({
  actividadId, inscrito, pagado, sinPlazas,
  plazasDisponibles, precio, precioInvitado, invitadosActuales,
}: Props) {
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [invitados, setInvitados] = useState<InvitadoForm[]>([])
  const router = useRouter()

  function añadirInvitado() {
    setInvitados(prev => [...prev, { nombre: '', email: '' }])
  }

  function actualizarInvitado(i: number, campo: keyof InvitadoForm, valor: string) {
    setInvitados(prev => prev.map((inv, idx) => idx === i ? { ...inv, [campo]: valor } : inv))
  }

  function eliminarInvitado(i: number) {
    setInvitados(prev => prev.filter((_, idx) => idx !== i))
  }

  async function handleInscribir() {
    const invitadosValidos = invitados.filter(i => i.nombre.trim())
    if (invitados.some(i => !i.nombre.trim())) {
      setError('El nombre es obligatorio para cada invitado')
      return
    }
    setCargando(true)
    setError('')
    const res = await fetch('/api/socio/actividades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actividadId, accion: 'inscribir', invitados: invitadosValidos }),
    })
    const data = await res.json()
    if (data.error) { setError(data.error); setCargando(false); return }
    router.refresh()
    setCargando(false)
  }

  async function handleCancelar() {
    setCargando(true)
    setError('')
    const res = await fetch('/api/socio/actividades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actividadId, accion: 'cancelar' }),
    })
    const data = await res.json()
    if (data.error) { setError(data.error); setCargando(false); return }
    router.refresh()
    setCargando(false)
  }

  if (pagado) {
    return (
      <div className="space-y-3">
        <div className="w-full bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-center">
          <p className="text-sm font-medium text-green-800">✓ Inscripción confirmada y pagada</p>
        </div>
        {invitadosActuales.length > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Invitados registrados</p>
            {invitadosActuales.map(inv => (
              <p key={inv.id} className="text-sm text-gray-700">{inv.nombre}{inv.email && <span className="text-gray-400 ml-2">{inv.email}</span>}</p>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (inscrito) {
    return (
      <div className="space-y-3">
        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
          <p className="text-sm font-medium text-blue-900">Estás inscrito/a</p>
        </div>
        {invitadosActuales.length > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Invitados registrados</p>
            {invitadosActuales.map(inv => (
              <p key={inv.id} className="text-sm text-gray-700">{inv.nombre}{inv.email && <span className="text-gray-400 ml-2">{inv.email}</span>}</p>
            ))}
          </div>
        )}
        <button
          onClick={handleCancelar}
          disabled={cargando}
          className="w-full py-2.5 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
        >
          {cargando ? 'Procesando…' : 'Cancelar inscripción'}
        </button>
        <p className="text-xs text-center text-gray-400">Cancelar también eliminará tus invitados pendientes de pago.</p>
      </div>
    )
  }

  if (sinPlazas) {
    return (
      <div className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-center">
        <p className="text-sm text-gray-500">No quedan plazas disponibles</p>
      </div>
    )
  }

  const maxInvitados = plazasDisponibles !== null ? Math.max(0, plazasDisponibles - 1) : 20
  const precioAcomp = precioInvitado ?? precio
  const totalPrecio = precio + invitados.length * precioAcomp

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}

      {/* Invitados */}
      {invitados.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Invitados / acompañantes</p>
          {invitados.map((inv, i) => (
            <div key={i} className="flex gap-2 items-start">
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  placeholder="Nombre *"
                  value={inv.nombre}
                  onChange={e => actualizarInvitado(i, 'nombre', e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={inv.email}
                  onChange={e => actualizarInvitado(i, 'email', e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="button"
                onClick={() => eliminarInvitado(i)}
                className="text-gray-400 hover:text-red-500 px-1 py-1.5 text-lg leading-none"
              >×</button>
            </div>
          ))}
          {precioAcomp > 0 && (
            <p className="text-xs text-gray-500">{Number(precioAcomp).toFixed(2)} € por invitado</p>
          )}
        </div>
      )}

      {invitados.length < maxInvitados && (
        <button
          type="button"
          onClick={añadirInvitado}
          className="w-full py-2 rounded-lg text-sm border border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600 transition"
        >
          + Añadir invitado / acompañante
        </button>
      )}

      {precio > 0 && invitados.length > 0 && (
        <p className="text-xs text-gray-500 text-center">
          Total a pagar: {Number(totalPrecio).toFixed(2)} € (tú + {invitados.length} invitado{invitados.length !== 1 ? 's' : ''})
        </p>
      )}

      <button
        onClick={handleInscribir}
        disabled={cargando}
        className="w-full py-3 rounded-lg text-sm font-medium bg-blue-700 text-white hover:bg-blue-800 transition disabled:opacity-50"
      >
        {cargando ? 'Procesando…' : invitados.length > 0 ? `Inscribirse (${1 + invitados.length} personas)` : 'Inscribirse'}
      </button>
    </div>
  )
}
