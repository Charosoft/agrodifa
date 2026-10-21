import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import type { AppModule } from '../../types/database'

interface ProtectedRouteProps {
  module?: AppModule // exige ce module (le propriétaire passe toujours)
  ownerOnly?: boolean // réservé au propriétaire
}

function Message({ title, text, action }: { title: string; text: string; action?: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="text-xl font-bold text-brand-800">{title}</h1>
      <p className="mt-2 text-slate-600">{text}</p>
      {action}
    </div>
  )
}

// Utilisation dans App.tsx : <Route element={<ProtectedRoute module="stock" />}> ... </Route>
export default function ProtectedRoute({ module, ownerOnly }: ProtectedRouteProps) {
  const { session, profile, loading, isOwner, hasModule, signOut } = useAuth()
  const location = useLocation()

  if (loading) return <Message title="Chargement…" text="Un instant." />

  if (!session) return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />

  if (!profile || !profile.is_active) {
    return (
      <Message
        title="Compte indisponible"
        text="Ce compte est désactivé ou introuvable. Contactez le propriétaire."
        action={
          <button onClick={signOut} className="mt-4 rounded-lg bg-brand-700 px-4 py-2 font-semibold text-white hover:bg-brand-800">
            Se déconnecter
          </button>
        }
      />
    )
  }

  if ((ownerOnly && !isOwner) || (module && !hasModule(module))) {
    return <Message title="Accès refusé" text="Vous n'avez pas accès à cette section." />
  }

  return <Outlet />
}
