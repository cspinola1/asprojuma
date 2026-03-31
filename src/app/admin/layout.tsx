import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/admin'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !isAdmin(user)) redirect('/')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-bold text-lg">ASPROJUMA · Admin</span>
            <nav className="flex gap-4 text-sm">
              <Link href="/admin" className="hover:text-blue-200 transition">Dashboard</Link>
              <Link href="/admin/solicitudes" className="hover:text-blue-200 transition">Solicitudes</Link>
              <Link href="/admin/socios" className="hover:text-blue-200 transition">Socios</Link>
              <Link href="/admin/cuotas" className="hover:text-blue-200 transition">Cuotas</Link>
              <Link href="/admin/carnets" className="hover:text-blue-200 transition">Carnets</Link>
              <Link href="/admin/remesas" className="hover:text-blue-200 transition">Remesas</Link>
            </nav>
          </div>
          <div className="flex items-center gap-4 text-sm text-blue-300">
            <span>{user.email}</span>
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
