import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-5xl font-bold text-brand-800">404</h1>
      <p className="mt-2 text-slate-600">Cette page n'existe pas.</p>
      <Link to="/" className="mt-6 inline-block rounded-lg bg-brand-700 px-5 py-2 font-semibold text-white hover:bg-brand-800">
        Retour à l'accueil
      </Link>
    </main>
  )
}
