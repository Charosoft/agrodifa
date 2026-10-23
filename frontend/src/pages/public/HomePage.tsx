import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import HeroCarousel from '../../components/home/HeroCarousel'
import ProductCard from '../../components/products/ProductCard'
import { useUsdRate } from '../../hooks/useUsdRate'
import { PRODUCT_SELECT } from '../../lib/products'
import { SITE } from '../../lib/site'
import { supabase } from '../../lib/supabase'
import type { Category, ProductWithImages } from '../../types/database'

const STEPS = [
  { n: '1', title: 'Choisissez', text: 'Parcourez nos produits et leurs photos.' },
  { n: '2', title: 'Ajoutez au panier', text: 'Sélectionnez les quantités qu\'il vous faut.' },
  { n: '3', title: 'Validez', text: 'Laissez vos coordonnées : nous vous contactons pour la suite.' },
]

// Tracés d'icônes (SVG) : pas de bibliothèque à installer
const ICONS = {
  leaf: ['M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z', 'M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12'],
  cart: ['M2 3h3l2.4 11.2a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.1L21 7H6', 'M9 20h.01', 'M18 20h.01'],
  chat: ['M7.9 20A9 9 0 1 0 4 16.1L2 22Z'],
}

const BENEFITS = [
  { icon: ICONS.leaf, title: 'Produits bio', text: 'Des produits agro-pastoraux frais et de qualité.' },
  { icon: ICONS.cart, title: 'Commande simple', text: 'Quelques clics suffisent, sans créer de compte.' },
  { icon: ICONS.chat, title: 'Contact direct', text: 'Une question ? Écrivez-nous sur WhatsApp.' },
]

function SectionTitle({ title, action }: { title: string; action?: { to: string; label: string } }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold text-brand-800">{title}</h2>
        <span className="mt-1 block h-1 w-12 rounded bg-accent-600" />
      </div>
      {action && (
        <Link to={action.to} className="text-sm font-semibold text-accent-600 hover:text-accent-700">
          {action.label}
        </Link>
      )}
    </div>
  )
}

export default function HomePage() {
  const rate = useUsdRate()
  const [categories, setCategories] = useState<Category[]>([])
  const [featured, setFeatured] = useState<ProductWithImages[]>([])

  useEffect(() => {
    supabase.from('categories').select('id, name, slug').order('name').then(({ data }) => setCategories((data as Category[]) ?? []))
    supabase
      .from('products')
      .select(PRODUCT_SELECT)
      .eq('is_active', true)
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(8)
      .then(({ data }) => setFeatured((data as ProductWithImages[]) ?? []))
  }, [])

  return (
    <main className="mx-auto max-w-6xl space-y-16 px-4 py-6">
      <HeroCarousel />

      {/* Points forts */}
      <section className="grid gap-4 sm:grid-cols-3">
        {BENEFITS.map((b) => (
          <div key={b.title} className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {b.icon.map((d) => (
                  <path key={d} d={d} />
                ))}
              </svg>
            </span>
            <div>
              <p className="font-semibold text-brand-800">{b.title}</p>
              <p className="mt-0.5 text-sm text-slate-600">{b.text}</p>
            </div>
          </div>
        ))}
      </section>

      {categories.length > 0 && (
        <section>
          <SectionTitle title="Nos catégories" />
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((c) => (
              <Link
                key={c.id}
                to={`/produits?cat=${c.slug}`}
                className="group rounded-xl border border-slate-200 border-l-4 border-l-accent-600 bg-white p-4 transition hover:border-brand-600 hover:shadow-md"
              >
                <p className="font-semibold text-brand-800">{c.name}</p>
                <p className="mt-1 text-sm text-slate-500 group-hover:text-brand-700">Voir les produits →</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <SectionTitle title="Produits à la une" action={{ to: '/produits', label: 'Voir tout →' }} />
        {featured.length === 0 ? (
          <p className="mt-6 text-slate-500">Les produits mis en avant apparaîtront ici.</p>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} rate={rate} />
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl bg-brand-50 p-6 sm:p-8">
        <SectionTitle title="Comment commander ?" />
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="flex gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-600 font-bold text-white">{s.n}</span>
              <div>
                <p className="font-semibold text-brand-800">{s.title}</p>
                <p className="text-sm text-slate-600">{s.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Appel à l'action */}
      <section className="relative overflow-hidden rounded-2xl bg-linear-to-br from-brand-900 to-brand-700 px-6 py-10 text-center text-white sm:px-12">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-accent-600/70" />
        <div className="relative">
          <h2 className="text-2xl font-extrabold sm:text-3xl">Mangez bio, mangez sain.</h2>
          <p className="mx-auto mt-2 max-w-md text-white/90">Découvrez nos produits ou posez-nous directement vos questions.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/produits" className="rounded-lg bg-accent-600 px-5 py-2.5 font-semibold text-white hover:bg-accent-700">
              Voir tous les produits
            </Link>
            <a
              href={`https://wa.me/${SITE.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-white/70 px-5 py-2.5 font-semibold text-white hover:bg-white/10"
            >
              Écrire sur WhatsApp
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}