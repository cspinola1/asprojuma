import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { tienePermiso } from '@/lib/roles'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !await tienePermiso(user, 'roles')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('admin_roles')
    .select('*')
    .order('rol')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !await tienePermiso(user, 'roles')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { email, nombre, rol } = await request.json() as { email: string; nombre?: string; rol: string }
  if (!email || !rol) return NextResponse.json({ error: 'email y rol son obligatorios' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin
    .from('admin_roles')
    .upsert({ email: email.trim().toLowerCase(), nombre: nombre?.trim() || null, rol }, { onConflict: 'email' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !await tienePermiso(user, 'roles')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { id } = await request.json() as { id: number }
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin.from('admin_roles').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
