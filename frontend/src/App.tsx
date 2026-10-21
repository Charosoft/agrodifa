import { Route, Routes } from 'react-router-dom'
import AdminLayout from './components/admin/AdminLayout'
import ProtectedRoute from './components/admin/ProtectedRoute'
import DashboardPage from './pages/admin/DashboardPage'
import LoginPage from './pages/admin/LoginPage'
import ModulePlaceholder from './pages/admin/ModulePlaceholder'
import SettingsPage from './pages/admin/SettingsPage'
import HomePage from './pages/public/HomePage'
import NotFoundPage from './pages/public/NotFoundPage'
import TeamPage from './pages/admin/TeamPage'

export default function App() {
  return (
    <Routes>
      {/* Site public */}
      <Route path="/" element={<HomePage />} />

      {/* Espace professionnel */}
      <Route path="/admin/login" element={<LoginPage />} />
      <Route path="/admin" element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />

          <Route element={<ProtectedRoute module="stock" />}>
            <Route path="stock" element={<ModulePlaceholder title="Produits & stock" />} />
          </Route>
          <Route element={<ProtectedRoute module="sales" />}>
            <Route path="ventes" element={<ModulePlaceholder title="Commandes & ventes" />} />
          </Route>
          <Route element={<ProtectedRoute module="staff" />}>
            <Route path="personnel" element={<ModulePlaceholder title="Personnel" />} />
          </Route>
          <Route element={<ProtectedRoute module="accounting" />}>
            <Route path="comptabilite" element={<ModulePlaceholder title="Comptabilité" />} />
          </Route>
          <Route element={<ProtectedRoute module="advertising" />}>
            <Route path="publicite" element={<ModulePlaceholder title="Publicité" />} />
          </Route>

          <Route element={<ProtectedRoute ownerOnly />}>
            <Route path="parametres" element={<SettingsPage />} />
            <Route path="equipe" element={<TeamPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
