import { Link, NavLink } from 'react-router-dom'
import { useCart } from '../../hooks/useCart'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-semibold ${isActive ? 'text-brand-800' : 'text-slate-600 hover:text-brand-800'}`

// Icône de panier dessinée en SVG : pas besoin d'installer de bibliothèque
function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
      <path d="M2 3h3l2.4 11.2a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.1L21 7H6" />
    </svg>
  )
}

export default function Header() {
  const { count } = useCart()

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link to="/" className="text-xl font-extrabold tracking-tight text-brand-800 sm:text-2xl">
          AGRO<span className="text-accent-600">DIFA</span>
        </Link>
        <nav className="flex items-center gap-3 sm:gap-5">
          <NavLink to="/" end className={linkClass}>Accueil</NavLink>
          <NavLink to="/produits" className={linkClass}>Produits</NavLink>
          <NavLink to="/contact" className={linkClass}>Contact</NavLink>
          <NavLink
            to="/panier"
            aria-label={`Panier, ${count} article${count > 1 ? 's' : ''}`}
            className={({ isActive }) =>
              `relative rounded-full p-2 ${isActive ? 'bg-brand-50 text-brand-800' : 'text-slate-600 hover:bg-brand-50 hover:text-brand-800'}`
            }
          >
            <CartIcon />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-600 px-1 text-xs font-bold text-white">
                {count}
              </span>
            )}
          </NavLink>
        </nav>
      </div>
    </header>
  )
}