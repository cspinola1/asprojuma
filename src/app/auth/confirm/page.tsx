'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthConfirmPage() {
  const router = useRouter()
  const [msg, setMsg] = useState('Verificando enlace…')

  useEffect(() => {
    const hash = window.location.hash.substring(1)

    if (!hash) {
      setMsg('Error: no hay token en el enlace. Solicita un nuevo enlace.')
      return
    }

    const params = new URLSearchParams(hash)
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token') ?? ''

    if (!accessToken) {
      setMsg('Error: token inválido. Solicita un nuevo enlace.')
      return
    }

    const supabase = createClient()
    supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error }) => {
        if (error) {
          setMsg(`Error al verificar: ${error.message}`)
        } else {
          router.replace('/nueva-contrasena')
        }
      })
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-md p-8 max-w-sm w-full text-center">
        <p className="text-sm text-gray-600">{msg}</p>
      </div>
    </div>
  )
}
