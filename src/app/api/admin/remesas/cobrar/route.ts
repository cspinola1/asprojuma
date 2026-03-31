import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdmin } from '@/lib/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { referencia } = await request.json()
  if (!referencia) return NextResponse.json({ error: 'referencia requerida' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin
    .from('cuotas')
    .update({
      estado: 'cobrado',
      fecha_cobro: new Date().toISOString().slice(0, 10),
    })
    .eq('referencia_remesa', referencia)
    .eq('estado', 'pendiente')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
