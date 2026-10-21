import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { ADMIN_MODULES } from '../../lib/modules'

const navClass = ({ isActive }: { isActive: boolean }) =>
  `block whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${
    isActive ? 'bg-brand-700 text-white' : 'text-slate-700 hover:bg-brand-50'
  }`

export default function AdminLayout() {
  const { profile, session, isOwner, hasModule, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-slate-50 md:flex">
      <aside className="border-b border-slate-200 bg-white md:min-h-screen md:w-64 md:shrink-0 md:border-b-0 md:border-r">
        <div className="px-4 py-4">
          <span className="text-xl font-extrabold tracking-tight text-brand-800">
            AGRO<span className="text-accent-600">DIFA</span>
          </span>
          <span className="ml-2 text-xs text-slate-500">Espace pro</span>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:overflow-visible">
          <NavLink to="/admin" end className={navClass}>
            Tableau de bord
          </NavLink>
          {ADMIN_MODULES.filter((m) => hasModule(m.module)).map((m) => (
            <NavLink key={m.module} to={m.path} className={navClass}>
              {m.label}
            </NavLink>
          ))}
          {isOwner && (
            <NavLink to="/admin/parametres" className={navClass}>
              Paramètres
            </NavLink>
          )}
        </nav>
      </aside>

      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
          <p className="text-sm text-slate-600">
            {profile?.full_name || session?.user.email}
            <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-800">
              {isOwner ? 'Propriétaire' : 'Employé'}
            </span>
          </p>
          <button onClick={signOut} className="text-sm font-semibold text-accent-600 hover:text-accent-700">
            Déconnexion
          </button>
        </header>
        <main className="p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
