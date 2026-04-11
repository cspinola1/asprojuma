import { createAdminClient } from '@/lib/supabase/admin'
import RemesasClient, { RemesaResumen } from './RemesasClient'

export default async function RemesasPage() {
  const admin = createAdminClient()
  const { data } = await admin
    .from('cuotas')
    .select('referencia_remesa, anio, semestre, estado, importe')
    .not('referencia_remesa', 'is', null)
    .order('referencia_remesa', { ascending: false })

  const agrupadas = new Map<string, RemesaResumen>()
  for (const c of (data ?? [])) {
    const ref = c.referencia_remesa!
    if (!agrupadas.has(ref)) {
      agrupadas.set(ref, { referencia_remesa: ref, anio: c.anio, semestre: c.semestre, total: 0, cobradas: 0, devueltas: 0, pendientes: 0, importe_total: 0 })
    }
    const r = agrupadas.get(ref)!
    r.total++
    r.importe_total += Number(c.importe)
    if (c.estado === 'cobrado') r.cobradas++
    else if (c.estado === 'devuelto') r.devueltas++
    else r.pendientes++
  }

  return <RemesasClient initialRemesas={Array.from(agrupadas.values())} />
}
