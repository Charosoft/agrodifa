import { Link } from 'react-router-dom'
import { SITE } from '../../lib/site'

const YEAR = new Date().getFullYear()

const LINKS = [
  { to: '/', label: 'Accueil' },
  { to: '/produits', label: 'Nos produits' },
  { to: '/panier', label: 'Mon panier' },
  { to: '/contact', label: 'Nous contacter' },
]

const linkClass = 'text-white/80 hover:text-white hover:underline'

export default function Footer() {
  return (
    <footer className="mt-16 border-t-4 border-accent-600 bg-brand-900 text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-3">
        {/* Marque */}
        <div>
          <Link to="/" className="text-2xl font-extrabold tracking-tight">
            AGRO<span className="text-accent-500">DIFA</span>
          </Link>
          <p className="mt-3 max-w-xs text-white/80">Mangez bio vous épargne de l'hôpital…</p>
          <p className="mt-2 max-w-xs text-sm text-white/60">
            Produits agro-pastoraux bio, frais et de qualité. Commandez en ligne en quelques clics.
          </p>
        </div>

        {/* Navigation */}
        <nav aria-label="Navigation du pied de page">
          <h2 className="font-semibold uppercase tracking-wide text-white">Navigation</h2>
          <span className="mt-1 block h-0.5 w-8 rounded bg-accent-500" />
          <ul className="mt-4 space-y-2 text-sm">
            {LINKS.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className={linkClass}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Contact */}
        <div>
          <h2 className="font-semibold uppercase tracking-wide text-white">Contact</h2>
          <span className="mt-1 block h-0.5 w-8 rounded bg-accent-500" />
          <ul className="mt-4 space-y-2 text-sm text-white/80">
            <li>
              <a href={`tel:${SITE.phone.replace(/\s/g, '')}`} className={linkClass}>
                {SITE.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${SITE.email}`} className={linkClass}>
                {SITE.email}
              </a>
            </li>
            <li>{SITE.address}</li>
          </ul>
          <a
            href={`https://wa.me/${SITE.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-block rounded-lg bg-white px-4 py-2 text-sm font-semibold text-brand-800 hover:bg-brand-50"
          >
            Écrire sur WhatsApp
          </a>
        </div>
      </div>

      {/* Barre du bas : droits + crédit Charosoft */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-4 text-sm text-white/70 sm:flex-row">
          <p>© {YEAR} AGRODIFA. Tous droits réservés.</p>
          <p>
            Conçu par{' '}
            <a
              href="https://charosoft.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-white underline decoration-accent-500 decoration-2 underline-offset-4 hover:text-accent-500"
            >
              Charosoft
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}