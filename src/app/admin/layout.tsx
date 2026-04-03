import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getRol, PERMISOS, Rol } from '@/lib/roles'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email) redirect('/login')

  const rol = await getRol(user.email)
  if (!rol) redirect('/')

  const puede = (permiso: string) => PERMISOS[permiso]?.includes(rol as Rol) ?? false

  const ROL_LABEL: Record<string, string> = {
    tesorero: 'Tesorero',
    secretario: 'Secretario',
    junta: 'Junta',
    presidente: 'Presidente',
    admin: 'Admin',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-bold text-lg">ASPROJUMA · Admin</span>
            <nav className="flex gap-4 text-sm flex-wrap">
              {puede('dashboard') && <Link href="/admin" className="hover:text-blue-200 transition">Dashboard</Link>}
              {puede('solicitudes') && <Link href="/admin/solicitudes" className="hover:text-blue-200 transition">Solicitudes</Link>}
              {puede('socios') && <Link href="/admin/socios" className="hover:text-blue-200 transition">Socios</Link>}
              {puede('cuotas') && <Link href="/admin/cuotas" className="hover:text-blue-200 transition">Cuotas</Link>}
              {puede('carnets') && <Link href="/admin/carnets" className="hover:text-blue-200 transition">Carnets</Link>}
              {puede('remesas') && <Link href="/admin/remesas" className="hover:text-blue-200 transition">Remesas</Link>}
              {puede('actividades') && <Link href="/admin/actividades" className="hover:text-blue-200 transition">Actividades</Link>}
              {puede('roles') && <Link href="/admin/roles" className="hover:text-blue-200 transition">Roles</Link>}
            </nav>
          </div>
          <div className="flex items-center gap-4 text-sm text-blue-300">
            <span className="bg-blue-800 px-2 py-0.5 rounded text-blue-200 text-xs font-medium">
              {ROL_LABEL[rol]}
            </span>
            <span>{user.email}</span>
            <Link href="/socio" className="hover:text-white transition">Área socio</Link>
            <form action="/api/auth/logout" method="POST">
              <button className="hover:text-white transition">Cerrar sesión</button>
            </form>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
