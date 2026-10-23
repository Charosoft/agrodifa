import { Route, Routes } from 'react-router-dom'
import AdminLayout from './components/admin/AdminLayout'
import ProtectedRoute from './components/admin/ProtectedRoute'
import DashboardPage from './pages/admin/DashboardPage'
import LoginPage from './pages/admin/LoginPage'
import AccountingPage from './pages/admin/AccountingPage'
import OrdersPage from './pages/admin/OrdersPage'
import ProductsPage from './pages/admin/ProductsPage'
import AdvertsPage from './pages/admin/AdvertsPage'
import StaffPage from './pages/admin/StaffPage'
import SettingsPage from './pages/admin/SettingsPage'
import TeamPage from './pages/admin/TeamPage'
import PublicLayout from './components/layout/PublicLayout'
import CartPage from './pages/public/CartPage'
import CatalogPage from './pages/public/CatalogPage'
import ContactPage from './pages/public/ContactPage'
import HomePage from './pages/public/HomePage'
import NotFoundPage from './pages/public/NotFoundPage'
import ProductPage from './pages/public/ProductPage'


export default function App() {
  return (
    <Routes>
      {/* Site public : toutes ces pages partagent l'en-tête et le pied de page */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/produits" element={<CatalogPage />} />
        <Route path="/produits/:slug" element={<ProductPage />} />
        <Route path="/panier" element={<CartPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Espace professionnel */}
      <Route path="/admin/login" element={<LoginPage />} />
      <Route path="/admin" element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />

          <Route element={<ProtectedRoute module="stock" />}>
            <Route path="stock" element={<ProductsPage />} />
          </Route>
          <Route element={<ProtectedRoute module="sales" />}>
            <Route path="ventes" element={<OrdersPage />} />
          </Route>
          <Route element={<ProtectedRoute module="staff" />}>
            <Route path="personnel" element={<StaffPage />} />
          </Route>
          <Route element={<ProtectedRoute module="accounting" />}>
            <Route path="comptabilite" element={<AccountingPage />} />
          </Route>
          <Route element={<ProtectedRoute module="advertising" />}>
            <Route path="publicite" element={<AdvertsPage />} />
          </Route>

          <Route element={<ProtectedRoute ownerOnly />}>
            <Route path="parametres" element={<SettingsPage />} />
            <Route path="equipe" element={<TeamPage />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  )
}