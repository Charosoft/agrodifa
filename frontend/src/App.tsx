import { Route, Routes } from 'react-router-dom'
import HomePage from './pages/public/HomePage'
import NotFoundPage from './pages/public/NotFoundPage'

// Chaque page du site = une <Route>. On ajoutera /produits, /panier, /contact, /admin...
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
