import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/admin/ProtectedRoute'
import PublicLayout from './components/layout/PublicLayout'
import HomePage from './pages/public/HomePage'

// Ces pages ne sont téléchargées que lorsqu'on les ouvre : l'accueil se charge plus vite.
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'))
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage'))
const LoginPage = lazy(() => import('./pages/admin/LoginPage'))
const AdvertsPage = lazy(() => import('./pages/admin/AdvertsPage'))
const AccountingPage = lazy(() => import('./pages/admin/AccountingPage'))
const OrdersPage = lazy(() => import('./pages/admin/OrdersPage'))
const ProductsPage = lazy(() => import('./pages/admin/ProductsPage'))
const SettingsPage = lazy(() => import('./pages/admin/SettingsPage'))
const StaffPage = lazy(() => import('./pages/admin/StaffPage'))
const TeamPage = lazy(() => import('./pages/admin/TeamPage'))
const CartPage = lazy(() => import('./pages/public/CartPage'))
const CatalogPage = lazy(() => import('./pages/public/CatalogPage'))
const ContactPage = lazy(() => import('./pages/public/ContactPage'))
const NotFoundPage = lazy(() => import('./pages/public/NotFoundPage'))
const ProductPage = lazy(() => import('./pages/public/ProductPage'))

function Loading() {
  return <p className="p-8 text-center text-slate-500">Chargement…</p>
}

// Affiche une page chargée à la demande, avec un message pendant le téléchargement
function page(Page: React.ComponentType) {
  return (
    <Suspense fallback={<Loading />}>
      <Page />
    </Suspense>
  )
}

export default function App() {
  return (
    <Routes>
      {/* Site public : toutes ces pages partagent l'en-tête et le pied de page */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/produits" element={page(CatalogPage)} />
        <Route path="/produits/:slug" element={page(ProductPage)} />
        <Route path="/panier" element={page(CartPage)} />
        <Route path="/contact" element={page(ContactPage)} />
        <Route path="*" element={page(NotFoundPage)} />
      </Route>

      {/* Espace professionnel */}
      <Route path="/admin/login" element={page(LoginPage)} />
      <Route path="/admin" element={<ProtectedRoute />}>
        <Route element={page(AdminLayout)}>
          <Route index element={page(DashboardPage)} />

          <Route element={<ProtectedRoute module="stock" />}>
            <Route path="stock" element={page(ProductsPage)} />
          </Route>
          <Route element={<ProtectedRoute module="sales" />}>
            <Route path="ventes" element={page(OrdersPage)} />
          </Route>
          <Route element={<ProtectedRoute module="staff" />}>
            <Route path="personnel" element={page(StaffPage)} />
          </Route>
          <Route element={<ProtectedRoute module="accounting" />}>
            <Route path="comptabilite" element={page(AccountingPage)} />
          </Route>
          <Route element={<ProtectedRoute module="advertising" />}>
            <Route path="publicite" element={page(AdvertsPage)} />
          </Route>

          <Route element={<ProtectedRoute ownerOnly />}>
            <Route path="parametres" element={page(SettingsPage)} />
            <Route path="equipe" element={page(TeamPage)} />
          </Route>
        </Route>
      </Route>
    </Routes>
  )
}