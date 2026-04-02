import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { tienePermiso } from '@/lib/roles'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // Verificar que el solicitante es admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !await tienePermiso(user, 'solicitudes')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { email } = await request.json()
  if (!email) return NextResponse.json({ error: 'Email requerido' }, { status: 400 })

  try {
    const adminClient = createAdminClient()
    const { error } = await adminClient.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm`,
    })

    if (error) {
      // Usuario ya existe → enviar email de recuperación de contraseña
      if (error.message.toLowerCase().includes('already been registered')) {
        const { error: resetError } = await adminClient.auth.resetPasswordForEmail(email, {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm`,
        })
        if (resetError) return NextResponse.json({ error: resetError.message }, { status: 400 })
        return NextResponse.json({ ok: true })
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
