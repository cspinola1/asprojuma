import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdmin } from '@/lib/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // Verificar que el solicitante es admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { email } = await request.json()
  if (!email) return NextResponse.json({ error: 'Email requerido' }, { status: 400 })

  try {
    const adminClient = createAdminClient()
    const { error } = await adminClient.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?type=invite`,
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
