import { Outlet } from 'react-router-dom'
import Footer from './Footer'
import Header from './Header'

// Enveloppe commune à toutes les pages du site client : en-tête + contenu + pied de page.
export default function PublicLayout() {
  return (
    <>
      <Header />
      <Outlet />
      <Footer />
    </>
  )
}