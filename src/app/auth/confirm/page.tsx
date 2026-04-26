'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Estado = 'cargando' | 'listo' | 'procesando' | 'error'
type Params = { code?: string; tokenHash?: string; type?: string }

export default function AuthConfirmPage() {
  const router = useRouter()
  const [estado, setEstado] = useState<Estado>('cargando')
  const [msg, setMsg] = useState('')
  const [params, setParams] = useState<Params | null>(null)

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search)

    // Error devuelto por Supabase (token expirado, ya usado, etc.)
    const error = sp.get('error_description') ?? sp.get('error')
    if (error) {
      const expirado = error.toLowerCase().includes('expired') || error.toLowerCase().includes('invalid')
      setMsg(expirado
        ? 'El enlace ha caducado o ya fue usado. Solicita uno nuevo desde la página de login.'
        : `Error: ${error.replace(/\+/g, ' ')}`)
      setEstado('error')
      return
    }

    // Caso 1: PKCE flow → ?code=...
    const code = sp.get('code')
    if (code) {
      setParams({ code })
      setEstado('listo')
      return
    }

    // Caso 2: token_hash directo → ?token_hash=...&type=...
    const tokenHash = sp.get('token_hash')
    const type = sp.get('type') ?? undefined
    if (tokenHash && type) {
      setParams({ tokenHash, type })
      setEstado('listo')
      return
    }

    // Caso 3: Flujo implícito (legacy) → #access_token=...
    // Este caso se procesa automáticamente porque no hay token de un solo uso que proteger
    const hash = window.location.hash.substring(1)
    if (hash) {
      const p = new URLSearchParams(hash)
      const accessToken = p.get('access_token')
      const refreshToken = p.get('refresh_token') ?? ''
      if (accessToken) {
        const supabase = createClient()
        supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
          .then(({ error }) => {
            if (error) { setMsg(`Error al verificar: ${error.message}`); setEstado('error') }
            else router.replace('/nueva-contrasena')
          })
        return
      }
    }

    setMsg('No se encontró ningún token de acceso en el enlace.')
    setEstado('error')
  }, [router])

  async function handleConfirmar() {
    if (!params) return
    setEstado('procesando')
    const supabase = createClient()

    let err: { message: string } | null = null

    if (params.code) {
      const { error } = await supabase.auth.exchangeCodeForSession(params.code)
      err = error
    } else if (params.tokenHash && params.type) {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: params.tokenHash,
        type: params.type as 'recovery' | 'invite' | 'signup' | 'magiclink',
      })
      err = error
    }

    if (err) {
      setMsg(`Error al verificar: ${err.message}`)
      setEstado('error')
      return
    }

    router.replace('/nueva-contrasena')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-md p-8 max-w-sm w-full text-center">

        {(estado === 'cargando' || estado === 'procesando') && (
          <p className="text-sm text-gray-500">
            {estado === 'procesando' ? 'Verificando…' : 'Preparando enlace…'}
          </p>
        )}

        {estado === 'listo' && (
          <>
            <div className="mb-6">
              <h1 className="text-xl font-bold text-blue-900">ASPROJUMA</h1>
              <p className="text-sm text-gray-500 mt-1">Verificación de acceso</p>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Pulsa el botón para confirmar tu identidad y establecer tu contraseña.
            </p>
            <button
              onClick={handleConfirmar}
              className="w-full bg-blue-700 text-white py-2.5 rounded-lg font-medium hover:bg-blue-800 transition"
            >
              Confirmar y continuar
            </button>
          </>
        )}

        {estado === 'error' && (
          <>
            <p className="text-sm text-red-600 mb-5">{msg}</p>
            <a
              href="/recuperar-contrasena"
              className="inline-block text-sm text-blue-700 hover:underline"
            >
              ← Solicitar nuevo enlace
            </a>
          </>
        )}

      </div>
    </div>
  )
}
