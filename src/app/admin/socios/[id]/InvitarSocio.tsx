'use client'

import { useState } from 'react'

export function InvitarSocio({ socioId, email }: { socioId: number; email: string }) {
  const [estado, setEstado] = useState<'idle' | 'enviando' | 'ok' | 'error'>('idle')
  const [msg, setMsg] = useState('')

  async function handleInvitar() {
    if (!confirm(`¿Enviar email de acceso a ${email}?`)) return
    setEstado('enviando')
    const res = await fetch('/api/admin/invitar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ socioId, email }),
    })
    const data = await res.json()
    if (data.error) { setEstado('error'); setMsg(data.error) }
    else { setEstado('ok'); setMsg('Email de acceso enviado correctamente') }
  }

  return (
    <div className="mt-4">
      <button
        onClick={handleInvitar}
        disabled={estado === 'enviando' || estado === 'ok'}
        className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition disabled:opacity-50"
      >
        {estado === 'enviando' ? 'Enviando...' : estado === 'ok' ? '✓ Enviado' : '📧 Enviar acceso al socio'}
      </button>
      {msg && (
        <p className={`mt-2 text-sm ${estado === 'ok' ? 'text-green-700' : 'text-red-600'}`}>{msg}</p>
      )}
    </div>
  )
}
