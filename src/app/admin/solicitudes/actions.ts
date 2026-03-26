'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function aprobarSolicitud(id: number): Promise<{ error?: string }> {
  const supabase = await createClient()

  // Obtener el socio pendiente
  const { data: socio } = await supabase
    .from('socios')
    .select('tipo')
    .eq('id', id)
    .single()

  if (!socio) return { error: 'Solicitud no encontrada' }

  const updateData: Record<string, unknown> = {
    estado: 'activo',
    fecha_ingreso: new Date().toISOString().split('T')[0],
    updated_at: new Date().toISOString(),
  }

  if (socio.tipo === 'profesor') {
    // Siguiente número de socio profesor
    const { data: maxRow } = await supabase
      .from('socios')
      .select('num_socio')
      .eq('tipo', 'profesor')
      .not('num_socio', 'is', null)
      .order('num_socio', { ascending: false })
      .limit(1)
      .single()

    updateData.num_socio = (maxRow?.num_socio ?? 146) + 1
  } else {
    // Siguiente número de cooperante
    const { data: maxRow } = await supabase
      .from('socios')
      .select('num_cooperante')
      .eq('tipo', 'cooperante')
      .not('num_cooperante', 'is', null)
      .order('num_cooperante', { ascending: false })
      .limit(1)
      .single()

    updateData.num_cooperante = (maxRow?.num_cooperante ?? 54) + 1
  }

  const { error } = await supabase
    .from('socios')
    .update(updateData)
    .eq('id', id)
    .eq('estado', 'pendiente')

  if (error) return { error: error.message }

  revalidatePath('/admin/solicitudes')
  revalidatePath(`/admin/solicitudes/${id}`)
  revalidatePath('/admin/socios')
  return {}
}

export async function rechazarSolicitud(
  id: number,
  motivo: string
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { data: socio } = await supabase
    .from('socios')
    .select('notas')
    .eq('id', id)
    .single()

  const notasActuales = socio?.notas ?? ''
  const notasNuevas = `RECHAZADA: ${motivo}\n${notasActuales}`.trim()

  const { error } = await supabase
    .from('socios')
    .update({
      estado: 'baja',
      notas: notasNuevas,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('estado', 'pendiente')

  if (error) return { error: error.message }

  revalidatePath('/admin/solicitudes')
  revalidatePath(`/admin/solicitudes/${id}`)
  return {}
}
