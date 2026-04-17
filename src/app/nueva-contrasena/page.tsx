'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

function calcularFortaleza(pwd: string): { nivel: 0 | 1 | 2 | 3; texto: string; color: string } {
  if (pwd.length === 0) return { nivel: 0, texto: '', color: '' }
  const tieneMinimo = pwd.length >= 8
  const tieneNumero = /\d/.test(pwd)
  const tieneMayuscula = /[A-Z]/.test(pwd)
  const tieneEspecial = /[^A-Za-z0-9]/.test(pwd)
  const extras = [tieneNumero, tieneMayuscula, tieneEspecial].filter(Boolean).length

  if (!tieneMinimo) return { nivel: 1, texto: 'Débil', color: 'bg-red-500' }
  if (tieneMinimo && extras >= 2) return { nivel: 3, texto: 'Fuerte', color: 'bg-green-500' }
  if (tieneMinimo && extras >= 1) return { nivel: 2, texto: 'Media', color: 'bg-yellow-500' }
  return { nivel: 1, texto: 'Débil', color: 'bg-red-500' }
}

export default function NuevaContrasenaPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [verPassword, setVerPassword] = useState(false)
  const [verConfirmar, setVerConfirmar] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  const fortaleza = calcularFortaleza(password)
  const tieneMinimo = password.length >= 8
  const tieneNumero = /\d/.test(password)
  const coinciden = password.length > 0 && password === confirmar

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!tieneMinimo) { setError('La contraseña debe tener al menos 8 caracteres'); return }
    if (!tieneNumero) { setError('La contraseña debe incluir al menos un número'); return }
    if (password !== confirmar) { setError('Las contraseñas no coinciden'); return }

    setCargando(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    setCargando(false)
    if (error) { setError('No se pudo actualizar la contraseña: ' + error.message); return }

    router.push('/auth/redirect')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-blue-900">ASPROJUMA</h1>
          <p className="text-sm text-gray-500 mt-1">Establecer contraseña</p>
        </div>

        <p className="text-sm text-gray-600 mb-5">
          Elige una contraseña segura para acceder a tu área de socio.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nueva contraseña */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña</label>
            <div className="relative">
              <input
                type={verPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="Mínimo 8 caracteres"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setVerPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {verPassword ? '🙈' : '👁️'}
              </button>
            </div>

            {/* Barra de fortaleza */}
            {password.length > 0 && (
              <div className="mt-2 space-y-1">
                <div className="flex gap-1 h-1.5">
                  {[1, 2, 3].map(n => (
                    <div
                      key={n}
                      className={`flex-1 rounded-full transition-colors ${fortaleza.nivel >= n ? fortaleza.color : 'bg-gray-200'}`}
                    />
                  ))}
                </div>
                {fortaleza.texto && (
                  <p className={`text-xs font-medium ${fortaleza.nivel === 3 ? 'text-green-600' : fortaleza.nivel === 2 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {fortaleza.texto}
                  </p>
                )}
              </div>
            )}

            {/* Requisitos */}
            {password.length > 0 && (
              <ul className="mt-2 space-y-0.5">
                <li className={`text-xs flex items-center gap-1.5 ${tieneMinimo ? 'text-green-600' : 'text-gray-400'}`}>
                  <span>{tieneMinimo ? '✓' : '·'}</span> Al menos 8 caracteres
                </li>
                <li className={`text-xs flex items-center gap-1.5 ${tieneNumero ? 'text-green-600' : 'text-gray-400'}`}>
                  <span>{tieneNumero ? '✓' : '·'}</span> Al menos un número
                </li>
              </ul>
            )}
          </div>

          {/* Confirmar contraseña */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña</label>
            <div className="relative">
              <input
                type={verConfirmar ? 'text' : 'password'}
                value={confirmar}
                onChange={e => setConfirmar(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setVerConfirmar(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {verConfirmar ? '🙈' : '👁️'}
              </button>
            </div>
            {confirmar.length > 0 && (
              <p className={`text-xs mt-1 flex items-center gap-1.5 ${coinciden ? 'text-green-600' : 'text-red-500'}`}>
                <span>{coinciden ? '✓' : '✗'}</span>
                {coinciden ? 'Las contraseñas coinciden' : 'Las contraseñas no coinciden'}
              </p>
            )}
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded p-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={cargando || !tieneMinimo || !tieneNumero || !coinciden}
            className="w-full bg-blue-700 text-white py-2 rounded-lg font-medium hover:bg-blue-800 transition disabled:opacity-50"
          >
            {cargando ? 'Guardando...' : 'Guardar contraseña'}
          </button>
        </form>
      </div>
    </div>
  )
}
