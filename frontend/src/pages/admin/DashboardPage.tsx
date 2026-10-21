import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { ADMIN_MODULES } from '../../lib/modules'

export default function DashboardPage() {
  const { profile, hasModule } = useAuth()
  const available = ADMIN_MODULES.filter((m) => hasModule(m.module))

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-800">Bonjour {profile?.full_name || ''} 👋</h1>
      <p className="mt-1 text-slate-600">Voici les sections auxquelles vous avez accès.</p>

      {available.length === 0 ? (
        <p className="mt-6 rounded-lg bg-accent-50 p-4 text-accent-700">
          Aucun module ne vous a encore été attribué. Contactez le propriétaire.
        </p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {available.map((m) => (
            <Link key={m.module} to={m.path} className="rounded-xl border border-slate-200 bg-white p-4 hover:border-brand-600">
              <h2 className="font-semibold text-brand-800">{m.label}</h2>
              <p className="mt-1 text-sm text-slate-500">{m.description}</p>
            </Link>
          ))}
        </div>
      )}
      {/* Les graphiques de statistiques viendront ici (étape tableau de bord) */}
    </div>
  )
}
