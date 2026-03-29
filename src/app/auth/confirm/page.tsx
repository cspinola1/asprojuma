'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// Página intermedia que procesa tokens de invitación y recuperación de contraseña.
// Supabase envía estos tokens en el hash (#access_token=...) que el servidor nunca ve,
// por lo que se necesita este componente cliente para leerlo y establecer la sesión.
export default function AuthConfirmPage() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY') {
        router.replace('/nueva-contrasena')
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-sm text-gray-400">Verificando enlace…</p>
    </div>
  )
}
