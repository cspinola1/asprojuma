'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function AnonimizarSocio({ socioId, nombre }: { socioId: number; nombre: string }) {
  const router = useRouter()
  const [estado, setEstado] = useState<'idle' | 'confirmando' | 'procesando' | 'ok' | 'error'>('idle')
  const [msg, setMsg] = useState('')

  async function handleAnonimizar() {
    setEstado('procesando')
    const res = await fetch('/api/admin/socios/anonimizar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ socioId }),
    })
    const data = await res.json()
    if (data.error) {
      setMsg(data.error)
      setEstado('error')
    } else {
      setEstado('ok')
      router.refresh()
    }
  }

  if (estado === 'confirmando') {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-3">
        <p className="text-sm text-red-800 font-medium">¿Anonimizar datos de {nombre}?</p>
        <p className="text-xs text-red-700">
          Esta acción es <strong>irreversible</strong>. Se eliminarán nombre, DNI, emails, teléfonos, dirección e IBAN.
          Se conservarán los registros de cuotas y el historial de actividad.
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleAnonimizar}
            className="bg-red-700 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-red-800 transition"
          >
            Sí, anonimizar
          </button>
          <button
            onClick={() => setEstado('idle')}
            className="px-3 py-1.5 rounded text-sm border border-gray-300 hover:bg-gray-50 transition"
          >
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  if (estado === 'procesando') {
    return <p className="text-sm text-gray-500">Anonimizando datos…</p>
  }

  if (estado === 'ok') {
    return <p className="text-sm text-green-700 font-medium">Datos anonimizados correctamente.</p>
  }

  return (
    <div>
      <button
        onClick={() => setEstado('confirmando')}
        className="text-sm text-red-700 hover:text-red-900 underline"
      >
        Anonimizar datos (RGPD)
      </button>
      {estado === 'error' && (
        <p className="mt-1 text-xs text-red-600">{msg}</p>
      )}
    </div>
  )
}
