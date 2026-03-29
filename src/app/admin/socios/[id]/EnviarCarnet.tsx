'use client'

import { useState } from 'react'

export function EnviarCarnet({ socioId, email }: { socioId: number; email: string }) {
  const [estado, setEstado] = useState<'idle' | 'enviando' | 'ok' | 'error'>('idle')
  const [msg, setMsg] = useState('')

  async function handleEnviar() {
    if (!confirm(`¿Enviar el carnet ${new Date().getFullYear()} a ${email}?`)) return
    setEstado('enviando')
    const res = await fetch('/api/admin/enviar-carnet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ socioId }),
    })
    const data = await res.json()
    if (data.error) { setEstado('error'); setMsg(data.error) }
    else { setEstado('ok'); setMsg('Carnet enviado correctamente') }
  }

  return (
    <div className="mt-4">
      <button
        onClick={handleEnviar}
        disabled={estado === 'enviando' || estado === 'ok'}
        className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition disabled:opacity-50"
      >
        {estado === 'enviando' ? 'Enviando…' : estado === 'ok' ? '✓ Carnet enviado' : '📧 Enviar carnet por email'}
      </button>
      {msg && (
        <p className={`mt-2 text-sm ${estado === 'ok' ? 'text-green-700' : 'text-red-600'}`}>{msg}</p>
      )}
    </div>
  )
}
