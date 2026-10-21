import { Link } from 'react-router-dom'

export default function Header() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link to="/" className="text-2xl font-extrabold tracking-tight text-brand-800">
          AGRO<span className="text-accent-600">DIFA</span>
        </Link>
        {/* La navigation (Produits, Panier, Contact) viendra à l'étape suivante */}
      </div>
    </header>
  )
}
