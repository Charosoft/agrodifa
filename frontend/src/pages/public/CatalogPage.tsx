import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductCard from '../../components/products/ProductCard'
import { useUsdRate } from '../../hooks/useUsdRate'
import { PRODUCT_SELECT } from '../../lib/products'
import { supabase } from '../../lib/supabase'
import type { Category, ProductWithImages } from '../../types/database'

type Sort = 'recent' | 'price_asc' | 'price_desc' | 'name'

export default function CatalogPage() {
  const rate = useUsdRate()
  const [params, setParams] = useSearchParams()
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<ProductWithImages[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<Sort>('recent')

  const activeCat = params.get('cat') // la catégorie choisie est dans l'adresse : /produits?cat=volaille

  useEffect(() => {
    document.title = 'Nos produits | AGRODIFA'
    Promise.all([
      supabase.from('categories').select('id, name, slug').order('name'),
      supabase.from('products').select(PRODUCT_SELECT).eq('is_active', true).order('created_at', { ascending: false }),
    ]).then(([cats, prods]) => {
      setCategories((cats.data as Category[]) ?? [])
      setProducts((prods.data as ProductWithImages[]) ?? [])
      setLoading(false)
    })
  }, [])

  const visible = useMemo(() => {
    const catId = categories.find((c) => c.slug === activeCat)?.id
    const q = search.trim().toLowerCase()
    const list = products.filter(
      (p) => (!catId || p.category_id === catId) && (!q || p.name.toLowerCase().includes(q)),
    )
    if (sort === 'price_asc') list.sort((a, b) => a.price - b.price)
    if (sort === 'price_desc') list.sort((a, b) => b.price - a.price)
    if (sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name, 'fr'))
    return list
  }, [products, categories, activeCat, search, sort])

  function chooseCategory(slug: string | null) {
    if (slug) setParams({ cat: slug })
    else setParams({})
  }

  const chip = (active: boolean) =>
    `rounded-full border px-4 py-1.5 text-sm font-semibold ${
      active ? 'border-brand-700 bg-brand-700 text-white' : 'border-slate-300 bg-white text-slate-700 hover:border-brand-600'
    }`

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-brand-800">Nos produits</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={() => chooseCategory(null)} className={chip(!activeCat)}>Tous</button>
        {categories.map((c) => (
          <button key={c.id} onClick={() => chooseCategory(c.slug)} className={chip(activeCat === c.slug)}>
            {c.name}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un produit…"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-600 focus:outline-none sm:w-72"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          className="rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-600 focus:outline-none"
        >
          <option value="recent">Plus récents</option>
          <option value="price_asc">Prix croissant</option>
          <option value="price_desc">Prix décroissant</option>
          <option value="name">Nom (A–Z)</option>
        </select>
      </div>

      {loading ? (
        <p className="mt-8 text-slate-500">Chargement…</p>
      ) : visible.length === 0 ? (
        <p className="mt-8 text-slate-500">Aucun produit ne correspond.</p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {visible.map((p) => (
            <ProductCard key={p.id} product={p} rate={rate} />
          ))}
        </div>
      )}
    </main>
  )
}