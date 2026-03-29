'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function RecuperarContrasenaPage() {
  const [email, setEmail] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) { setError('Introduce tu email'); return }
    setCargando(true)
    setError('')

    const supabase = createClient()
    const redirectTo = `${window.location.origin}/auth/confirm`
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    })

    setCargando(false)
    if (error) { setError(error.message); return }
    setEnviado(true)
  }

  if (enviado) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-md p-10 max-w-md text-center">
          <div className="text-5xl mb-4">📧</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Email enviado</h2>
          <p className="text-sm text-gray-500 mb-6">
            Si tu email está registrado, recibirás un enlace para restablecer tu contraseña.
            Revisa también la carpeta de spam.
          </p>
          <Link href="/login" className="text-blue-600 hover:text-blue-800 text-sm">
            ← Volver al inicio de sesión
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-blue-900">ASPROJUMA</h1>
          <p className="text-sm text-gray-500 mt-1">Recuperar contraseña</p>
        </div>

        <p className="text-sm text-gray-600 mb-5">
          Introduce tu email y te enviaremos un enlace para restablecer tu contraseña.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="tu@email.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded p-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-blue-700 text-white py-2 rounded-lg font-medium hover:bg-blue-800 transition disabled:opacity-50"
          >
            {cargando ? 'Enviando...' : 'Enviar enlace'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-500">
          <Link href="/login" className="hover:text-blue-700">← Volver al inicio de sesión</Link>
        </div>
      </div>
    </div>
  )
}
