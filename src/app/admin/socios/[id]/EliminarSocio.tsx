'use client'

import { useState } from 'react'

export function EliminarSocio({ socioId, nombre }: { socioId: number; nombre: string }) {
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  async function handleEliminar() {
    if (!confirm(`¿Eliminar definitivamente a "${nombre}"?\n\nEsta acción no se puede deshacer. Se borrarán también sus carnets y cuotas.`)) return
    setCargando(true)
    setError('')
    const res = await fetch(`/api/admin/socios/${socioId}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.error) { setError(data.error); setCargando(false); return }
    window.location.href = '/admin/socios'
  }

  return (
    <div className="mt-2">
      <button
        onClick={handleEliminar}
        disabled={cargando}
        className="text-sm text-red-600 hover:text-red-800 hover:underline disabled:opacity-50"
      >
        {cargando ? 'Eliminando…' : 'Eliminar socio'}
      </button>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
}
