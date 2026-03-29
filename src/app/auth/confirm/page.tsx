'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// Procesa tokens de invitación y recuperación que llegan en el hash (#access_token=...)
// createBrowserClient de @supabase/ssr no los parsea automáticamente,
// por lo que hay que leerlos manualmente y llamar a setSession.
export default function AuthConfirmPage() {
  const router = useRouter()

  useEffect(() => {
    const hash = window.location.hash.substring(1)
    if (!hash) {
      router.replace('/login?error=enlace_invalido')
      return
    }

    const params = new URLSearchParams(hash)
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')

    if (!accessToken || !refreshToken) {
      router.replace('/login?error=enlace_invalido')
      return
    }

    const supabase = createClient()
    supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error }) => {
        if (error) {
          router.replace('/login?error=enlace_invalido')
        } else {
          router.replace('/nueva-contrasena')
        }
      })
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-sm text-gray-400">Verificando enlace…</p>
    </div>
  )
}
