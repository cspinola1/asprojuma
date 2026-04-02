import Link from 'next/link'
import { ActividadForm } from '../ActividadForm'

export default function NuevaActividadPage() {
  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/actividades" className="text-sm text-blue-600 hover:text-blue-800">← Actividades</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Nueva actividad</h1>
      </div>
      <ActividadForm modo="nueva" />
    </div>
  )
}
