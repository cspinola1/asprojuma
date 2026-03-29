'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthConfirmPage() {
  const router = useRouter()
  const [msg, setMsg] = useState('Verificando enlace…')

  useEffect(() => {
    const supabase = createClient()
    const searchParams = new URLSearchParams(window.location.search)

    // Error devuelto por Supabase (token expirado, inválido, etc.)
    const error = searchParams.get('error_description') ?? searchParams.get('error')
    if (error) {
      const msg = error.toLowerCase().includes('expired') || error.toLowerCase().includes('invalid')
        ? 'El enlace ha caducado o ya fue usado. Solicita uno nuevo.'
        : `Error: ${error.replace(/\+/g, ' ')}`
      setMsg(msg)
      return
    }

    // Caso 1: PKCE flow → ?code=...
    const code = searchParams.get('code')
    if (code) {
      supabase.auth.exchangeCodeForSession(code)
        .then(({ error }) => {
          if (error) setMsg(`Error al verificar: ${error.message}`)
          else router.replace('/nueva-contrasena')
        })
      return
    }

    // Caso 2: token_hash directo → ?token_hash=...&type=...
    const tokenHash = searchParams.get('token_hash')
    const type = searchParams.get('type') as 'recovery' | 'invite' | 'signup' | 'magiclink' | null
    if (tokenHash && type) {
      supabase.auth.verifyOtp({ token_hash: tokenHash, type })
        .then(({ error }) => {
          if (error) setMsg(`Error al verificar: ${error.message}`)
          else router.replace('/nueva-contrasena')
        })
      return
    }

    // Caso 3: Flujo implícito (legacy) → #access_token=...
    const hash = window.location.hash.substring(1)
    if (hash) {
      const params = new URLSearchParams(hash)
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token') ?? ''
      if (accessToken) {
        supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
          .then(({ error }) => {
            if (error) setMsg(`Error al verificar: ${error.message}`)
            else router.replace('/nueva-contrasena')
          })
        return
      }
    }

    setMsg(`Error: no hay token. URL: ${window.location.href}`)
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-md p-8 max-w-sm w-full text-center">
        <p className="text-sm text-gray-600">{msg}</p>
      </div>
    </div>
  )
}
