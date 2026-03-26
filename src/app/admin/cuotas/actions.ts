'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { EstadoCuota } from '@/lib/types'

export async function cambiarEstadoCuota(
  id: number,
  estado: EstadoCuota,
  fecha_cobro?: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('cuotas')
    .update({
      estado,
      fecha_cobro: estado === 'cobrado' ? (fecha_cobro ?? new Date().toISOString().split('T')[0]) : null,
    })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/admin/cuotas')
  return {}
}

export async function eliminarCuota(id: number): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from('cuotas').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/cuotas')
  return {}
}

export async function crearCuota(data: {
  socio_id: number
  anio: number
  semestre: 1 | 2
  importe: number
  estado: EstadoCuota
  fecha_cobro?: string
  metodo_pago: string
  referencia_remesa?: string
  notas?: string
}): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from('cuotas').insert(data)
  if (error) return { error: error.message }
  revalidatePath('/admin/cuotas')
  return {}
}
